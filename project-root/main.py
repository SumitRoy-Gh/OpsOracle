"""
main.py
Single FastAPI application — all routes in one place.
Includes: manual PR analysis, log analysis, chat,
          feedback, risk summary, scan history, webhook.
"""

from __future__ import annotations
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from schemas import (
    AnalyzePRRequest,
    AnalyzeLogsRequest,
    ChatRequest,
    FeedbackRequest,
    AnalysisResult,
    ChatResponse,
    HealthResponse,
)
from scanner.engine import scan_file
from core.evaluator import evaluate_findings
from core.fix_builder import build_fixes
from core.learning_store import save_feedback, get_repo_risk_trend
from log_analyzer.root_cause import analyze_logs
from log_analyzer.fix_suggester import log_analysis_to_result
from risk_engine import build_analysis_result
from gemini_client import GeminiClient
from github_app.db import init_db, get_scans, get_scan_by_id
from github_app.pr_scanner import _auto_rollback, _trigger_agent
from github_app.webhook_server import router as webhook_router

# ── App setup ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OpsOracle API",
    description="AI DevSecOps Review System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include webhook router
app.include_router(webhook_router)

# Initialize DB on startup
init_db()


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        service="opsoracle-backend",
    )


# ── Manual PR / File Analysis ──────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_pr(body: AnalyzePRRequest):
    """
    Accepts infrastructure file content.
    Runs scanner + Gemini evaluator + fix builder.
    Returns unified AnalysisResult.
    """
    content   = body.terraform_content.strip()
    file_name = body.terraform_file_name

    if not content:
        raise HTTPException(status_code=400, detail="No content provided")

    # Phase 1 — Scanner
    scan_result = scan_file(file_name, content)
    if not scan_result:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_name}"
        )

    raw_findings = scan_result.get("findings", [])
    for f in raw_findings:
        f["file"] = file_name

    # Phase 2 — Evaluator
    enriched = evaluate_findings(raw_findings, content)

    # Phase 3 — Fix Builder
    enriched = build_fixes(enriched, {file_name: content})

    # Phase 4 — Build result
    result = build_analysis_result(enriched, source_type="pr")
    return result


# ── Log Analysis ───────────────────────────────────────────────────────────────

@app.post("/analyze/logs", response_model=AnalysisResult)
async def analyze_logs_endpoint(body: AnalyzeLogsRequest):
    """
    Accepts raw log text (Kubernetes, Docker, AWS, app).
    Returns root cause analysis in unified AnalysisResult format.
    """
    log_text = body.log_text.strip()

    if not log_text:
        raise HTTPException(status_code=400, detail="No log text provided")

    analysis = analyze_logs(log_text)
    result   = log_analysis_to_result(analysis, log_text)
    return result


# ── Chat ───────────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """
    Context-aware DevOps chat.
    Receives current findings context + conversation history.
    """
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="No message provided")

    client = GeminiClient()

    history_text = ""
    for turn in (body.history or [])[-6:]:
        role = turn.get("role", "user")
        text = turn.get("text", "")
        history_text += f"{role.upper()}: {text}\n"

    prompt = f"""You are OpsOracle, an AI DevSecOps assistant.
You have access to the following scan or log analysis context:

{body.context or "No context provided."}

Recent conversation:
{history_text or "None"}

User: {message}

Reply as a senior DevOps engineer. Be concise, specific, and actionable.
If explaining a fix, give the exact change needed."""

    try:
        response = client.invoke(prompt)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Feedback ───────────────────────────────────────────────────────────────────

@app.post("/feedback")
async def feedback(body: FeedbackRequest):
    """Record developer feedback on a PR scan."""
    save_feedback(
        pr_id=body.pr_id,
        repo=body.repo,
        accepted=body.accepted,
        rejected=body.rejected,
        false_positives=body.false_positives,
    )
    return {"status": "saved"}


# ── Risk and Analytics ─────────────────────────────────────────────────────────

@app.get("/risk/summary")
def risk_summary():
    """Get recent scan list for dashboard."""
    scans = get_scans(limit=100)
    return {"scans": scans, "total": len(scans)}


@app.get("/risk/repo/{repo_id:path}")
def repo_risk(repo_id: str):
    """Get historical risk trend for a specific repo."""
    trend = get_repo_risk_trend(repo_id)
    return trend


# ── Scan History ───────────────────────────────────────────────────────────────

@app.get("/api/scans")
def list_scans(repo: str | None = None, limit: int = 50):
    results = get_scans(repo=repo, limit=limit)
    return {"scans": results}


@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: str):
    result = get_scan_by_id(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan not found")
    return result


# ── Auto-Rollback History Endpoint ──────────────────────────────────────────
@app.get("/api/rollback-history")
def rollback_history():
    """
    Returns the list of all auto-rollback decisions made this session.
    Call this URL to see which PRs were blocked and why.
    """
    history = _auto_rollback.get_history()
    return {
        "total":   len(history),
        "history": history,
    }


# ── Trigger Agent Stats Endpoint ─────────────────────────────────────────
@app.get("/api/trigger-stats")
def trigger_stats():
    """Shows how many Gemini calls were saved by the trigger agent."""
    return {"stats": _trigger_agent.get_stats()}
