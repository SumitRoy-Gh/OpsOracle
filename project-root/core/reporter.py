"""
core/reporter.py
Posts inline PR review comments and commit status to GitHub.
Called after the full analysis pipeline completes.
"""

from __future__ import annotations
from github_app.github_client import GitHubClient
from schemas import AnalysisResult, Finding


_EMOJI = {
    "CRITICAL": "🔴",
    "HIGH":     "🟠",
    "MEDIUM":   "🟡",
    "LOW":      "🔵",
    "INFO":     "⚪",
}


def _inline_comment(finding: Finding) -> str:
    lines = [
        f"## {_EMOJI.get(finding.severity, '⚪')} [{finding.severity}] {finding.title}",
        "",
        f"**What this means:** {finding.explanation}",
        "",
        f"**How to fix:** {finding.fix_suggestion}",
    ]
    if finding.cost_impact not in ("None", "", None):
        lines.append(f"\n**Cost Impact:** {finding.cost_impact}")
    if finding.compliance:
        lines.append(f"\n**Compliance:** {', '.join(finding.compliance)}")
    if finding.patch:
        lines.append(f"\n**Suggested patch:**\n```\n{finding.patch}\n```")
    lines.append(f"\n*Confidence: {int(finding.confidence * 100)}% | OpsOracle*")
    return "\n".join(lines)


def _summary_comment(result: AnalysisResult) -> str:
    counts: dict[str, int] = {}
    for f in result.findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1

    lines = [
        "# 🛡️ OpsOracle — Security Review",
        "",
        f"**Risk Level:** {result.overall_severity}  |  "
        f"**Score:** {result.risk_score}/100  |  "
        f"**Findings:** {len(result.findings)}",
        "",
        "| Severity | Count |",
        "|----------|-------|",
    ]
    for sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"):
        c = counts.get(sev, 0)
        if c:
            lines.append(f"| {_EMOJI.get(sev, '')} {sev} | {c} |")

    if result.recommended_actions:
        lines.append("\n## Recommended Actions")
        for action in result.recommended_actions:
            lines.append(f"- {action}")

    lines.append(
        "\n---\n*Automated review by [OpsOracle](https://github.com) — AI DevSecOps*"
    )
    return "\n".join(lines)


def post_pr_review(
    token: str,
    owner: str,
    repo: str,
    pr_number: int,
    commit_sha: str,
    result: AnalysisResult,
    dashboard_url: str = "",
) -> None:
    """
    Post inline comments + summary review + commit status to GitHub.
    """
    client = GitHubClient(token)

    # Build inline comments only for findings with valid line numbers
    inline_comments = [
        {
            "path": f.file,
            "line": f.line,
            "body": _inline_comment(f),
        }
        for f in result.findings
        if f.line and f.line > 0 and f.file and f.file != "logs"
    ]

    # Choose review event
    event = (
        "REQUEST_CHANGES"
        if result.overall_severity in ("Critical", "High")
        else "COMMENT"
    )

    # Post the review
    client.post_review(
        owner=owner,
        repo=repo,
        pr_number=pr_number,
        commit_sha=commit_sha,
        body=_summary_comment(result),
        comments=inline_comments,
        event=event,
    )

    # Set commit status (the green/red check on the PR)
    state = (
        "failure"
        if result.overall_severity in ("Critical", "High")
        else "success"
    )
    description = (
        f"OpsOracle: {len(result.findings)} issue(s) — {result.overall_severity} risk"
    )
    client.set_commit_status(
        owner=owner,
        repo=repo,
        sha=commit_sha,
        state=state,
        description=description,
        target_url=dashboard_url,
    )
