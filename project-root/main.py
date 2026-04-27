"""
main.py
Single FastAPI application — all routes in one place.
Includes: manual PR analysis, log analysis, chat,
          feedback, risk summary, scan history, webhook.
"""

from __future__ import annotations
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
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
from gemini_client import GeminiClient, GeminiRateLimitError
from github_app.db import init_db, get_scans, get_scan_by_id, init_users_table
from github_app.pr_scanner import _auto_rollback, _trigger_agent, _risk_tracker
from github_app.webhook_server import router as webhook_router
from auth_routes import router as auth_router

# ── App setup ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OpsOracle API",
    description="AI DevSecOps Review System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include webhook and auth routers
app.include_router(webhook_router)
app.include_router(auth_router)

# Initialize DB on startup
init_db()
init_users_table()


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
        response = client.invoke(prompt, max_retries=0, fail_fast=True)
        return ChatResponse(response=response)
    except GeminiRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
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


# ── Risk Tracker Endpoints ────────────────────────────────────────────────────

@app.get("/api/risk-tracker/repos")
def risk_tracker_all_repos():
    """
    Returns sliding window summaries for ALL repos that have been scanned.
    Each entry shows trend (improving/degrading/stable), average score,
    and alert if score has been declining for 3+ consecutive PRs.
    """
    all_repos = _risk_tracker.get_all_repos()
    return {
        "total_repos": len(all_repos),
        "repos":       all_repos,
    }


@app.get("/api/risk-tracker/repo/{repo_id:path}")
def risk_tracker_repo(repo_id: str):
    """
    Returns the sliding window summary for a specific repo.
    
    Example: GET /api/risk-tracker/repo/myorg/myrepo
    
    Returns score_history array perfect for drawing a line chart,
    plus trend, average_score, and alert fields.
    """
    summary = _risk_tracker.get_repo_summary(repo_id)
    return summary


@app.get("/api/risk-tracker/alerts")
def risk_tracker_alerts():
    """
    Returns ONLY repos that are currently degrading or have an active alert.
    Use this for a dashboard "needs attention" panel.
    """
    degrading = _risk_tracker.get_degrading_repos()
    return {
        "total_alerts": len(degrading),
        "repos":        degrading,
    }


# ── Manual Scan Trigger ────────────────────────────────────────────────────────

@app.post("/api/trigger-scan")
async def trigger_manual_scan(request: Request):
    """
    Manually trigger a scan on the latest commit of a repo.
    Used by the dashboard Run Scan button.
    """
    body = await request.json()
    repo_full = body.get("repo", "")  # format: "owner/reponame"
    
    if not repo_full or "/" not in repo_full:
        raise HTTPException(status_code=400, detail="Invalid repo format. Use owner/reponame")
    
    # Get the session token to find the user's installation_id
    token = request.cookies.get("opsoracle_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    from auth_routes import _verify_session_token
    user_id = _verify_session_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    from github_app.db import get_user_by_id
    user = get_user_by_id(user_id)
    if not user or not user.get("installation_id"):
        raise HTTPException(status_code=400, detail="GitHub App not installed")
    
    # Run the scan in the background
    owner, repo_name = repo_full.split("/", 1)
    
    try:
        from github_app.auth import get_installation_token
        from github_app.github_client import GitHubClient
        
        inst_token = get_installation_token(int(user["installation_id"]))
        client = GitHubClient(inst_token)
        
        # Get the default branch latest commit SHA
        import httpx as _httpx
        branch_resp = _httpx.get(
            f"https://api.github.com/repos/{owner}/{repo_name}/branches",
            headers={
                "Authorization": f"Bearer {inst_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=15,
        )
        branches = branch_resp.json()
        if not branches:
            raise HTTPException(status_code=404, detail="No branches found")
        
        # Use the first branch (usually main or master)
        default_branch = branches[0]
        commit_sha = default_branch["commit"]["sha"]
        branch_name = default_branch["name"]
        
        # Get all files from the repo tree
        tree_resp = _httpx.get(
            f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{commit_sha}?recursive=1",
            headers={
                "Authorization": f"Bearer {inst_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=15,
        )
        tree = tree_resp.json()
        
        from scanner.detector import is_infra_file
        from scanner.engine import scan_file
        from core.evaluator import evaluate_findings
        from core.fix_builder import build_fixes
        from risk_engine import build_analysis_result
        from github_app.db import save_scan
        
        all_raw_findings = []
        file_contents = {}
        
        for item in tree.get("tree", []):
            if item["type"] == "blob" and is_infra_file(item["path"]):
                content = client.get_file_content(owner, repo_name, item["path"], commit_sha) or ""
                file_contents[item["path"]] = content
                scan_result = scan_file(item["path"], content)
                if scan_result and scan_result.get("findings"):
                    for f in scan_result["findings"]:
                        f["file"] = item["path"]
                    all_raw_findings.extend(scan_result["findings"])
        
        if not all_raw_findings and not file_contents:
            return {"status": "no_infra_files", "message": "No infrastructure files found in this repo"}
        
        # Run AI enrichment
        context_sample = "\n\n".join(
            f"# {k}\n{v[:2000]}" for k, v in list(file_contents.items())[:5]
        )
        enriched = evaluate_findings(all_raw_findings, context_sample, repo=repo_full, pr_number=0)
        enriched = build_fixes(enriched, file_contents)
        
        result = build_analysis_result(
            findings=enriched,
            source_type="pr",
            repo=repo_full,
            pr_number=None,
            commit_sha=commit_sha,
        )
        
        scan_id = save_scan(
            repo=repo_full,
            scan_result=result.model_dump(),
            pr_number=None,
            commit_sha=commit_sha,
        )
        
        # Update risk tracker
        findings_for_tracker = [f.model_dump() for f in enriched]
        from github_app.pr_scanner import _risk_tracker
        _risk_tracker.record_scan(
            scan_id=scan_id,
            repo=repo_full,
            pr_number=0,
            health_score=result.risk_score,
            overall_severity=result.overall_severity,
            findings=findings_for_tracker,
        )
        
        return {
            "status": "complete",
            "scan_id": scan_id,
            "score": result.risk_score,
            "findings": len(enriched),
            "severity": result.overall_severity,
            "branch": branch_name,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
