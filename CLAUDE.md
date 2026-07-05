# CLAUDE.md — OpsOracle DevSecOps Agent Instructions

---

## 1. Role & Project Context

**Persona:** Senior Full-Stack DevSecOps Engineer specializing in AI-powered infrastructure security (Python/FastAPI + React/Vite).  
**Project:** **OpsOracle** — an autonomous DevSecOps agent that scans Infrastructure-as-Code (Terraform, Dockerfile, Kubernetes, GitHub Actions, SAM), enriches findings with Google Gemini AI, tracks risk trends via a 10-scan sliding window, learns from developer feedback via Pinecone RAG, and can auto-patch "safe-to-fix" issues with Git-backed rollback.

Architecture:  
- **Backend** (`project-root/`) — FastAPI server (`main.py`) exposing REST endpoints for PR analysis, log analysis, chat, risk tracking, cloud posture scans, and GitHub webhook handling. Background services: Trigger Agent (caching/cooldown), Risk Tracker (sliding window), Auto-Rollback (Git checkpoints), Pinecone RAG store.  
- **Frontend** (`frontend/`) — React 19 + Vite SPA with React Router, Recharts dashboards, Material Icons, protected routes via cookie-based auth.  
- **CLI** (`cli.py`) — Click + Rich terminal client supporting local (scanner-only) and server (full AI) modes, patching, log analysis, interactive chat, history, risk trends.  
- **Infra** — Docker Compose orchestrating backend, ngrok tunnel (for GitHub webhooks), optional CLI and webhook-url printer containers. Trivy, OSV-Scanner, CloudSploit baked into Docker image.

---

## 2. Repository Structure

```
Devsecops project/
├── CLAUDE.md                 ← (this file)
├── README.md                 ← Project overview, architecture, workflows
├── setup.md                  ← 5-min local setup guide (env vars, keys, docker)
├── collaborative_workflow.md ← Team git/Docker/PR workflow (to be removed)
├── .gitignore
├── frontend/
│   ├── package.json          ← React 19, Vite, React Router, Recharts, ESLint
│   ├── vite.config.js        ← Vite + proxy /auth → localhost:8000
│   ├── eslint.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           ← Routes, Layout, Auth guard
│       ├── App.css / index.css
│       ├── api/client.js     ← fetch wrapper (credentials: include)
│       ├── pages/            ← Dashboard, Repos, History, ScanDetail, RiskTracker, AiInsights, CloudPosture, Docs, Team, Landing, LoginSignup
│       └── assets/
└── project-root/             ← Python backend (root of Docker context)
    ├── Dockerfile
    ├── docker-compose.yml
    ├── requirements.txt
    ├── .env.example / .env   ← Secrets (GEMINI_API_KEY, NGROK_AUTHTOKEN, PINECONE_API_KEY, GitHub App creds)
    ├── private-key.pem       ← GitHub App private key (mounted RO)
    ├── main.py               ← FastAPI app, all routes, middleware, startup DB init
    ├── cli.py                ← Click CLI (local & server modes)
    ├── schemas.py            ← Pydantic models (Finding, AnalysisResult, ChatRequest, …)
    ├── risk_engine.py        ← Risk scoring (weights), severity, recommended actions
    ├── gemini_client.py      ← Gemini SDK wrapper, retry/rate-limit handling
    ├── auth_routes.py        ← Cookie-session auth (/auth/me, /auth/login, /auth/github/*, /auth/logout)
    ├── auto_rollback.py      ← Git checkpoint / rollback history
    ├── scanner/
    │   ├── __init__.py
    │   ├── engine.py         ← scan_file() dispatcher → detector + rule modules
    │   ├── detector.py       ← File-type detection (tf, dockerfile, k8s, gh-actions, sam)
    │   ├── models.py         ← Finding dataclasses
    │   ├── trivy_runner.py   ← Trivy subprocess wrapper
    │   ├── osv_runner.py     ← OSV-Scanner subprocess wrapper
    │   ├── checkov_runner.py ← Checkov subprocess wrapper
    │   └── rules/            ← Regex/pattern rules per IaC dialect
    │       ├── __init__.py
    │       ├── terraform.py
    │       ├── dockerfile.py
    │       ├── kubernetes.py
    │       ├── github_actions.py
    │       └── sam.py
    ├── core/
    │   ├── __init__.py
    │   ├── evaluator.py      ← Gemini enrichment (explanation, cost, compliance, confidence, fix)
    │   ├── fix_builder.py    ← Builds unified diff patches for safe-auto-fix findings
    │   ├── patch_agent.py    ← Applies patches, creates git checkpoints
    │   ├── learning_store.py ← Pinecone upsert/query + local JSON feedback store
    │   ├── risk_tracker.py   ← 10-scan sliding window per repo (JSON persistence)
    │   ├── trigger_agent.py  ← Content hash cache + per-PR cooldown (in-memory + JSON)
    │   ├── reporter.py       ← GitHub PR review / line-comment posting
    │   ├── planner.py        ← (planning helper)
    │   └── cloud_posture.py  ← CloudSploit live scan wrapper
    ├── github_app/
    │   ├── __init__.py
    │   ├── db.py             ← SQLite init, scans CRUD
    │   ├── pr_scanner.py     ← Webhook handler orchestrating full PR pipeline
    │   └── webhook_server.py ← FastAPI router `/webhook/github` (signature verification)
    ├── log_analyzer/
    │   ├── root_cause.py     ← Log pattern detection
    │   └── fix_suggester.py  ← Maps log analysis → AnalysisResult
    └── data/
        ├── risk_tracker.json
        ├── findings_history.json
        └── feedback_store.json
```

