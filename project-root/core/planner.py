"""
core/planner.py
Receives PR file list or raw log text.
Filters infra files for the PR pipeline.
Builds a clean job dict for downstream modules.
"""

from __future__ import annotations
from scanner.detector import is_infra_file


def plan_pr_job(
    pr_files: list[dict],
    repo: str,
    pr_number: int,
    commit_sha: str,
) -> dict:
    """
    Filter PR files to infra-relevant ones only.
    Ignores deleted files.
    Returns a job dict consumed by the scanner.
    """
    infra_files = [
        f for f in pr_files
        if is_infra_file(f.get("filename", ""))
        and f.get("status") != "removed"
    ]

    return {
        "repo":             repo,
        "pr_number":        pr_number,
        "commit_sha":       commit_sha,
        "infra_files":      infra_files,
        "total_pr_files":   len(pr_files),
        "infra_file_count": len(infra_files),
    }


def plan_log_job(log_text: str, source_hint: str = "unknown") -> dict:
    """
    Build a job dict for log analysis.
    """
    return {
        "log_text":    log_text,
        "source_hint": source_hint,
        "line_count":  len(log_text.splitlines()),
    }
