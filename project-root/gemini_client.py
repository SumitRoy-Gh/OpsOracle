"""
gemini_client.py
Google Gemini API wrapper.
Replaces NovaClient (AWS Bedrock) entirely.
Used by evaluator, fix_builder, log analyzer, and chat.

Includes:
  - Token-bucket rate limiter (stays under Gemini free-tier RPM)
  - LRU response cache for repeated prompts
  - GeminiRateLimitError for fail-fast interactive use
"""

from __future__ import annotations
import hashlib
import os
import re
import threading
import time
from collections import OrderedDict
from pathlib import Path

import google.genai as genai

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
except ImportError:
    pass


# ── Exceptions ────────────────────────────────────────────────────────────────

class GeminiException(Exception):
    pass


class GeminiRateLimitError(GeminiException):
    pass


# ── Token-bucket rate limiter ─────────────────────────────────────────────────

class _RateLimiter:
    """
    Process-wide token-bucket limiter.
    Gemini free tier allows ~15 requests/min.
    We default to 14 RPM to leave a small buffer.
    """

    def __init__(self, rpm: int = 14):
        self._interval = 60.0 / rpm          # seconds between requests
        self._lock = threading.Lock()
        self._last_call: float = 0.0

    def wait(self):
        """Block until we are allowed to make the next request."""
        with self._lock:
            now = time.monotonic()
            earliest = self._last_call + self._interval
            if now < earliest:
                sleep_for = earliest - now
                time.sleep(sleep_for)
            self._last_call = time.monotonic()

    def try_acquire(self) -> bool:
        """
        Non-blocking: return True if a request is allowed right now,
        False if we'd need to wait. Used by fail-fast paths (chat).
        """
        with self._lock:
            now = time.monotonic()
            earliest = self._last_call + self._interval
            if now >= earliest:
                self._last_call = now
                return True
            return False


# Single process-wide limiter shared by all GeminiClient instances
_limiter = _RateLimiter(rpm=14)


# ── Simple LRU response cache ────────────────────────────────────────────────

class _ResponseCache:
    """Thread-safe LRU cache with TTL for Gemini responses."""

    def __init__(self, maxsize: int = 128, ttl_seconds: int = 300):
        self._maxsize = maxsize
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._cache: OrderedDict[str, tuple[str, float]] = OrderedDict()

    @staticmethod
    def _key(prompt: str) -> str:
        return hashlib.sha256(prompt.encode("utf-8", errors="replace")).hexdigest()

    def get(self, prompt: str) -> str | None:
        k = self._key(prompt)
        with self._lock:
            if k in self._cache:
                value, ts = self._cache[k]
                if time.time() - ts < self._ttl:
                    self._cache.move_to_end(k)
                    return value
                else:
                    del self._cache[k]
        return None

    def put(self, prompt: str, response: str):
        k = self._key(prompt)
        with self._lock:
            self._cache[k] = (response, time.time())
            self._cache.move_to_end(k)
            while len(self._cache) > self._maxsize:
                self._cache.popitem(last=False)


_cache = _ResponseCache(maxsize=128, ttl_seconds=300)


# ── Gemini Client ─────────────────────────────────────────────────────────────

class GeminiClient:
    MODEL_ID = "gemini-2.0-flash"

    def __init__(self, api_key: str | None = None):
        key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Add it to your .env file."
            )
        self._client_genai = genai.Client(api_key=key)
        self._model = self._client_genai.models

    # ── Core invoke ───────────────────────────────────────────────────────

    def invoke(
        self,
        prompt: str,
        system_prompt: str = "",
        max_retries: int = 0,
        fail_fast: bool = False,
        use_cache: bool = False,
    ) -> str:
        """
        Send prompt to Gemini. Returns plain text response.

        Args:
            prompt:       The user prompt.
            system_prompt: Optional system prompt prepended.
            max_retries:  How many times to retry on transient errors.
                          Use 0 for interactive/chat (fail fast).
                          Use 2-3 for background scan/enrichment jobs.
            fail_fast:    If True, raise GeminiRateLimitError immediately
                          on 429 instead of waiting. Best for chat.
            use_cache:    If True, return cached response for identical prompts.
        """
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        # ── Check cache first ─────────────────────────────────────────────
        if use_cache:
            cached = _cache.get(full_prompt)
            if cached is not None:
                return cached

        # ── Attempt loop ──────────────────────────────────────────────────
        for attempt in range(max_retries + 1):
            try:
                # Rate-limit: fail-fast or blocking wait
                if fail_fast:
                    if not _limiter.try_acquire():
                        raise GeminiRateLimitError(
                            "Rate limit: too many requests. Please wait a few seconds and try again."
                        )
                else:
                    _limiter.wait()

                response = self._client_genai.models.generate_content(
                    model=self.MODEL_ID,
                    contents=full_prompt,
                    config={
                        "max_output_tokens": 4096,
                        "temperature": 0.1,
                    }
                )
                text = response.text

                # Cache the successful response
                if use_cache and text:
                    _cache.put(full_prompt, text)

                return text

            except GeminiRateLimitError:
                # Never retry on our own rate-limit guard
                raise

            except Exception as e:
                err_str = str(e)
                is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str

                if is_rate_limit:
                    if fail_fast or attempt >= max_retries:
                        # Pass the exact error from Google so we know if it's RPM or daily quota
                        raise GeminiRateLimitError(
                            f"Gemini API rate limit or quota hit. Google says: {err_str}"
                        ) from e

                    # For background jobs: parse retry-after or use backoff
                    wait_time = (attempt + 1) * 10.0   # 10s, 20s, 30s
                    match = re.search(r"retry in ([\d.]+)s", err_str, re.IGNORECASE)
                    if match:
                        wait_time = float(match.group(1)) + 1.0
                    print(
                        f"[GeminiClient] 429 — waiting {wait_time:.0f}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    time.sleep(wait_time)
                    continue

                # Non-rate-limit error
                if attempt < max_retries:
                    print(f"[GeminiClient] Error: {e}. Retrying ({attempt + 1}/{max_retries})...")
                    time.sleep(2)
                    continue

                raise GeminiException(f"Gemini API call failed: {e}") from e

        # Should not reach here, but just in case
        raise GeminiException("Gemini invoke exhausted all retries")

    # ── JSON variant ──────────────────────────────────────────────────────

    def invoke_json(
        self,
        prompt: str,
        system_prompt: str = "",
        max_retries: int = 0,
        fail_fast: bool = False,
        use_cache: bool = False,
    ) -> str:
        """
        Send prompt to Gemini and instruct it to return JSON only.
        Strips any accidental markdown code fences before returning.
        """
        json_suffix = (
            "\n\nCRITICAL INSTRUCTION: "
            "Return ONLY a valid JSON object or array. "
            "No markdown. No backticks. No explanation before or after. "
            "Start your response with { or [ immediately."
        )
        raw = self.invoke(
            prompt + json_suffix,
            system_prompt,
            max_retries=max_retries,
            fail_fast=fail_fast,
            use_cache=use_cache,
        )
        return self._strip_fences(raw)

    @staticmethod
    def _strip_fences(text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            # Remove opening fence line
            lines = lines[1:]
            # Remove closing fence if present
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text


# Quick test
if __name__ == "__main__":
    client = GeminiClient()
    try:
        print(client.invoke("Say hello in one sentence.", fail_fast=True))
    except GeminiRateLimitError as e:
        print(f"Rate limited: {e}")
    except GeminiException as e:
        print(f"Error: {e}")