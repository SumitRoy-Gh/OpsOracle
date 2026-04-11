"""
log_analyzer/fix_suggester.py
Converts log analysis output into the unified AnalysisResult schema.
This makes PR results and log results look identical to the API and frontend.
"""

from __future__ import annotations
from schemas import Finding, AnalysisResult


_SEVERITY_SCORE = {
    "CRITICAL": 90,
    "HIGH":     70,
    "MEDIUM":   50,
    "LOW":      30,
    "UNKNOWN":  40,
}


def log_analysis_to_result(analysis: dict, log_text: str) -> AnalysisResult:
    inner    = analysis.get("analysis", {})
    severity = str(inner.get("severity", "MEDIUM")).upper()
    source   = analysis.get("source", "unknown")

    explanation = " — ".join(filter(None, [
        inner.get("root_cause", ""),
        inner.get("probable_cause", ""),
    ]))

    finding = Finding(
        id="log_001",
        title=inner.get("error_type", "Log Error")[:80],
        file="logs",
        line=0,
        severity=severity if severity != "UNKNOWN" else "MEDIUM",
        category="reliability",
        explanation=explanation or "See immediate fix for details.",
        cost_impact=inner.get("cost_impact", "None"),
        compliance=[],
        confidence=float(inner.get("confidence", 0.7)),
        fix_suggestion=inner.get("immediate_fix", "Inspect logs manually."),
        safe_auto_fix=False,
        resource=source,
    )

    actions: list[str] = []
    if inner.get("immediate_fix"):
        actions.append(f"Immediate: {inner['immediate_fix']}")
    if inner.get("safer_command"):
        actions.append(f"Run: {inner['safer_command']}")
    if inner.get("permanent_fix"):
        actions.append(f"Long-term: {inner['permanent_fix']}")
    if inner.get("related_services"):
        services = ", ".join(inner["related_services"])
        actions.append(f"Also check related services: {services}")
    if inner.get("uncertainty"):
        actions.append(f"Note: {inner['uncertainty']}")

    risk_score = _SEVERITY_SCORE.get(severity, 40)
    overall    = severity.capitalize() if severity != "UNKNOWN" else "Unknown"

    return AnalysisResult(
        source_type="log",
        summary=f"Root cause: {inner.get('error_type', 'Unknown error')} "
                f"— {inner.get('root_cause', '')[:80]}",
        overall_severity=overall,
        risk_score=risk_score,
        findings=[finding],
        recommended_actions=actions,
    )
