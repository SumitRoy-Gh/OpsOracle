"""
core/risk_tracker.py
Maintains a sliding window of the last N scans per repository.
Tracks whether a repo's security score is improving, degrading, or stable.

The key questions this answers:
  - "Is this repo getting worse over time?"
  - "How many consecutive PRs have had a declining score?"
  - "What is the average risk score for this repo over the last 10 PRs?"
"""

from __future__ import annotations
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Deque, Optional
import json
from pathlib import Path


# ── Data model for one scan's snapshot ────────────────────────────────────────

@dataclass
class ScanSnapshot:
    """One point in the sliding window — records key metrics from one PR scan."""
    scan_id:          str
    repo:             str
    pr_number:        int
    health_score:     int
    overall_severity: str
    total_findings:   int
    critical_count:   int
    high_count:       int
    medium_count:     int
    low_count:        int
    timestamp:        str

    def to_dict(self) -> dict:
        return {
            "scan_id":          self.scan_id,
            "repo":             self.repo,
            "pr_number":        self.pr_number,
            "health_score":     self.health_score,
            "overall_severity": self.overall_severity,
            "total_findings":   self.total_findings,
            "critical_count":   self.critical_count,
            "high_count":       self.high_count,
            "medium_count":     self.medium_count,
            "low_count":        self.low_count,
            "timestamp":        self.timestamp,
        }


# ── Sliding window for ONE repository ─────────────────────────────────────────

class RepoWindow:
    """
    Holds the last `window_size` scans for a single repository.
    Uses collections.deque which automatically dropped oldest entries when full.
    """

    def __init__(self, repo: str, window_size: int = 10):
        self.repo        = repo
        self.window_size = window_size
        # maxlen means when it fills up, oldest entry is dropped automatically
        self._scans: Deque[ScanSnapshot] = deque(maxlen=window_size)

    def add(self, snapshot: ScanSnapshot) -> None:
        """Add a new scan to the window."""
        self._scans.append(snapshot)

    def get_trend(self) -> str:
        """
        Compare the latest scan score to the previous one.
        Returns: 'improving', 'degrading', 'stable', or 'insufficient_data'
        
        A health score going DOWN means the environment is DEGRADING (more risk).
        A health score going UP means the environment is IMPROVING (less risk).
        We use a 5-point buffer to avoid false alarms from tiny fluctuations.
        """
        if len(self._scans) < 2:
            return "insufficient_data"
        scores = [s.health_score for s in self._scans]
        recent   = scores[-1]   # most recent scan
        previous = scores[-2]   # scan before that
        if recent < previous - 5:
            return "degrading"    # score dropped more than 5 points
        elif recent > previous + 5:
            return "improving"    # score rose more than 5 points
        else:
            return "stable"       # within 5 points either way

    def get_average_score(self) -> float:
        """Average health score across all scans in the window."""
        if not self._scans:
            return 100.0
        return sum(s.health_score for s in self._scans) / len(self._scans)

    def count_consecutive_degrading(self) -> int:
        """
        Count how many consecutive recent PRs have had a LOWER score than the one before.
        """
        scores = [s.health_score for s in self._scans]
        count = 0
        # Walk backwards from the end
        for i in range(len(scores) - 1, 0, -1):
            if scores[i] < scores[i - 1]:
                count += 1
            else:
                break   # stop as soon as we hit a non-degrading scan
        return count

    def get_summary(self) -> dict:
        """
        Build a full summary dict for this repo's window.
        This is what gets returned by the API endpoint.
        """
        if not self._scans:
            return {
                "repo":            self.repo,
                "scans_in_window": 0,
                "trend":           "no_data",
                "alert":           None,
            }

        latest               = self._scans[-1]
        consecutive_degrading = self.count_consecutive_degrading()
        trend                = self.get_trend()

        # Build an alert message if things look bad
        alert = None
        if consecutive_degrading >= 3:
            alert = (
                f"ALERT: Security score has been declining for "
                f"{consecutive_degrading} consecutive PRs. "
                f"Immediate attention required."
            )
        elif trend == "degrading":
            score_drop = self._scans[-2].health_score - latest.health_score
            alert = f"WARNING: Security Health Score decreased by {score_drop} points in the latest PR."

        return {
            "repo":                     self.repo,
            "scans_in_window":          len(self._scans),
            "window_size":              self.window_size,
            "trend":                    trend,
            "average_score":            round(self.get_average_score(), 1),
            "latest_score":             latest.health_score,
            "latest_pr":                latest.pr_number,
            "latest_severity":          latest.overall_severity,
            "consecutive_degrading_prs": consecutive_degrading,
            "alert":                    alert,
            # Full history so the frontend can draw a line chart
            "score_history": [
                {
                    "pr":        s.pr_number,
                    "score":     s.health_score,
                    "severity":  s.overall_severity,
                    "findings":  s.total_findings,
                    "timestamp": s.timestamp,
                }
                for s in self._scans
            ],
        }

    def to_list(self) -> list:
        """Serialize all snapshots to a list of dicts (for saving to disk)."""
        return [s.to_dict() for s in self._scans]


