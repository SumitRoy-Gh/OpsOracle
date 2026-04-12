"""
schemas.py
Unified Pydantic models for all API requests and responses.
Every module — PR analysis, log analysis, chat — uses these same models.
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# ── Request models ─────────────────────────────────────────────────────────────

class AnalyzePRRequest(BaseModel):
    terraform_content: str
    terraform_file_name: str = "main.tf"
    request: Optional[str] = "Analyze for security and cost risks"


class AnalyzeLogsRequest(BaseModel):
    log_text: str
    source_hint: str = "unknown"


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""
    history: Optional[List[dict]] = []
    scan_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    pr_id: str
    repo: str
    accepted: int = 0
    rejected: int = 0
    false_positives: int = 0


# ── Finding model ──────────────────────────────────────────────────────────────

class Finding(BaseModel):
    model_config = ConfigDict(frozen=False)

    id: str
    title: str
    file: str
    line: int
    severity: str           # CRITICAL | HIGH | MEDIUM | LOW | INFO
    category: str           # security | cost | reliability | performance
    explanation: str
    cost_impact: str        # High | Medium | Low | None
    compliance: List[str]
    confidence: float
    fix_suggestion: str
    safe_auto_fix: bool
    resource: str = ""
    patch: Optional[str] = None


# ── Analysis result model ──────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    source_type: str                  # "pr" | "log"
    summary: str
    overall_severity: str             # Critical | High | Medium | Low | Clean
    risk_score: int                   # 0 to 100
    findings: List[Finding]
    recommended_actions: List[str]
    repo: str = ""
    pr_number: Optional[int] = None
    commit_sha: Optional[str] = None


# ── Chat response model ────────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    response: str


# ── Health response ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "1.0.0"