---

## 3. Tech Stack & Dependencies

| Layer | Stack |
|-------|-------|
| **Language** | Python 3.11+, JavaScript (ESM) |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, Starlette, python-dotenv, PyJWT, cryptography, httpx, PyGithub, PyYAML, click, rich, google-genai, sentence-transformers, pinecone≥3, numpy, checkov≥3 |
| **Frontend** | React 19, React Router 7, Vite 8, Recharts 3, @splinetool/react-spline, js-cookie, ESLint 10 |
| **Scanners** | Trivy, OSV-Scanner, Checkov (bundled in Docker) |
| **AI** | Google Gemini (google-genai SDK), HuggingFace sentence-transformers (local embeddings) |
| **Vector DB** | Pinecone (index `opsoracle-findings`, dim 384) |
| **Auth** | GitHub OAuth + Google OAuth, cookie sessions (`opsoracle_session`) |
| **Infra** | Docker, Docker Compose, ngrok (tunnel), SQLite (scan metadata) |
| **Lint/Format** | ESLint (flat config) frontend; Ruff / Black not yet configured backend |

Key versions (from lockfiles):  
- `react@19.2.5`, `vite@8.0.10`, `fastapi` (latest), `uvicorn[standard]`, `pydantic>=2.0`, `google-genai`, `pinecone>=3.0.0`, `checkov>=3.0.0`.

---

## 4. Core Commands

Run from repository root unless noted.

### Backend (inside `project-root/` or via Docker)

```bash
# 1. Install deps locally (optional; Docker handles it)
cd project-root
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Run backend locally (needs .env populated)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Docker Compose (recommended — includes ngrok, volumes, healthchecks)
docker-compose up --build               # foreground
docker-compose up -d --build            # detached
docker-compose logs -f backend          # tail logs

# 4. Run CLI against local backend
docker-compose run --rm cli scan ./infra --patch
docker-compose run --rm cli logs app.log
docker-compose run --rm cli chat
docker-compose run --rm cli history --repo myorg/myrepo
docker-compose run --rm cli risk myorg/myrepo

# 5. Run tests (pytest not yet configured; see test_api.py)
python -m pytest project-root/test_api.py -v   # if pytest added
```

### Frontend (inside `frontend/`)

```bash
cd frontend
npm install
npm run dev          # Vite dev server on :5173 (proxies /auth → :8000)
npm run build        # Production build → dist/
npm run lint         # ESLint flat config
npm run preview      # Preview production build
```

### Environment (`.env` in `project-root/`)

Required keys (see `setup.md` for how to obtain):
```
GEMINI_API_KEY=
NGROK_AUTHTOKEN=
PINECONE_API_KEY=
PINECONE_INDEX=opsoracle-findings
GITHUB_APP_ID=3354256
GITHUB_WEBHOOK_SECRET=
GITHUB_PRIVATE_KEY_PATH=/app/private-key.pem
HF_API_KEY=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=opsoracle_super_secret_key_change_this_in_production
FRONTEND_URL=http://localhost:5173
DASHBOARD_BASE_URL=http://localhost:3000
```

---

## 5. Coding Conventions & Patterns

### Python (Backend)

- **Imports**: `from __future__ import annotations` at top; stdlib → third-party → local.
- **Type hints**: Full PEP 484; Pydantic models in `schemas.py` used for request/response.
- **Error handling**: Raise `HTTPException(status_code, detail)` in routes; custom `GeminiRateLimitError` for 429.
- **Async**: All route handlers `async def`; CPU-bound scanner runs sync in thread pool via `run_in_executor` (not yet used — keep in mind).
- **Naming**: `snake_case` functions/vars, `PascalCase` classes, `UPPER_SNAKE` constants.
- **Modules**: Single-responsibility files under `core/`, `scanner/`, `github_app/`, `log_analyzer/`.
- **Stateful singletons**: `_trigger_agent`, `_risk_tracker`, `_auto_rollback` instantiated at module level in `github_app/pr_scanner.py` and imported in `main.py` for stats endpoints.
- **Persistence**: JSON files under `data/` for risk tracker, feedback, findings history; SQLite (`github_app/db.py`) for scan metadata.
- **AI calls**: Centralised in `gemini_client.GeminiClient.invoke()` with retry/backoff; prompt templates live in `core/evaluator.py`, `core/patch_agent.py`, `main.py` chat endpoint.

