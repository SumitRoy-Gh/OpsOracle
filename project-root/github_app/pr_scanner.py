"""
github_app/pr_scanner.py
Orchestrates the full PR analysis pipeline.
Called by webhook_server as a background task.

Pipeline:
Planner → Scanner → Evaluator → Fix Builder → Reporter → DB → Learning Store
"""

from __future__ import annotations
import os

from github_app.auth import get_installation_token
from github_app.github_client import GitHubClient
from github_app.db import save_scan
from scanner.engine import scan_file
from core.planner import plan_pr_job
from core.evaluator import evaluate_findings
from core.trigger_agent import TriggerAgent

# Create shared trigger agent instance
_trigger_agent = TriggerAgent(
    min_findings = 1,   # Must have at least 1 finding to call AI
    cooldown_sec = 60,  # Wait 60 seconds between scans of same repo
)
from core.fix_builder import build_fixes
from core.reporter import post_pr_review
from auto_rollback import AutoRollback

# Create one shared instance at module level
_auto_rollback = AutoRollback()

from core.risk_tracker import RiskTracker

# Persist windows to data/ so they survive restarts
_risk_tracker = RiskTracker(
    window_size  = 10,
    persist_path = "data/risk_tracker.json",
)
from risk_engine import build_analysis_result


def process_pr(
    installation_id: int,
    owner: str,
    repo: str,
    pr_number: int,
    commit_sha: str,
) -> dict:
    """
    Full PR pipeline.
    Returns the final AnalysisResult dict.
    """
    # Step 1: Authenticate with GitHub
    token  = get_installation_token(installation_id)
    client = GitHubClient(token)
    full_repo = f"{owner}/{repo}"

    # Step 2: Fetch all files changed in this PR
    pr_files = client.get_pr_files(owner, repo, pr_number)

    # Step 3: Planner filters to infra files only
    job = plan_pr_job(
        pr_files=pr_files,
        repo=f"{owner}/{repo}",
        pr_number=pr_number,
        commit_sha=commit_sha,
    )

    if not job["infra_files"]:
        print(f"[PRScanner] PR #{pr_number} has no infra files. Skipping.")
        return {"message": "No infra files found in PR", "skipped": True}

    # Step 4: Fetch file contents + run scanner on each file
    all_raw_findings: list[dict] = []
    file_contents:    dict[str, str] = {}

    for pr_file in job["infra_files"]:
        filename = pr_file["filename"]
        content  = client.get_file_content(owner, repo, filename, commit_sha) or ""
        file_contents[filename] = content

        scan_result = scan_file(filename, content)
        if scan_result and scan_result.get("findings"):
            for f in scan_result["findings"]:
                f["file"] = filename   # attach filename to each finding
            all_raw_findings.extend(scan_result["findings"])

    # Step 5: Evaluator — Gemini enriches all findings (with smart trigger)
    context_sample = "\n\n".join(
        f"# {k}\n{v[:400]}"
        for k, v in list(file_contents.items())[:3]
    )

    # ── NEW: Ask the TriggerAgent if we should call Gemini ───────────────
    if _trigger_agent.should_enrich(all_raw_findings, full_repo, file_contents):
        enriched = evaluate_findings(
            all_raw_findings,
            context_sample,
            repo=full_repo,
            pr_number=pr_number
        )
        # Record successful scan so cooldown and cache are updated
        _trigger_agent.record_scan(full_repo, file_contents, enriched)
    else:
        # Either cache hit, cooldown, or no findings — use fallback
        cached = _trigger_agent.get_cached(file_contents)
        if cached:
            enriched = cached  # Reuse previous result
            print(f"[PRScanner] Using cached enrichment for PR #{pr_number}")
        else:
            # No cache and no AI — use basic scanner output
            from core.evaluator import _fallback_findings
            enriched = _fallback_findings(all_raw_findings)
    # ── END NEW CODE ─────────────────────────────────────────────────────

    # Step 6: Fix Builder — attempts safe patches
    enriched = build_fixes(enriched, file_contents)

    # Step 7: Build unified AnalysisResult
    result    = build_analysis_result(
        findings=enriched,
        source_type="pr",
        repo=full_repo,
        pr_number=pr_number,
        commit_sha=commit_sha,
    )

    # Step 8: Save to SQLite DB
    scan_id = save_scan(
        repo=full_repo,
        scan_result=result.model_dump(),
        pr_number=pr_number,
        commit_sha=commit_sha,
    )

    # Step 9: Post review comments + status check to GitHub
    dashboard_url = (
        f"{os.environ.get('DASHBOARD_BASE_URL', '')}/scans/{scan_id}"
    )
    post_pr_review(
        token=token,
        owner=owner,
        repo=repo,
        pr_number=pr_number,
        commit_sha=commit_sha,
        result=result,
        dashboard_url=dashboard_url,
    )

    # ── NEW: Auto-Rollback Decision ─────────────────────────────────────────
    # Convert Finding objects to plain dicts for the evaluator
    findings_as_dicts = [f.model_dump() for f in enriched]

    rollback_result = _auto_rollback.evaluate(
        findings   = findings_as_dicts,
        risk_score = result.risk_score,
        repo       = full_repo,
        pr_number  = pr_number,
    )

    # Override the commit status using the rollback decision
    # (The post_pr_review above already set one, but this overwrites it
    # with the more precise BLOCKED/ALLOWED state)
    override_client = GitHubClient(token)
    override_client.set_commit_status(
        owner=owner,
        repo=repo,
        sha=commit_sha,
        state=rollback_result["state"],
        description=rollback_result["description"],
    )

    print(f"[PRScanner] Auto-Rollback decision: {rollback_result['action']}")
    # ── END NEW CODE ─────────────────────────────────────────────────────────

    print(f"[PRScanner] PR #{pr_number} scan complete. "
          f"Findings: {len(enriched)} | Score: {result.risk_score}")

    # ── NEW: Record this scan in the sliding window ───────────────────────────
    findings_for_tracker = [f.model_dump() for f in enriched]
    risk_summary = _risk_tracker.record_scan(
        scan_id          = scan_id,
        repo             = full_repo,
        pr_number        = pr_number,
        risk_score       = result.risk_score,
        overall_severity = result.overall_severity,
        findings         = findings_for_tracker,
    )
    print(f"[RiskTracker] Window summary: trend={risk_summary['trend']} "
          f"avg={risk_summary['average_score']} "
          f"consecutive_degrading={risk_summary['consecutive_degrading_prs']}")
    # ── END NEW CODE ──────────────────────────────────────────────────────────

    # Fix the broken learning_store — actually call save_finding_outcome
    from core.learning_store import save_finding_outcome
    for finding in enriched:
        save_finding_outcome(
            finding_id     = finding.id,
            repo           = full_repo,
            severity       = finding.severity,
            fix_accepted   = False,
            false_positive = False,
        )

    return result.model_dump()
