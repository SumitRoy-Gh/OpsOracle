"""
log_analyzer/root_cause.py
Sends log text to Gemini for root cause analysis.
Returns a structured dict ready for fix_suggester.
"""

from __future__ import annotations
import json
from gemini_client import GeminiClient
from log_analyzer.parser import detect_log_source, extract_error_lines


SYSTEM_PROMPT = """You are a senior DevOps engineer and incident responder.
You analyze production logs to identify root causes precisely and quickly.
Rules:
1. Separate symptom from actual root cause clearly
2. Be specific — not just "there is an error" but exactly WHY
3. Give the fastest safe fix first, then the permanent fix
4. Note what you are uncertain about
5. Return ONLY valid JSON — no markdown, no text outside the JSON object"""


def analyze_logs(log_text: str) -> dict:
    """
    Full log analysis.
    Returns structured dict with source, analysis, and error line count.
    """
    source      = detect_log_source(log_text)
    error_lines = extract_error_lines(log_text)
    client      = GeminiClient()

    prompt = f"""Analyze these {source} logs as a production incident:

LOG SOURCE: {source}
ERROR LINES DETECTED: {len(error_lines)}

FULL LOG TEXT (first 4000 chars):
{log_text[:4000]}

TOP ERROR SIGNATURES:
{json.dumps(error_lines[:10], indent=2)}

Return a JSON object with exactly these fields:
- root_cause: string (the specific root cause, not just the symptom)
- confidence: float 0.0 to 1.0
- severity: string (CRITICAL | HIGH | MEDIUM | LOW)
- error_type: string (e.g. OOMKilled, CrashLoop, AuthFailure, NetworkTimeout, MissingFile)
- symptoms: array of strings (observable symptoms in the logs)
- probable_cause: string (the underlying reason behind the symptoms)
- immediate_fix: string (fastest safe action to take right now)
- permanent_fix: string (long-term solution to prevent recurrence)
- safer_command: string (exact command or config snippet if applicable, empty string if not)
- cost_impact: string (High | Medium | Low | None)
- related_services: array of strings (other services likely affected)
- uncertainty: string (what you are not sure about, empty string if confident)"""

    try:
        raw      = client.invoke_json(prompt, SYSTEM_PROMPT)
        analysis = json.loads(raw)
    except Exception as e:
        analysis = {
            "root_cause":       f"Gemini analysis failed: {e}",
            "confidence":       0.0,
            "severity":         "UNKNOWN",
            "error_type":       "AnalysisError",
            "symptoms":         [],
            "probable_cause":   "Could not determine",
            "immediate_fix":    "Inspect logs manually",
            "permanent_fix":    "",
            "safer_command":    "",
            "cost_impact":      "None",
            "related_services": [],
            "uncertainty":      "Full analysis unavailable",
        }

    return {
        "source":               source,
        "analysis":             analysis,
        "error_lines_detected": len(error_lines),
    }
