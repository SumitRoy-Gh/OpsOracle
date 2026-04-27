"""
core/learning_store.py
Persists finding outcomes and feedback.
Computes repo-level risk trends from historical data.
Uses flat JSON files — no database required.
"""

from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path


_DATA_DIR   = Path(__file__).parent.parent / "data"
_FINDINGS   = _DATA_DIR / "findings_history.json"
_FEEDBACK   = _DATA_DIR / "feedback_store.json"


def _read(path: Path) -> list:
    try:
        return json.loads(path.read_text())
    except Exception:
        return []


def _write(path: Path, data: list) -> None:
    _DATA_DIR.mkdir(exist_ok=True)
    path.write_text(json.dumps(data, indent=2))


def save_finding_outcome(
    finding_id: str,
    repo: str,
    severity: str,
    fix_accepted: bool,
    false_positive: bool = False,
) -> None:
    history = _read(_FINDINGS)
    history.append({
        "finding_id":    finding_id,
        "repo":          repo,
        "severity":      severity,
        "fix_accepted":  fix_accepted,
        "false_positive": false_positive,
        "timestamp":     datetime.now(timezone.utc).isoformat(),
    })
    _write(_FINDINGS, history)


def save_feedback(
    pr_id: str,
    repo: str,
    accepted: int,
    rejected: int,
    false_positives: int,
) -> None:
    feedback = _read(_FEEDBACK)
    feedback.append({
        "pr_id":           pr_id,
        "repo":            repo,
        "accepted":        accepted,
        "rejected":        rejected,
        "false_positives": false_positives,
        "timestamp":       datetime.now(timezone.utc).isoformat(),
    })
    _write(_FEEDBACK, feedback)


def get_repo_risk_trend(repo: str) -> dict:
    history    = _read(_FINDINGS)
    repo_items = [h for h in history if h.get("repo") == repo]

    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for item in repo_items:
        sev = item.get("severity", "LOW").upper()
        counts[sev] = counts.get(sev, 0) + 1

    risk_score = min(
        100,
        counts["CRITICAL"] * 25 +
        counts["HIGH"]     * 10 +
        counts["MEDIUM"]   *  5 +
        counts["LOW"]      *  2,
    )

    return {
        "repo":           repo,
        "total_findings": len(repo_items),
        "severity_counts": counts,
        "risk_score":     risk_score,
        "most_recent":    repo_items[-1]["timestamp"] if repo_items else None,
    }
