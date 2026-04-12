"""
SQLite persistence for OpsOracle scan results.

Schema:
  scans(id, repo, pr_number, commit_sha, overall_score, overall_grade,
        files_scanned, total_findings, severity_counts_json, results_json,
        created_at)
"""

from __future__ import annotations
import json
import sqlite3
import uuid
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Detect database provider
DATABASE_URL = os.environ.get("DATABASE_URL")
DB_PATH = Path(__file__).parent.parent / "opsoracle.db"

def _get_connection():
    if DATABASE_URL:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn, True
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, False

def init_db() -> None:
    """Create tables if they don't exist."""
    conn, is_pg = _get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            create_table_sql = """
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    repo TEXT NOT NULL,
                    pr_number INTEGER,
                    commit_sha TEXT,
                    overall_score INTEGER,
                    overall_grade TEXT,
                    files_scanned INTEGER,
                    total_findings INTEGER,
                    severity_counts TEXT,   -- JSON string
                    results TEXT,           -- JSON string
                    created_at TEXT NOT NULL
                )
            """
            cursor.execute(create_table_sql)
            if not is_pg:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_repo ON scans(repo)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at)")
            else:
                # Postgres indices use slightly different syntax if needed, 
                # but CREATE INDEX IF NOT EXISTS is standard.
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_repo ON scans(repo)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at)")
            conn.commit()
    finally:
        conn.close()

def save_scan(
    repo: str,
    scan_result: dict[str, Any],
    pr_number: int | None = None,
    commit_sha: str | None = None,
) -> str:
    """Persist a scan result. Returns the new scan ID."""
    scan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # ── Map new AnalysisResult schema to DB columns ──────────────────────────
    # overall_score → risk_score (0-100)
    # overall_grade → derived from overall_severity
    # files_scanned → count of unique files in findings
    # total_findings → len of findings list

    findings_list = scan_result.get("findings", [])
    risk_score    = scan_result.get("risk_score", 0)
    severity      = scan_result.get("overall_severity", "Clean")

    # Derive a letter grade from risk score for backward compat with frontend
    if risk_score >= 90:
        grade = "A"
    elif risk_score >= 75:
        grade = "B"
    elif risk_score >= 60:
        grade = "C"
    elif risk_score >= 45:
        grade = "D"
    else:
        grade = "F"

    # Count unique files
    unique_files = len({f.get("file", "") for f in findings_list if f.get("file")})

    # Build severity counts from findings
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    for f in findings_list:
        sev = f.get("severity", "INFO")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    conn, is_pg = _get_connection()
    placeholder = "%s" if is_pg else "?"

    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                f"""
                INSERT INTO scans
                  (id, repo, pr_number, commit_sha, overall_score, overall_grade,
                   files_scanned, total_findings, severity_counts, results, created_at)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder},
                        {placeholder}, {placeholder}, {placeholder}, {placeholder},
                        {placeholder}, {placeholder}, {placeholder})
                """,
                (
                    scan_id,
                    repo,
                    pr_number,
                    commit_sha,
                    risk_score,
                    grade,
                    unique_files,
                    len(findings_list),
                    json.dumps(severity_counts),
                    json.dumps(scan_result),
                    now,
                ),
            )
            conn.commit()
    finally:
        conn.close()
    return scan_id

def get_scans(repo: str | None = None, limit: int = 50) -> list[dict]:
    """Fetch recent scan summaries."""
    conn, is_pg = _get_connection()
    placeholder = "%s" if is_pg else "?"
    try:
        cursor = conn.cursor()
        if repo:
            cursor.execute(
                f"SELECT id, repo, pr_number, commit_sha, overall_score, overall_grade, "
                f"files_scanned, total_findings, severity_counts, created_at "
                f"FROM scans WHERE repo = {placeholder} ORDER BY created_at DESC LIMIT {placeholder}",
                (repo, limit),
            )
        else:
            cursor.execute(
                f"SELECT id, repo, pr_number, commit_sha, overall_score, overall_grade, "
                f"files_scanned, total_findings, severity_counts, created_at "
                f"FROM scans ORDER BY created_at DESC LIMIT {placeholder}",
                (limit,),
            )
        rows = cursor.fetchall()
    finally:
        conn.close()

    results = []
    for row in rows:
        d = dict(row)
        d["severity_counts"] = json.loads(d["severity_counts"] or "{}")
        results.append(d)
    return results

def get_scan_by_id(scan_id: str) -> dict | None:
    """Fetch a single scan with full results."""
    conn, is_pg = _get_connection()
    placeholder = "%s" if is_pg else "?"
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT * FROM scans WHERE id = {placeholder}", (scan_id,)
        )
        row = cursor.fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    d = dict(row)
    d["severity_counts"] = json.loads(d["severity_counts"] or "{}")
    d["results"] = json.loads(d["results"] or "{}")
    return d
