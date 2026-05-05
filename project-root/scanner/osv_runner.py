"""
scanner/osv_runner.py
Runs Google's OSV Scanner to find vulnerabilities in dependency files.
Supports: requirements.txt, package.json, go.mod, pom.xml, etc.
"""

from __future__ import annotations
import json
import subprocess
import tempfile
import os
from pathlib import Path


# Files OSV Scanner understands
_SUPPORTED_FILES = {
    "requirements.txt",
    "package.json",
    "package-lock.json",
    "go.mod",
    "go.sum",
    "pom.xml",
    "build.gradle",
    "cargo.toml",
    "cargo.lock",
    "gemfile",
    "gemfile.lock",
}


def run_osv_scan(file_path: str, content: str) -> list[dict]:
    """
    Scan a dependency file for known vulnerabilities using OSV Scanner.
    Returns OpsOracle-format findings.
    """
    filename = Path(file_path).name.lower()
    
    if filename not in _SUPPORTED_FILES:
        return []

    try:
        # Write to temp file with the CORRECT filename (OSV uses filename to detect format)
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix=f"_{filename}",   # Keep original filename for OSV to detect type
            delete=False,
            encoding='utf-8',
            dir=tempfile.gettempdir(),
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Rename so OSV sees the right filename
        correct_path = os.path.join(tempfile.gettempdir(), filename)
        os.rename(tmp_path, correct_path)
        
        findings = _run_osv(correct_path, file_path)
        return findings
        
    except Exception as e:
        print(f"[OSV] Error scanning {file_path}: {e}")
        return []
    finally:
        try:
            if os.path.exists(correct_path):
                os.unlink(correct_path)
        except Exception:
            pass


def _run_osv(tmp_path: str, original_path: str) -> list[dict]:
    """Execute OSV Scanner CLI and parse results."""
    try:
        result = subprocess.run(
            [
                "osv-scanner",
                "--format", "json",
                "--lockfile", tmp_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        # OSV returns exit code 1 when vulnerabilities are found (normal)
        if result.returncode not in (0, 1):
            if "osv-scanner" in result.stderr.lower() and "not found" in result.stderr.lower():
                print("[OSV] osv-scanner not installed — skipping dependency scan")
            return []

        if not result.stdout.strip():
            return []

        osv_data = json.loads(result.stdout)
        return _parse_osv_output(osv_data, original_path)

    except subprocess.TimeoutExpired:
        print(f"[OSV] Scan timed out for {original_path}")
        return []
    except FileNotFoundError:
        print("[OSV] osv-scanner binary not found")
        return []
    except json.JSONDecodeError:
        return []
    except Exception as e:
        print(f"[OSV] Unexpected error: {e}")
        return []


def _parse_osv_output(osv_data: dict, original_path: str) -> list[dict]:
    """Convert OSV JSON output to OpsOracle Finding dicts."""
    findings = []
    results = osv_data.get("results", [])

    for result in results:
        packages = result.get("packages", [])
        for pkg in packages:
            pkg_info = pkg.get("package", {})
            pkg_name = pkg_info.get("name", "unknown")
            pkg_version = pkg_info.get("version", "?")

            for vuln in pkg.get("vulnerabilities", []):
                finding = _convert_osv_vuln(vuln, pkg_name, pkg_version, original_path)
                if finding:
                    findings.append(finding)

    print(f"[OSV] Found {len(findings)} vulnerable dependencies in {original_path}")
    return findings


def _convert_osv_vuln(vuln: dict, pkg_name: str, pkg_version: str, file_path: str) -> dict | None:
    """Convert one OSV vulnerability entry to OpsOracle format."""
    try:
        vuln_id = vuln.get("id", "OSV-UNKNOWN")
        aliases = vuln.get("aliases", [])
        
        # Prefer CVE ID if available
        display_id = next((a for a in aliases if a.startswith("CVE-")), vuln_id)
        
        # Determine severity from CVSS scores
        severity = _get_severity_from_osv(vuln)
        
        # Get fix version from affected ranges
        fix_version = _get_fix_version(vuln)
        
        summary = vuln.get("summary", "") or vuln.get("details", "")[:150]

        return {
            "id": f"OSV-{display_id}",
            "severity": severity,
            "category": "security",
            "line": 0,  # Dependency files don't have specific lines for vulns
            "message": (
                f"Vulnerable dependency: {pkg_name}@{pkg_version} "
                f"has {display_id}. {summary}"
            ),
            "suggestion": (
                f"Upgrade {pkg_name} to {fix_version}"
                if fix_version
                else f"No automatic fix available. Check {display_id} for manual remediation steps."
            ),
            "resource": pkg_name,
            "file": file_path,
            "source": "osv_scanner",
            "cve_id": display_id,
        }
    except Exception:
        return None


def _get_severity_from_osv(vuln: dict) -> str:
    """Extract severity from OSV severity scores."""
    severity_data = vuln.get("severity", [])
    
    for sev in severity_data:
        score_type = sev.get("type", "")
        score = sev.get("score", "")
        
        if "CVSS" in score_type and score:
            # Parse CVSS score string to get numeric severity
            try:
                # CVSS scores look like: "CVSS:3.1/AV:N/AC:L/..."
                # Extract base score from vector string or use severity buckets
                if "CRITICAL" in score.upper():
                    return "CRITICAL"
                elif "HIGH" in score.upper():
                    return "HIGH"
                elif "MEDIUM" in score.upper():
                    return "MEDIUM"
                else:
                    return "LOW"
            except Exception:
                pass

    # Default if no severity data
    return "MEDIUM"


def _get_fix_version(vuln: dict) -> str | None:
    """Extract the fixed version from OSV affected ranges."""
    try:
        affected = vuln.get("affected", [])
        for affect in affected:
            ranges = affect.get("ranges", [])
            for r in ranges:
                events = r.get("events", [])
                for event in events:
                    if "fixed" in event:
                        return event["fixed"]
    except Exception:
        pass
    return None