### JavaScript / React (Frontend)

- **ESM** (`"type": "module"` in package.json).
- **Components**: Function components + hooks; pages under `src/pages/`.
- **Routing**: `react-router-dom` v7; protected routes via `<Navigate to="/login" />` guard in `App.jsx`.
- **State**: React `useState`/`useEffect`; no global store (Redux/Zustand) yet.
- **API client**: `src/api/client.js` — thin `fetch` wrapper with `credentials: 'include'` for cookie auth.
- **Styling**: Plain CSS (`App.css`, `index.css`); Material Symbols icon font via CDN.
- **Lint**: ESLint flat config (`eslint.config.js`) with `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

### Scanner Pipeline (backend)

1. **Detector** (`scanner/detector.py`) → identifies file type by extension/path.
2. **Rule modules** (`scanner/rules/*.py`) → regex/pattern matches → raw findings.
3. **Engine** (`scanner/engine.py`) → aggregates, dedupes, returns `{file, findings[], score, grade}`.
4. **Evaluator** (`core/evaluator.py`) → sends raw findings + file content to Gemini → enriched `Finding` objects.
5. **Fix Builder** (`core/fix_builder.py`) → generates unified diff patches for `safe_auto_fix` findings.
6. **Risk Engine** (`risk_engine.py`) → computes 0-100 risk score, overall severity, recommended actions.
7. **Risk Tracker** (`core/risk_tracker.py`) → updates per-repo 10-scan sliding window (trend, alert).
8. **Reporter** (`core/reporter.py`) → posts GitHub PR review + line comments.

### CLI Modes

- `--local` flag → runs scanner only (no Gemini, no backend).
- Default → POSTs each file to `/analyze` (or `/analyze/logs`) on backend.
- `--patch` → invokes `PatchAgent` (dry-run=false) after scan; creates git checkpoint commit.

---

## 6. Hard Constraints (Anti-Patterns)

- **NEVER** commit `.env`, `private-key.pem`, or any secret to git (`.gitignore` enforces).
- **NEVER** bypass `CORSMiddleware` allow-origin list (`http://localhost:5173` only in dev).
- **NEVER** call Gemini directly from routes — always via `GeminiClient` (rate-limit handling).
- **NEVER** write to production SQLite from tests — use isolated temp DB or mocks.
- **NEVER** push raw dataset files (`data/*.json`) to Docker image; they are volume-mounted at runtime.
- **NEVER** skip `private-key.pem` volume mount — GitHub webhook verification will fail.
- **NEVER** hardcode `BASE_URL` in frontend — use `src/api/client.js` constant (currently `http://localhost:8000`).
- **NEVER** add new dependencies without updating `requirements.txt` / `package.json` and rebuilding Docker.
- **NEVER** mutate Pydantic models after construction — treat `Finding`, `AnalysisResult` as immutable.
- **NEVER** run Trivy/OSV/Checkov scanners outside Docker (binaries baked in image only).

---

## 7. Definition of Done

A change (feature / bug-fix / refactor) is complete when **all** of the following are true:

1. **Code compiles & runs** — `docker-compose up --build` succeeds, backend health endpoint returns `200 OK`, frontend `npm run build` exits 0.
2. **Lint passes** — `npm run lint` (frontend) clean; backend: add `ruff check .` / `black --check .` once configured.
3. **No new unvetted dependencies** — every new import justified in PR description; licences compatible (MIT/Apache-2.0/BSD).
4. **Type safety** — Pydantic models cover new request/response shapes; TypeScript not used yet but JSDoc types encouraged.
5. **Tests** — At minimum manual verification via CLI (`cli.py scan …`, `cli.py chat`) and frontend flow; automated tests encouraged (pytest for backend, Vitest for frontend when added).
6. **Documentation updated** — `README.md` architecture table, `setup.md` if new env vars, `CLAUDE.md` if new patterns.
7. **Secrets hygiene** — `.env.example` updated with placeholder; no real keys in repo.
8. **Git hygiene** — Conventional commit message (`feat:`, `fix:`, `chore:`, `docs:`); branch named `feat/<slug>` or `fix/<slug>`; PR targets `main`; CI (GitHub Actions) passes.

---

*End of CLAUDE.md — keep this file at repo root and update alongside architectural changes.*