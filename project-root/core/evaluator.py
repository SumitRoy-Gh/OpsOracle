"""
core/evaluator.py
Sends raw scanner findings to Gemini for enrichment.
Gemini explains each finding, ranks severity, estimates cost impact,
maps compliance, and suggests safe fixes.
"""

from __future__ import annotations
import json
from gemini_client import GeminiClient
from schemas import Finding


SYSTEM_PROMPT = """You are a senior DevSecOps engineer and cloud security expert.
You receive raw infrastructure scan findings from a static analysis tool.
Your job is to enrich each finding with:
1. A plain-English explanation a junior developer can act on immediately
2. Accurate severity ranking
3. Cost impact estimate (High / Medium / Low / None)
4. Compliance framework mapping (e.g. CIS AWS 1.2, SOC2 CC6.1, Least Privilege)
5. A safe minimal fix suggestion in one sentence
6. A confidence score from 0.0 to 1.0
7. Whether a safe auto-fix patch can be generated (true only for single-value changes)

Rules:
- Never invent findings that are not in the input
- Never suggest rewriting entire files
- Be specific and actionable
- Return ONLY valid JSON — no markdown, no explanation outside JSON"""


def evaluate_findings(
    raw_findings: list[dict],
    file_context: str = "",
) -> list[Finding]:
    """
    Enrich scanner findings with Gemini reasoning.
    Falls back to basic Finding objects if Gemini fails.
    """
    if not raw_findings:
        return []

    client = GeminiClient()

    prompt = f"""Here are raw infrastructure scan findings that need enrichment:

RAW FINDINGS:
{json.dumps(raw_findings, indent=2)}

FILE CONTEXT (partial, for reference only):
{file_context[:2000] if file_context else "Not provided"}

Return a JSON array. Each element must have exactly these fields:
- id: string (keep original id or generate f_001, f_002 etc.)
- title: string (5 words max, describes the issue)
- file: string (from original finding, keep as-is)
- line: integer (from original finding)
- severity: string (CRITICAL | HIGH | MEDIUM | LOW | INFO)
- category: string (security | cost | reliability | performance)
- explanation: string (2-3 sentences, plain English, junior-developer friendly)
- cost_impact: string (High | Medium | Low | None)
- compliance: array of strings (e.g. ["CIS AWS 1.2", "SOC2 CC6.1"])
- confidence: float between 0.0 and 1.0
- fix_suggestion: string (one clear actionable sentence)
- safe_auto_fix: boolean (true ONLY if fix is changing a single value)
- resource: string (resource name if present in finding, else empty string)

Return the JSON array only. Start with ["""

    try:
        raw_response = client.invoke_json(prompt, SYSTEM_PROMPT)
        # Ensure it starts with [
        if not raw_response.strip().startswith("["):
            raw_response = "[" + raw_response
        data = json.loads(raw_response)
        return [_dict_to_finding(item) for item in data]

    except Exception as e:
        print(f"[Evaluator] Gemini enrichment failed: {e}. Using fallback.")
        return _fallback_findings(raw_findings)


def _dict_to_finding(item: dict) -> Finding:
    return Finding(
        id=str(item.get("id", "f_000")),
        title=str(item.get("title", "Unknown Issue"))[:80],
        file=str(item.get("file", "")),
        line=int(item.get("line", 0)),
        severity=str(item.get("severity", "MEDIUM")).upper(),
        category=str(item.get("category", "security")).lower(),
        explanation=str(item.get("explanation", "")),
        cost_impact=str(item.get("cost_impact", "None")),
        compliance=list(item.get("compliance", [])),
        confidence=float(item.get("confidence", 0.8)),
        fix_suggestion=str(item.get("fix_suggestion", "")),
        safe_auto_fix=bool(item.get("safe_auto_fix", False)),
        resource=str(item.get("resource", "")),
    )


def _fallback_findings(raw_findings: list[dict]) -> list[Finding]:
    """
    Basic conversion when Gemini is unavailable.
    No enrichment — just preserves scanner output.
    """
    results = []
    for i, f in enumerate(raw_findings):
        results.append(Finding(
            id=str(f.get("id", f"f_{i:03d}")),
            title=str(f.get("message", "Issue"))[:80],
            file=str(f.get("file", "")),
            line=int(f.get("line", 0)),
            severity=str(f.get("severity", "MEDIUM")).upper(),
            category=str(f.get("category", "security")).lower(),
            explanation=str(f.get("message", "")),
            cost_impact="None",
            compliance=[],
            confidence=0.7,
            fix_suggestion=str(f.get("suggestion", "")),
            safe_auto_fix=False,
            resource=str(f.get("resource", "")),
        ))
    return results
