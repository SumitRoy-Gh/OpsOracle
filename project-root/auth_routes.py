"""
auth_routes.py
Handles GitHub OAuth and Google OAuth login flows.
"""

from __future__ import annotations
import os
import httpx
import uuid
from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from github_app.db import upsert_user, get_user_by_id

router = APIRouter(prefix="/auth")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "changeme")


def _create_session_token(user_id: str) -> str:
    """Create a simple token. In production use JWT properly."""
    import base64
    import hashlib
    payload = f"{user_id}:{SESSION_SECRET}"
    token = base64.b64encode(hashlib.sha256(payload.encode()).digest()).decode()
    return f"{user_id}:{token}"


def _verify_session_token(token: str) -> str | None:
    """Returns user_id if token is valid, else None."""
    import base64
    import hashlib
    try:
        parts = token.split(":", 1)
        if len(parts) != 2:
            return None
        user_id, provided_token = parts
        payload = f"{user_id}:{SESSION_SECRET}"
        expected = base64.b64encode(hashlib.sha256(payload.encode()).digest()).decode()
        if provided_token == expected:
            return user_id
        return None
    except Exception:
        return None


# ── GitHub OAuth ──────────────────────────────────────────────────────────────

@router.get("/github/login")
def github_login():
    """Redirect user to GitHub OAuth page."""
    client_id = os.environ.get("GITHUB_OAUTH_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={client_id}"
        f"&scope=user:email"
        f"&state={uuid.uuid4()}"
    )
    return RedirectResponse(url=github_url)


@router.get("/github/callback")
def github_callback(code: str, state: str = ""):
    """GitHub sends user back here with a code. Exchange it for user info."""
    client_id = os.environ.get("GITHUB_OAUTH_CLIENT_ID", "")
    client_secret = os.environ.get("GITHUB_OAUTH_CLIENT_SECRET", "")

    # Step 1: Exchange code for access token
    token_response = httpx.post(
        "https://github.com/login/oauth/access_token",
        json={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
        },
        headers={"Accept": "application/json"},
        timeout=15,
    )

    if token_response.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=github_token_failed")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    if not access_token:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_access_token")

    # Step 2: Get user info from GitHub
    user_response = httpx.get(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
        },
        timeout=15,
    )

    if user_response.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=github_user_failed")

    github_user = user_response.json()

    # Step 3: Get user email (may be private)
    email = github_user.get("email") or ""
    if not email:
        email_response = httpx.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        if email_response.status_code == 200:
            emails = email_response.json()
            primary = next((e["email"] for e in emails if e.get("primary")), None)
            email = primary or ""

    # Step 4: Save user to database
    user = upsert_user(
        provider_id=str(github_user["id"]),
        provider="github",
        email=email,
        name=github_user.get("name") or github_user.get("login", ""),
        avatar_url=github_user.get("avatar_url", ""),
        github_login=github_user.get("login", ""),
    )

    # Step 5: Create session token and redirect to frontend
    session_token = _create_session_token(user["id"])
    
    response = RedirectResponse(url=f"{FRONTEND_URL}/landing")
    response.set_cookie(
        key="opsoracle_session",
        value=session_token,
        httponly=True,
        max_age=7 * 24 * 3600,  # 7 days
        samesite="lax",
    )
    return response


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google/login")
def google_login():
    """Redirect user to Google OAuth page."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri=http://localhost:8000/auth/google/callback"
        f"&response_type=code"
        f"&scope=openid email profile"
        f"&state={uuid.uuid4()}"
    )
    return RedirectResponse(url=google_url)


@router.get("/google/callback")
def google_callback(code: str, state: str = ""):
    """Google sends user back here with a code."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")

    # Step 1: Exchange code for token
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": "http://localhost:8000/auth/google/callback",
            "grant_type": "authorization_code",
        },
        timeout=15,
    )

    if token_response.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_token_failed")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    # Step 2: Get user info from Google
    user_response = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )

    if user_response.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_user_failed")

    google_user = user_response.json()

    # Step 3: Save user to database
    user = upsert_user(
        provider_id=google_user["id"],
        provider="google",
        email=google_user.get("email", ""),
        name=google_user.get("name", ""),
        avatar_url=google_user.get("picture", ""),
    )

    # Step 4: Create session and redirect
    session_token = _create_session_token(user["id"])

    response = RedirectResponse(url=f"{FRONTEND_URL}/landing")
    response.set_cookie(
        key="opsoracle_session",
        value=session_token,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax",
    )
    return response


# ── Current User + Logout ─────────────────────────────────────────────────────

@router.get("/me")
def get_me(request: Request):
    """Returns current logged-in user info."""
    token = request.cookies.get("opsoracle_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    user_id = _verify_session_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "avatar_url": user["avatar_url"],
        "github_login": user.get("github_login"),
        "installation_id": user.get("installation_id"),
    }


# ── GitHub App Installation Callback ─────────────────────────────────────────

@router.get("/github/app-callback")
def github_app_callback(
    request: Request,
    installation_id: str = "",
    setup_action: str = "",
):
    """
    GitHub redirects here after user installs the GitHub App.
    We save the installation_id to the user's account.
    """
    from github_app.db import update_user_installation

    # Get the current logged-in user from cookie
    token = request.cookies.get("opsoracle_session")
    if token:
        user_id = _verify_session_token(token)
        if user_id and installation_id:
            update_user_installation(user_id, installation_id)

    # Redirect to dashboard
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard")


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie("opsoracle_session")
    return {"status": "logged out"}
