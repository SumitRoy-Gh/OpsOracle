"""
github_app/webhook_server.py
FastAPI webhook server.
Receives GitHub PR events, verifies signatures,
and triggers the PR pipeline as a background task.
All other routes are in main.py.
This module exports only the webhook router.
"""

from __future__ import annotations
import hashlib
import hmac
import json
import os

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse

from github_app.pr_scanner import process_pr

router = APIRouter()


def _verify_signature(body: bytes, signature: str) -> bool:
    secret   = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    body      = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")
    event     = request.headers.get("X-GitHub-Event", "")

    if not _verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(body)

    if event == "pull_request" and payload.get("action") in (
        "opened", "synchronize", "reopened"
    ):
        pr            = payload["pull_request"]
        repo_data     = payload["repository"]
        installation  = payload.get("installation", {})

        owner         = repo_data["owner"]["login"]
        repo          = repo_data["name"]
        pr_number     = pr["number"]
        commit_sha    = pr["head"]["sha"]
        installation_id = installation.get("id")

        if not installation_id:
            raise HTTPException(
                status_code=400,
                detail="No installation ID in webhook payload"
            )

        background_tasks.add_task(
            process_pr,
            installation_id=installation_id,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            commit_sha=commit_sha,
        )

        return JSONResponse({
            "status":     "processing",
            "pr_number":  pr_number,
            "repo":       f"{owner}/{repo}",
            "commit_sha": commit_sha,
        })

    return JSONResponse({
        "status": "ignored",
        "event":  event,
        "reason": "Not a PR open/sync/reopen event",
    })
