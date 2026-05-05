"""
scanner/trivy_runner.py
Runs Trivy vulnerability scanner and converts results to OpsOracle format.
Trivy scans:
  - Dockerfiles → base image CVEs
  - requirements.txt / package.json → library CVEs
  - Kubernetes YAML → misconfigurations
"""

from __future__ import annotations
import json
import subprocess
import tempfile
import os
from pathlib import Path


def run_trivy(file_path: str, content: str) -> list[dict]:
    """
    Run Trivy on the given file content and return OpsOracle-format findings.
    """
    filename = Path(file_path).name.lower()
    
    # Trivy can scan: Dockerfiles, requirements.txt, package.json, k8s YAML
    if not _should_scan_with_trivy(filename, file_path):
        return []

    try:
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix=Path(file_path).suffix or ".tmp",
            delete=False,
            encoding='utf-8',
            prefix=Path(file_path).stem + "_"
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        findings = _run_trivy_scan(tmp_path, file_path)
        return findings

    except Exception as e:
        print(f"[Trivy] Error: {e}")
        return []
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def _should_scan_with_trivy(filename: str, file_path: str) -> bool:
    """Only run Trivy on file types it understands well."""
    return (
        "dockerfile" in filename.lower()
        or filename == "requirements.txt"
        or filename == "package.json"
        or filename == "go.mod"
        or filename == "pom.xml"
        or file_path.endswith(".yaml")
        or file_path.endswith(".yml")
    )


def _run_trivy_scan(tmp_path: str, original_path: str) -> list[dict]:
    """Run Trivy CLI and parse JSON output."""
    try:
        result = subprocess.run(
            [
                "trivy", "fs",
                "--format", "json",
                "--quiet",
                "--no-progress",
                "--scanners", "vuln,secret,misconfig",
                tmp_path
            ],
            capture_output=True,
            text=True,
            timeout=60,  # Don't let Trivy hang a scan
        )

        if result.returncode not in (0, 1):  # 1 = vulnerabilities found (normal)
            print(f"[Trivy] Scan error: {result.stderr[:200]}")
            return []

        if not result.stdout.strip():
            return []

        trivy_json = json.loads(result.stdout)
        return _parse_trivy_output(trivy_json, original_path)

    except subprocess.TimeoutExpired:
        print(f"[Trivy] Scan timed out for {original_path}")
        return []
    except FileNotFoundError:
        print("[Trivy] Trivy binary not found. Is it installed?")
        return []
    except json.JSONDecodeError:
        print(f"[Trivy] Invalid JSON output")
        return []
    except Exception as e:
        print(f"[Trivy] Unexpected error: {e}")
        return []


def _parse_trivy_output(trivy_json: dict, original_path: str) -> list[dict]:
    """Convert Trivy JSON output to OpsOracle Finding dicts."""
    findings = []
    results = trivy_json.get("Results", [])

    for result in results:
        target = result.get("Target", original_path)

        # ── Vulnerabilities (CVEs in packages) ───────────────────────────
        for vuln in result.get("Vulnerabilities", []) or []:
            finding = _convert_cve(vuln, original_path)
            if finding:
                findings.append(finding)

        # ── Misconfigurations (Dockerfile/K8s issues) ────────────────────
        for misconfig in result.get("Misconfigurations", []) or []:
            finding = _convert_misconfig(misconfig, original_path)
            if finding:
                findings.append(finding)

        # ── Secrets (hardcoded secrets found by Trivy) ───────────────────
        for secret in result.get("Secrets", []) or []:
            finding = _convert_secret(secret, original_path)
            if finding:
                findings.append(finding)

    print(f"[Trivy] Found {len(findings)} issues in {original_path}")
    return findings


def _convert_cve(vuln: dict, file_path: str) -> dict | None:
    """Convert a Trivy CVE finding."""
    try:
        cve_id = vuln.get("VulnerabilityID", "CVE-UNKNOWN")
        pkg_name = vuln.get("PkgName", "unknown-package")
        installed = vuln.get("InstalledVersion", "?")
        fixed = vuln.get("FixedVersion", "no fix available")
        severity = vuln.get("Severity", "MEDIUM").upper()
        title = vuln.get("Title", "") or vuln.get("Description", "")[:100]
        
        # Map UNKNOWN severity to MEDIUM
        if severity == "UNKNOWN":
            severity = "LOW"

        return {
            "id": f"CVE-{cve_id}",
            "severity": severity,
            "category": "security",
            "line": 0,
            "message": (
                f"Vulnerable dependency: {pkg_name} v{installed} "
                f"has {cve_id}. {title}"
            ),
            "suggestion": (
                f"Upgrade {pkg_name} to {fixed}"
                if fixed != "no fix available"
                else f"No fix available yet for {cve_id}. Consider replacing {pkg_name}."
            ),
            "resource": pkg_name,
            "file": file_path,
            "cve_id": cve_id,
            "source": "trivy_cve",
        }
    except Exception:
        return None


def _convert_misconfig(misconfig: dict, file_path: str) -> dict | None:
    """Convert a Trivy misconfiguration finding."""
    try:
        return {
            "id": f"TRIVY-{misconfig.get('ID', 'MISC')}",
            "severity": misconfig.get("Severity", "MEDIUM").upper(),
            "category": "security",
            "line": (misconfig.get("CauseMetadata") or {}).get("StartLine", 0),
            "message": misconfig.get("Title", "Misconfiguration detected"),
            "suggestion": misconfig.get("Resolution", "Fix the misconfiguration"),
            "resource": misconfig.get("Type", ""),
            "file": file_path,
            "source": "trivy_misconfig",
        }
    except Exception:
        return None


def _convert_secret(secret: dict, file_path: str) -> dict | None:
    """Convert a Trivy secret finding."""
    try:
        return {
            "id": f"TRIVY-SECRET-{secret.get('RuleID', 'UNKNOWN')}",
            "severity": "CRITICAL",
            "category": "security",
            "line": secret.get("StartLine", 0),
            "message": f"Secret detected: {secret.get('Title', 'Hardcoded secret')}",
            "suggestion": (
                "Remove the hardcoded secret immediately. "
                "Rotate it if it was ever committed to git. "
                "Use environment variables or a secrets manager instead."
            ),
            "resource": secret.get("Category", "secret"),
            "file": file_path,
            "source": "trivy_secret",
        }
    except Exception:
        return None


def generate_sbom(file_path: str, content: str) -> dict | None:
    """
    Generate a Software Bill of Materials (SBOM) for a Dockerfile or dependency file.
    Returns CycloneDX format JSON or None if not applicable.
    """
    filename = Path(file_path).name.lower()
    if "dockerfile" not in filename and filename not in ("requirements.txt", "package.json"):
        return None

    try:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix=Path(file_path).suffix or ".tmp",
            delete=False, encoding='utf-8'
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        result = subprocess.run(
            [
                "trivy", "fs",
                "--format", "cyclonedx",
                "--quiet",
                "--no-progress",
                tmp_path
            ],
            capture_output=True, text=True, timeout=60
        )

        os.unlink(tmp_path)

        if result.returncode in (0, 1) and result.stdout.strip():
            return json.loads(result.stdout)
        return None

    except Exception as e:
        print(f"[Trivy] SBOM generation error: {e}")
        return None
