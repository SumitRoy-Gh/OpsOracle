"""
core/fix_builder.py
Attempts to generate a safe patch for findings marked safe_auto_fix=True.
Only generates patches for single-value changes.
All other findings pass through unchanged with suggestion text only.
"""

from __future__ import annotations
import json
from gemini_client import GeminiClient
from schemas import Finding


SYSTEM_PROMPT = """You are a DevSecOps engineer generating safe minimal infrastructure fixes.
Rules you must never break:
1. Only generate a patch if the fix changes a single value or adds a single line
2. Never rewrite entire files or blocks
3. Never touch any logic unrelated to the finding
4. Never delete resources
5. If you are uncertain, set suggestion_only to true
6. Return ONLY valid JSON"""


def build_fixes(
    findings: list[Finding],
    file_contents: dict[str, str],
) -> list[Finding]:
    """
    For findings with safe_auto_fix=True, attempt to build a patch.
    Updates finding.patch if successful.
    All findings are returned — unchanged ones pass through.
    """
    client = GeminiClient()
    updated: list[Finding] = []

    for finding in findings:
        if not finding.safe_auto_fix:
            updated.append(finding)
            continue

        file_content = file_contents.get(finding.file, "")
        if not file_content:
            updated.append(finding)
            continue

        # Only send first 100 lines to keep prompt small
        preview = "\n".join(file_content.splitlines()[:100])

        prompt = f"""Finding that needs a safe patch:
{json.dumps(finding.model_dump(), indent=2)}

File content (first 100 lines):
{preview}

Return a JSON object with exactly these fields:
- suggestion_only: boolean
  (true if you cannot safely generate a patch, false if you can)
- patch: string
  (the corrected line(s) only — not the full file. Empty string if suggestion_only is true.)
- explanation: string
  (one sentence explaining why this patch is safe)"""

        try:
            raw = client.invoke_json(prompt, SYSTEM_PROMPT)
            data = json.loads(raw)
            if not data.get("suggestion_only", True) and data.get("patch", "").strip():
                finding.patch = data["patch"]
        except Exception as e:
            print(f"[FixBuilder] Patch generation failed for {finding.id}: {e}")

        updated.append(finding)

    return updated
