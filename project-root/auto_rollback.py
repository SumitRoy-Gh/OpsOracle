"""
auto_rollback.py
Automatically blocks or allows PR merging based on scan severity.
Called at the end of every PR scan.
"""


from __future__ import annotations
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List




# ── How severe must findings be to block the PR? ──────────────────────────
# Change these to tune how strict OpsOracle is.
BLOCK_ON_SEVERITIES = {"CRITICAL", "HIGH"}   # These severities will block merging
WARN_ON_SEVERITIES  = {"MEDIUM"}             # These just warn but do not block




@dataclass
class RollbackEvent:
    """One recorded rollback/block event."""
    timestamp:    str
    repo:         str
    pr_number:    int
    action:       str   # "BLOCKED" or "ALLOWED" or "WARNED"
    reason:       str
    score:        int
    critical_count: int
    high_count:   int




class AutoRollback:
    """
    Decides whether to block or allow a PR merge.
    Keeps a history of all decisions made this session.
    """


    def __init__(self):
        # This list stores all block/allow events while the server is running.
        # It resets when you restart docker-compose (that is fine).
        self.history: List[RollbackEvent] = []


    def evaluate(self, findings: list, risk_score: int, repo: str, pr_number: int) -> dict:
        """
        Look at all findings and decide: BLOCK, WARN, or ALLOW.


        Returns a dict with:
          action   : "BLOCKED" | "WARNED" | "ALLOWED"
          reason   : Human-readable explanation
          state    : "failure" | "success" (for GitHub API)
          description: Short text shown on the PR
        """
        # Count findings by severity
        critical = sum(1 for f in findings if f.get("severity") == "CRITICAL")
        high     = sum(1 for f in findings if f.get("severity") == "HIGH")
        medium   = sum(1 for f in findings if f.get("severity") == "MEDIUM")


        # ── Decision logic ──────────────────────────────────────────────
        if critical > 0:
            action = "BLOCKED"
            state  = "failure"
            reason = (f"{critical} CRITICAL issue(s) found — merge blocked. "
                      f"Fix all CRITICAL findings before merging.")
            description = f"OpsOracle: BLOCKED — {critical} critical, {high} high issues"


        elif high > 0:
            action = "BLOCKED"
            state  = "failure"
            reason = (f"{high} HIGH severity issue(s) found — merge blocked. "
                      f"Review and fix HIGH findings.")
            description = f"OpsOracle: BLOCKED — {high} high severity issues"


        elif medium > 0:
            action = "WARNED"
            state  = "success"   # WARN does not block — just informs
            reason = (f"{medium} MEDIUM issue(s) found — merge allowed with warnings. "
                      f"Consider fixing before deploying to production.")
            description = f"OpsOracle: WARNING — {medium} medium issues (merge allowed)"


        else:
            action = "ALLOWED"
            state  = "success"
            reason = "No blocking issues found. Safe to merge."
            description = f"OpsOracle: PASSED — score {risk_score}/100"


        # ── Record this event in history ─────────────────────────────────
        event = RollbackEvent(
            timestamp=datetime.now(timezone.utc).isoformat(),
            repo=repo,
            pr_number=pr_number,
            action=action,
            reason=reason,
            score=risk_score,
            critical_count=critical,
            high_count=high,
        )
        self.history.append(event)


        # Print to terminal so you can see what happened
        print(f"[AutoRollback] PR #{pr_number} in {repo}: {action} — {reason}")


        return {
            "action":      action,
            "reason":      reason,
            "state":       state,
            "description": description,
        }


    def get_history(self) -> list:
        """Return all events as plain dicts (for the API endpoint)."""
        return [
            {
                "timestamp":     e.timestamp,
                "repo":          e.repo,
                "pr_number":     e.pr_number,
                "action":        e.action,
                "reason":        e.reason,
                "score":         e.score,
                "critical_count": e.critical_count,
                "high_count":    e.high_count,
            }
            for e in self.history
        ]
