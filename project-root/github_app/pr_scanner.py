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
from core.fix_builder import build_fixes
from core.reporter import post_pr_review
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

    # Step 5: Evaluator — Gemini enriches all findings
    # Pass a small sample of file content as context
    context_sample = "\n\n".join(
        f"# {k}\n{v[:400]}"
        for k, v in list(file_contents.items())[:3]
    )
    enriched = evaluate_findings(all_raw_findings, context_sample)

    # Step 6: Fix Builder — attempts safe patches
    enriched = build_fixes(enriched, file_contents)

    # Step 7: Build unified AnalysisResult
    full_repo = f"{owner}/{repo}"
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

    print(f"[PRScanner] PR #{pr_number} scan complete. "
          f"Findings: {len(enriched)} | Score: {result.risk_score}")

    return result.model_dump()
