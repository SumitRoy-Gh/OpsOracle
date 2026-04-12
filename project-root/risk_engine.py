"""
risk_engine.py
Computes risk scores and overall severity from a list of findings.
Used by both PR pipeline and log analyzer to build the final AnalysisResult.
"""

from __future__ import annotations
from schemas import Finding, AnalysisResult


SEVERITY_WEIGHTS = {
    "CRITICAL": 25,
    "HIGH":     10,
    "MEDIUM":    5,
    "LOW":       2,
    "INFO":      0,
}


def compute_risk_score(findings: list[Finding]) -> int:
    penalty = sum(SEVERITY_WEIGHTS.get(f.severity, 0) for f in findings)
    return max(0, 100 - penalty)


def compute_overall_severity(findings: list[Finding]) -> str:
    if not findings:
        return "Clean"
    severities = {f.severity for f in findings}
    for level in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
        if level in severities:
            return level.capitalize()
    return "Info"


def build_recommended_actions(findings: list[Finding]) -> list[str]:
    actions: list[str] = []
    critical = [f for f in findings if f.severity == "CRITICAL"]
    high     = [f for f in findings if f.severity == "HIGH"]

    if critical:
        actions.append(
            f"Fix {len(critical)} CRITICAL issue(s) immediately — block merge until resolved"
        )
    if high:
        actions.append(
            f"Resolve {len(high)} HIGH severity finding(s) before deployment"
        )

    categories = {f.category for f in findings}
    if "security" in categories:
        actions.append("Run a full security review on all affected files")
    if "cost" in categories:
        actions.append("Review cloud spend projections after applying fixes")
    if "reliability" in categories:
        actions.append("Test reliability fixes in a staging environment first")

    actions.append("Re-run OpsOracle scan after all fixes are applied")
    return actions


def build_analysis_result(
    findings: list[Finding],
    source_type: str,
    repo: str = "",
    pr_number: int | None = None,
    commit_sha: str | None = None,
) -> AnalysisResult:
    risk_score       = compute_risk_score(findings)
    overall_severity = compute_overall_severity(findings)
    high_count       = sum(1 for f in findings if f.severity in ("CRITICAL", "HIGH"))

    summary = (
        f"{len(findings)} issue(s) found — {high_count} high/critical"
        if findings else "No issues found"
    )

    return AnalysisResult(
        source_type=source_type,
        summary=summary,
        overall_severity=overall_severity,
        risk_score=risk_score,
        findings=findings,
        recommended_actions=build_recommended_actions(findings),
        repo=repo,
        pr_number=pr_number,
        commit_sha=commit_sha,
    )
