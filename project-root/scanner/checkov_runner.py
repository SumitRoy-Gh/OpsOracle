"""
scanner/checkov_runner.py
Runs Checkov IaC scanner and converts results to OpsOracle Finding schema.
Checkov has 1000+ built-in rules for Terraform, Kubernetes, Dockerfiles, etc.
"""

from __future__ import annotations
import json
import tempfile
import os
from pathlib import Path


def run_checkov(file_path: str, content: str) -> list[dict]:
    """
    Write content to a temp file, run Checkov on it, return findings.
    Returns a list of raw finding dicts in OpsOracle format.
    """
    # Checkov needs an actual file on disk — write to temp
    suffix = Path(file_path).suffix or ".tf"
    
    try:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix=suffix, delete=False, encoding='utf-8'
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        findings = _run_checkov_on_file(tmp_path, file_path)
        return findings

    except Exception as e:
        print(f"[Checkov] Error running on {file_path}: {e}")
        return []
    finally:
        # Always clean up the temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def _run_checkov_on_file(tmp_path: str, original_path: str) -> list[dict]:
    """Run Checkov CLI via Python API and parse results."""
    try:
        from checkov.common.runners.runner_registry import RunnerRegistry
        from checkov.common.output.record import Record
        from checkov.runner_filter import RunnerFilter
        from checkov.terraform.runner import Runner as TFRunner
        from checkov.dockerfile.runner import Runner as DockerRunner
        from checkov.kubernetes.runner import Runner as K8sRunner
    except ImportError:
        print("[Checkov] Checkov not installed. Run: pip install checkov")
        return []

    # Pick the right runner based on file extension
    ext = Path(original_path).suffix.lower()
    filename = Path(original_path).name.lower()

    try:
        if ext == ".tf" or ext == ".tfvars":
            runner = TFRunner()
        elif filename.startswith("dockerfile") or filename == "dockerfile":
            runner = DockerRunner()
        elif ext in (".yml", ".yaml"):
            runner = K8sRunner()
        else:
            return []

        # Run the scan
        report = runner.run(
            root_folder=None,
            files=[tmp_path],
            runner_filter=RunnerFilter()
        )

        findings = []
        for failed_check in report.failed_checks:
            finding = _convert_checkov_finding(failed_check, original_path)
            if finding:
                findings.append(finding)

        print(f"[Checkov] Found {len(findings)} issues in {original_path}")
        return findings

    except Exception as e:
        print(f"[Checkov] Runner error: {e}")
        return []


def _convert_checkov_finding(check, original_path: str) -> dict | None:
    """Convert a Checkov check result to OpsOracle Finding dict format."""
    try:
        # Map Checkov severity to OpsOracle severity
        severity_map = {
            "CRITICAL": "CRITICAL",
            "HIGH": "HIGH",
            "MEDIUM": "MEDIUM",
            "LOW": "LOW",
            "INFO": "INFO",
        }
        
        # Checkov uses its own severity system
        checkov_severity = getattr(check.check, "severity", None)
        if checkov_severity:
            severity = severity_map.get(str(checkov_severity).upper(), "MEDIUM")
        else:
            # Fallback based on check ID prefix
            check_id = check.check_id or ""
            if check_id.startswith("CKV_"):
                severity = "HIGH"
            else:
                severity = "MEDIUM"

        # Get line number
        line_range = getattr(check, "file_line_range", [0, 0])
        line = line_range[0] if line_range else 0

        # Build a clean finding ID
        finding_id = f"CKV-{check.check_id}" if check.check_id else "CKV-UNKNOWN"

        # Get the guideline/fix URL
        guideline = getattr(check.check, "guideline", "") or ""
        fix_suggestion = (
            f"See Checkov rule {check.check_id}: {guideline}"
            if guideline
            else f"Fix identified by Checkov rule {check.check_id}. "
                 f"Review the {check.resource} resource configuration."
        )

        return {
            "id": finding_id,
            "severity": severity,
            "category": "security",
            "line": line,
            "message": check.check.name or f"Checkov rule {check.check_id} failed",
            "suggestion": fix_suggestion,
            "resource": check.resource or "",
            "file": original_path,
            # Extra Checkov metadata — Gemini will use this for enrichment
            "checkov_id": check.check_id,
            "checkov_name": check.check.name,
        }
    except Exception as e:
        print(f"[Checkov] Error converting finding: {e}")
        return None
