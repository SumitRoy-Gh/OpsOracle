"""
core/patch_agent.py
Generates AI-powered code fixes for infrastructure findings.
Only runs on findings where safe_auto_fix=True.
Always creates a git checkpoint before writing any file.
"""


from __future__ import annotations
import json
import os
from pathlib import Path


from gemini_client import GeminiClient
from schemas import Finding
from utils.git_checkpoint import create_checkpoint, backup_file




PATCH_SYSTEM_PROMPT = """You are a DevSecOps engineer generating safe minimal
infrastructure code fixes.


CRITICAL RULES — never break these:
1. Return ONLY the complete corrected file content
2. Make the MINIMUM change needed to fix the specific finding
3. Do not change anything unrelated to the finding
4. Do not add comments explaining your changes
5. Do not add markdown code fences (no ```)
6. The output must be valid, runnable infrastructure code
7. If you are not confident in the fix, return exactly: SKIP_THIS_PATCH"""














class PatchAgent:
    """
    Generates and applies safe patches for infrastructure findings.


    Usage:
        agent = PatchAgent(dry_run=True)   # dry_run=True: shows patch but does not write
        results = agent.patch_findings(findings, file_contents)
    """


    def __init__(self, dry_run: bool = False):
        """
        dry_run=True  → Generate patches and return them, but DO NOT write to disk.
        dry_run=False → Apply patches to actual files (use with caution!).
        """
        self.dry_run = dry_run
        self.client  = GeminiClient()


    def patch_findings(
        self,
        findings:      list[Finding],
        file_contents: dict[str, str],
        repo:          str = "",
        pr_number:     int = 0,
    ) -> list[dict]:
        """
        For each finding with safe_auto_fix=True, generate a fix.
        If not dry_run, apply the fix to the actual file.
        Returns list of patch result dicts.
        """
        patchable = [f for f in findings if f.safe_auto_fix]


        if not patchable:
            print("[PatchAgent] No patchable findings found")
            return []


        print(f"[PatchAgent] Found {len(patchable)} patchable finding(s)")


        # ── Create git checkpoint BEFORE any changes ─────────────────────
        if not self.dry_run:
            checkpoint = create_checkpoint(
                f"OpsOracle checkpoint before AI patch — PR #{pr_number} in {repo}"
            )
            if not checkpoint["success"]:
                print(f"[PatchAgent] WARNING: Checkpoint failed: {checkpoint['error']}")
                print("[PatchAgent] Continuing in dry_run mode for safety")
                self.dry_run = True


        results = []


        for finding in patchable:
            result = self._patch_one(finding, file_contents)
            results.append(result)


        return results


    def _patch_one(self, finding: Finding, file_contents: dict[str, str]) -> dict:
        """Generate and optionally apply a patch for one finding."""
        file_content = file_contents.get(finding.file, "")


        if not file_content:
            return {
                "finding_id": finding.id,
                "file":       finding.file,
                "status":     "skipped",
                "reason":     "File content not available",
            }


        # Build the prompt
        prompt = f"""Fix this specific infrastructure security finding.


FINDING:
Severity: {finding.severity}
Title: {finding.title}
Line: {finding.line}
Explanation: {finding.explanation}
Fix instruction: {finding.fix_suggestion}


CURRENT FILE CONTENT ({finding.file}):
{file_content[:3000]}


Return the complete corrected file content with ONLY this one fix applied.
No markdown. No code fences. Just the raw file content.
If you cannot safely make this fix, return exactly: SKIP_THIS_PATCH"""


        try:
            raw = self.client.invoke(prompt, PATCH_SYSTEM_PROMPT, max_retries=2)
            raw = raw.strip()


            # ── Validation ──────────────────────────────────────────────
            if "SKIP_THIS_PATCH" in raw:
                return {
                    "finding_id": finding.id,
                    "file":       finding.file,
                    "status":     "skipped",
                    "reason":     "AI decided patch is not safe",
                }


            if len(raw) < 10:
                return {
                    "finding_id": finding.id,
                    "file":       finding.file,
                    "status":     "failed",
                    "reason":     "AI returned empty response",
                }


            # Strip accidental markdown fences
            if raw.startswith("```"):
                lines = raw.splitlines()
                raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])


            # ── Apply the patch ─────────────────────────────────────────
            if self.dry_run:
                print(f"[PatchAgent] DRY RUN — would patch {finding.file} for {finding.id}")
                return {
                    "finding_id": finding.id,
                    "file":       finding.file,
                    "status":     "dry_run",
                    "patch":      raw,
                }
            else:
                # Back up first
                backup_path = backup_file(finding.file)
                # Write the patched content
                Path(finding.file).write_text(raw, encoding="utf-8")
                print(f"[PatchAgent] Applied patch to {finding.file} (finding {finding.id})")
                return {
                    "finding_id":  finding.id,
                    "file":        finding.file,
                    "status":      "applied",
                    "backup_path": backup_path,
                }


        except Exception as e:
            print(f"[PatchAgent] Error patching {finding.file}: {e}")
            return {
                "finding_id": finding.id,
                "file":       finding.file,
                "status":     "error",
                "reason":     str(e),
            }
