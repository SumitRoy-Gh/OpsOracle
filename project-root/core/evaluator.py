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
    raw_findings:   list[dict],
    file_context:   str  = "",
    repo:           str  = "",   # ← NEW PARAMETER
    pr_number:      int  = 0,    # ← NEW PARAMETER
) -> list[Finding]:
    """
    Enrich scanner findings with Gemini reasoning.
    Now includes historical context from Pinecone vector DB.
    """
    if not raw_findings:
        return []

    client = GeminiClient()

    # ── NEW: Fetch historical context from Pinecone ───────────────────────
    history_context = ""
    if repo:
        try:
            from rag.pinecone_store import get_repo_history_summary
            history = get_repo_history_summary(repo)
            if history["total_historical"] > 0:
                recurring = history.get("recurring_issues", [])
                history_context = (
                    f"\n\nHISTORICAL CONTEXT FOR REPO {repo}:\n"
                    f"- {history['total_historical']} findings recorded in past scans\n"
                    f"- Severity breakdown: {history['severity_counts']}\n"
                )
                if recurring:
                    history_context += f"- RECURRING ISSUES (seen multiple times): {recurring}\n"
                    history_context += "  NOTE: Highlight recurring issues as patterns, not one-off mistakes.\n"
            print(f"[Evaluator] Added history context: {history['total_historical']} past findings")
        except Exception as e:
            print(f"[Evaluator] Could not load Pinecone history: {e}")
            history_context = ""
    # ── END NEW CODE ──────────────────────────────────────────────────────

    prompt = f"""Here are raw infrastructure scan findings that need enrichment:

RAW FINDINGS:
{json.dumps(raw_findings, indent=2)}

FILE CONTEXT (partial, for reference only):
{file_context[:2000] if file_context else "Not provided"}
{history_context}

Return a JSON array. Each element must have exactly these fields:
- id: string (keep original id or generate f_001, f_002 etc.)
- title: string (5 words max, describes the issue)
- severity: string (CRITICAL | HIGH | MEDIUM | LOW | INFO)
- cost_impact: string (High | Medium | Low | None)
- compliance: array of strings (e.g. ["CIS AWS 1.2", "SOC2 CC6.1"])
- confidence: float between 0.0 and 1.0
- category: string (security | cost | reliability | performance)
- file: string (from original finding, keep as-is)
- line: integer (from original finding)
- explanation: string (2-3 sentences, plain English, junior-developer friendly)
- fix_suggestion: string (one clear actionable sentence)
- safe_auto_fix: boolean (true ONLY if fix is changing a single value)
- resource: string (resource name if present in finding, else empty string)

Return the JSON array only. Start with ["""

    try:
        raw_response = client.invoke_json(prompt, SYSTEM_PROMPT, max_retries=2, use_cache=True)
        if not raw_response.strip().startswith("["):
            raw_response = "[" + raw_response
        data = json.loads(raw_response)
        enriched = [_dict_to_finding(item) for item in data]
        enriched = [_apply_compliance_fallback(f) for f in enriched]

        # ── NEW: Store enriched findings in Pinecone ──────────────────────
        if repo and enriched:
            try:
                from rag.pinecone_store import ingest_findings
                findings_dicts = [f.model_dump() for f in enriched]
                ingest_findings(findings_dicts, repo, pr_number)
            except Exception as e:
                print(f"[Evaluator] Pinecone ingest failed (non-fatal): {e}")
        # ── END NEW CODE ──────────────────────────────────────────────────

        return enriched

    except Exception as e:
        print(f"[Evaluator] Gemini enrichment failed: {e}. Using fallback.")
        return _fallback_findings(raw_findings)


_COMPLIANCE_FALLBACK = {
    "root": {
        "compliance":   ["CIS Docker 4.1", "SOC2 CC6.1", "Least Privilege"],
        "cost_impact":  "Low",
    },
    "secret": {
        "compliance":   ["CIS AWS 1.1", "SOC2 CC6.3", "HIPAA §164.312"],
        "cost_impact":  "High",
    },
    "public": {
        "compliance":   ["CIS AWS 2.1", "SOC2 CC6.6", "HIPAA §164.312"],
        "cost_impact":  "High",
    },
    "encryption": {
        "compliance":   ["CIS AWS 2.2", "SOC2 CC6.7", "HIPAA §164.312(a)"],
        "cost_impact":  "Medium",
    },
    "version": {
        "compliance":   ["SOC2 CC7.1", "CIS Docker 4.8"],
        "cost_impact":  "Low",
    },
    "privilege": {
        "compliance":   ["CIS Docker 4.1", "SOC2 CC6.1"],
        "cost_impact":  "Low",
    },
}


def _apply_compliance_fallback(finding: Finding) -> Finding:
    if finding.compliance and finding.cost_impact not in ("None", "", None):
        return finding  # already fully enriched
    title_lower = finding.title.lower()
    for keyword, data in _COMPLIANCE_FALLBACK.items():
        if keyword in title_lower:
            if not finding.compliance:
                finding.compliance = data["compliance"]
            if finding.cost_impact in ("None", "", None):
                finding.cost_impact = data["cost_impact"]
            print(f"[Evaluator] Applied fallback for: {finding.title}")
            break
    return finding


def _dict_to_finding(item: dict) -> Finding:
    # Warn loudly if enrichment fields are missing
    if not item.get("compliance"):
        print(f"[Evaluator] WARNING: compliance missing for finding {item.get('id', '?')}")
    if not item.get("cost_impact") or item.get("cost_impact") == "None":
        print(f"[Evaluator] WARNING: cost_impact missing for finding {item.get('id', '?')}")

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
        finding = Finding(
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
        )
        results.append(_apply_compliance_fallback(finding))
    return results
