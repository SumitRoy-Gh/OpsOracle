"""
gemini_client.py
Google Gemini API wrapper.
Replaces NovaClient (AWS Bedrock) entirely.
Used by evaluator, fix_builder, log analyzer, and chat.
"""

from __future__ import annotations
import os
from pathlib import Path

import google.genai as genai

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
except ImportError:
    pass


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

    def invoke(self, prompt: str, system_prompt: str = "") -> str:
        """
        Send prompt to Gemini. Returns plain text response.
        """
        import time
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self._client_genai.models.generate_content(
                    model=self.MODEL_ID,
                    contents=full_prompt,
                )
                return response.text
            except Exception as e:
                err_str = str(e)
                # If we hit a rate limit, wait and try again
                if "429" in err_str and attempt < max_retries - 1:
                    wait_time = 30.0
                    import re
                    match = re.search(r"Please retry in ([\d\.]+)s", err_str)
                    if match:
                        wait_time = float(match.group(1)) + 2.0  # Add 2s buffer
                    else:
                        wait_time = (attempt + 1) * 30.0
                        
                    print(f"[GeminiClient] Rate limit hit (429). Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)
                    continue
                raise GeminiException(f"Gemini API call failed: {e}") from e

    def invoke_json(self, prompt: str, system_prompt: str = "") -> str:
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
        raw = self.invoke(prompt + json_suffix, system_prompt)
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


class GeminiException(Exception):
    pass


# Quick test
if __name__ == "__main__":
    client = GeminiClient()
    print(client.invoke("Say hello in one sentence."))

    