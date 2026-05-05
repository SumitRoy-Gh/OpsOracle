"""
core/cloud_posture.py
Runs CloudSploit live cloud security checks and converts findings to OpsOracle format.
Requires cloud credentials (AWS, GCP, or Azure).
"""

from __future__ import annotations
import json
import subprocess
import os
import tempfile
from pathlib import Path


CLOUDSPLOIT_PATH = "/opt/cloudsploit"


def run_cloud_posture_scan(
    provider: str,
    credentials: dict,
) -> list[dict]:
    """
    Run CloudSploit against a live cloud account.
    
    Args:
        provider: "aws", "gcp", or "azure"
        credentials: dict of credentials 
            AWS: {"access_key": "...", "secret_key": "...", "region": "us-east-1"}
            GCP: {"project_id": "...", "client_email": "...", "private_key": "..."}
    
    Returns list of OpsOracle-format findings.
    """
    if not _is_cloudsploit_installed():
        print("[CloudSploit] Not installed at /opt/cloudsploit")
        return []

    config = _build_config(provider, credentials)
    if not config:
        return []

    try:
        # Write config to temp file
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.js', delete=False, encoding='utf-8'
        ) as tmp:
            tmp.write(config)
            config_path = tmp.name

        result = subprocess.run(
            [
                "node", f"{CLOUDSPLOIT_PATH}/index.js",
                "--config", config_path,
                "--json",
                "--console", "none",
                "--compliance=cis",
            ],
            capture_output=True,
            text=True,
            timeout=300,  # Cloud scans take time
            cwd=CLOUDSPLOIT_PATH,
        )

        os.unlink(config_path)

        if result.returncode not in (0, 1, 2):
            print(f"[CloudSploit] Error: {result.stderr[:300]}")
            return []

        return _parse_cloudsploit_output(result.stdout)

    except subprocess.TimeoutExpired:
        print("[CloudSploit] Scan timed out (5 minutes)")
        return []
    except Exception as e:
        print(f"[CloudSploit] Error: {e}")
        return []


def _is_cloudsploit_installed() -> bool:
    return Path(f"{CLOUDSPLOIT_PATH}/index.js").exists()


def _build_config(provider: str, credentials: dict) -> str | None:
    """Build a CloudSploit config.js file content."""
    if provider == "aws":
        return f"""
module.exports = {{
    credentials: {{
        aws: {{
            access_key: '{credentials.get("access_key", "")}',
            secret_access_key: '{credentials.get("secret_key", "")}',
            region: '{credentials.get("region", "us-east-1")}',
        }}
    }}
}};
"""
    elif provider == "gcp":
        return f"""
module.exports = {{
    credentials: {{
        google: {{
            project: '{credentials.get("project_id", "")}',
            client_email: '{credentials.get("client_email", "")}',
            private_key: `{credentials.get("private_key", "")}`,
        }}
    }}
}};
"""
    else:
        print(f"[CloudSploit] Unsupported provider: {provider}")
        return None


def _parse_cloudsploit_output(output: str) -> list[dict]:
    """Convert CloudSploit JSON output to OpsOracle Finding format."""
    findings = []
    
    try:
        results = json.loads(output)
    except json.JSONDecodeError:
        # CloudSploit sometimes outputs line-by-line JSON
        results = []
        for line in output.strip().split('\n'):
            try:
                results.append(json.loads(line))
            except Exception:
                pass

    if not isinstance(results, list):
        results = [results] if isinstance(results, dict) else []

    severity_map = {
        "FAIL": "HIGH",
        "WARN": "MEDIUM",
        "OK": None,       # Skip passing checks
        "UNKNOWN": "LOW",
    }

    for item in results:
        if not isinstance(item, dict):
            continue
        
        status = item.get("status", "UNKNOWN")
        severity = severity_map.get(status)
        
        if not severity:  # Skip OK results
            continue

        # CloudSploit categories → OpsOracle compliance mapping
        compliance = _map_to_compliance(item.get("plugin", ""))

        findings.append({
            "id": f"CLOUD-{item.get('plugin', 'UNKNOWN').upper().replace(' ', '_')[:20]}",
            "severity": severity,
            "category": "security",
            "line": 0,
            "message": (
                f"[LIVE CLOUD] {item.get('title', 'Cloud misconfiguration')}: "
                f"{item.get('message', item.get('description', ''))}"
            ),
            "suggestion": item.get("resource", "Review and fix the cloud resource configuration"),
            "resource": item.get("resource", ""),
            "file": "live_cloud",
            "compliance": compliance,
            "source": "cloudsploit",
            "cloud_region": item.get("region", ""),
            "cloud_service": item.get("service", ""),
        })

    print(f"[CloudSploit] Found {len(findings)} live cloud issues")
    return findings


def _map_to_compliance(plugin_name: str) -> list[str]:
    """Map CloudSploit plugin names to compliance frameworks."""
    name_lower = plugin_name.lower()
    compliance = []
    
    if any(k in name_lower for k in ["iam", "access", "permission", "policy"]):
        compliance.extend(["CIS AWS 1.x", "SOC2 CC6.1"])
    if any(k in name_lower for k in ["s3", "storage", "bucket"]):
        compliance.extend(["CIS AWS 2.x", "SOC2 CC6.6"])
    if any(k in name_lower for k in ["encrypt", "kms"]):
        compliance.extend(["CIS AWS 2.2", "HIPAA §164.312"])
    if any(k in name_lower for k in ["logging", "cloudtrail", "audit"]):
        compliance.extend(["CIS AWS 3.x", "SOC2 CC7.1"])
    
    return compliance or ["CIS AWS Benchmarks"]
