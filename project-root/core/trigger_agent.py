"""
core/trigger_agent.py
Smart gatekeeper that decides WHEN to call Gemini AI.
Prevents wasted API calls with caching, cooldowns, and thresholds.
"""


from __future__ import annotations
import hashlib
import time
from typing import Any




class TriggerAgent:
    """
    Decides whether to run full AI enrichment on a set of findings.


    Three checks before calling Gemini:
      1. Minimum findings threshold — do not call AI for zero findings
      2. Content cache — do not re-scan identical file content
      3. Repo cooldown — do not scan same repo twice within cooldown window
    """


    def __init__(
        self,
        min_findings:  int   = 1,     # Skip AI if fewer findings than this
        cooldown_sec:  int   = 60,    # Seconds to wait between scans of same repo
        cache_size:    int   = 200,   # How many file hashes to remember
    ):
        self.min_findings  = min_findings
        self.cooldown_sec  = cooldown_sec
        self.cache_size    = cache_size


        # Maps content_hash → scan result (so identical files reuse old result)
        self._cache:      dict[str, Any] = {}


        # Maps repo_name → timestamp of last scan
        self._last_scan:  dict[str, float] = {}


        # Stats for debugging
        self.stats = {"calls": 0, "cache_hits": 0, "cooldown_skips": 0, "threshold_skips": 0}


    # ── Public API ────────────────────────────────────────────────────────


    def should_enrich(self, raw_findings: list, repo: str, file_contents: dict) -> bool:
        """
        Returns True if Gemini enrichment should run, False to skip.
        Call this BEFORE calling evaluate_findings().
        """
        self.stats["calls"] += 1


        # ── Check 1: Minimum findings threshold ───────────────────────────
        if len(raw_findings) < self.min_findings:
            self.stats["threshold_skips"] += 1
            print(f"[TriggerAgent] Skipping AI — only {len(raw_findings)} finding(s)")
            return False


        # ── Check 2: Repo cooldown ─────────────────────────────────────────
        last = self._last_scan.get(repo, 0)
        elapsed = time.time() - last
        if elapsed < self.cooldown_sec and last > 0:
            remaining = int(self.cooldown_sec - elapsed)
            self.stats["cooldown_skips"] += 1
            print(f"[TriggerAgent] Cooldown active for {repo} — {remaining}s remaining")
            return False


        # ── Check 3: Content cache ─────────────────────────────────────────
        content_hash = self._hash_contents(file_contents)
        if content_hash in self._cache:
            self.stats["cache_hits"] += 1
            print(f"[TriggerAgent] Cache hit for {repo} — reusing previous enrichment")
            return False


        # ── All checks passed — allow Gemini call ─────────────────────────
        print(f"[TriggerAgent] Allowing AI enrichment for {repo}")
        return True


    def record_scan(self, repo: str, file_contents: dict, enriched_result: Any) -> None:
        """
        Call this AFTER a successful Gemini enrichment.
        Updates cooldown timestamp and cache.
        """
        self._last_scan[repo] = time.time()


        content_hash = self._hash_contents(file_contents)
        self._cache[content_hash] = enriched_result


        # Keep cache from growing forever
        if len(self._cache) > self.cache_size:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]


    def get_cached(self, file_contents: dict) -> Any | None:
        """Return cached enrichment result if available, else None."""
        content_hash = self._hash_contents(file_contents)
        return self._cache.get(content_hash)


    def get_stats(self) -> dict:
        """Return debugging stats."""
        return {
            **self.stats,
            "cache_size":      len(self._cache),
            "repos_in_cooldown": sum(
                1 for repo, ts in self._last_scan.items()
                if time.time() - ts < self.cooldown_sec
            ),
        }


    # ── Private helpers ───────────────────────────────────────────────────


    @staticmethod
    def _hash_contents(file_contents: dict) -> str:
        """Create a single hash representing all file contents combined."""
        combined = "".join(
            sorted(f"{k}:{v}" for k, v in file_contents.items())
        )
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