# ── Main RiskTracker class ─────────────────────────────────────────────────────

class RiskTracker:
    """
    Manages sliding windows for ALL repositories.
    
    Usage:
        tracker = RiskTracker(window_size=10)
        tracker.record_scan(scan_id, repo, pr_number, health_score, severity, findings)
        summary = tracker.get_repo_summary("myorg/myrepo")
    """

    def __init__(
        self,
        window_size:   int           = 10,
        persist_path:  Optional[str] = None,
    ):
        """
        window_size   : how many scans to keep per repo (oldest dropped when full)
        persist_path  : optional file path to save windows to disk so they survive restarts
                        e.g. "data/risk_tracker.json"
        """
        self.window_size  = window_size
        self._windows:    dict[str, RepoWindow] = {}
        self._persist_path = Path(persist_path) if persist_path else None

        # Load from disk if the file already exists
        if self._persist_path and self._persist_path.exists():
            self._load()

    # ── Public API ─────────────────────────────────────────────────────────────

    def record_scan(
        self,
        scan_id:          str,
        repo:             str,
        pr_number:        int,
        health_score:     int,
        overall_severity: str,
        findings:         list,
    ) -> dict:
        """
        Record a completed scan in the sliding window for this repo.
        Returns the updated summary for this repo immediately.
        
        `findings` can be a list of Finding objects or plain dicts.
        """
        # Count findings by severity
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for f in findings:
            # Handle both Finding objects and plain dicts
            if isinstance(f, dict):
                sev = f.get("severity", "LOW")
            else:
                sev = getattr(f, "severity", "LOW")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1

        snapshot = ScanSnapshot(
            scan_id          = scan_id,
            repo             = repo,
            pr_number        = pr_number,
            health_score     = health_score,
            overall_severity = overall_severity,
            total_findings   = len(findings),
            critical_count   = severity_counts.get("CRITICAL", 0),
            high_count       = severity_counts.get("HIGH",     0),
            medium_count     = severity_counts.get("MEDIUM",   0),
            low_count        = severity_counts.get("LOW",      0),
            timestamp        = datetime.now(timezone.utc).isoformat(),
        )

        # Create window for this repo if it doesn't exist yet
        if repo not in self._windows:
            self._windows[repo] = RepoWindow(repo, self.window_size)

        self._windows[repo].add(snapshot)

        # Save to disk if persist_path was set
        if self._persist_path:
            self._save()

        summary = self._windows[repo].get_summary()

        # Log alerts to terminal so developers see them
        if summary.get("alert"):
            print(f"[RiskTracker] {summary['alert']}")
        else:
            print(
                f"[RiskTracker] {repo} PR #{pr_number}: "
                f"score={health_score} trend={summary['trend']}"
            )

        return summary

    def get_repo_summary(self, repo: str) -> dict:
        """Get the current sliding window summary for a specific repo."""
        if repo not in self._windows:
            return {
                "repo":            repo,
                "scans_in_window": 0,
                "trend":           "no_data",
                "alert":           None,
                "message":         "No scans recorded for this repo yet",
            }
        return self._windows[repo].get_summary()

    def get_all_repos(self) -> list:
        """Get summaries for ALL repos that have been scanned."""
        return [window.get_summary() for window in self._windows.values()]

    def get_degrading_repos(self) -> list:
        """
        Returns only repos that are currently degrading or have an active alert.
        Useful for a dashboard "repos needing attention" panel.
        """
        result = []
        for window in self._windows.values():
            summary = window.get_summary()
            if summary.get("trend") in ("degrading",) or summary.get("alert"):
                result.append(summary)
        return result

    # ── Persistence ────────────────────────────────────────────────────────────

    def _save(self) -> None:
        """Write all windows to disk as JSON."""
        try:
            data = {repo: window.to_list() for repo, window in self._windows.items()}
            self._persist_path.parent.mkdir(parents=True, exist_ok=True)
            self._persist_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"[RiskTracker] Save failed (non-fatal): {e}")

    def _load(self) -> None:
        """Read windows from disk on startup."""
        try:
            data = json.loads(self._persist_path.read_text(encoding="utf-8"))
            for repo, snapshots in data.items():
                self._windows[repo] = RepoWindow(repo, self.window_size)
                for s in snapshots:
                    # Handle backward compatibility for renamed key
                    if "risk_score" in s:
                        s["health_score"] = s.pop("risk_score")
                    self._windows[repo].add(ScanSnapshot(**s))
            print(f"[RiskTracker] Loaded {len(self._windows)} repo window(s) from disk")
        except Exception as e:
            print(f"[RiskTracker] Load failed (non-fatal): {e}")
