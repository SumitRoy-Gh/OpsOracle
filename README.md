# 🛡️ OpsOracle: The AI-Powered DevSecOps Sentinel

**OpsOracle** is an advanced, autonomous DevSecOps agent designed to protect infrastructure-as-code (IaC) by bridging the gap between static analysis and intelligent AI reasoning. It doesn't just find bugs; it understands them, tracks them, and fixes them.

---

## 🚀 Key Features (From Major to Minute)

### 1. 🧠 Intelligent AI Enrichment
Unlike traditional scanners that output cryptic errors, OpsOracle uses **Google Gemini AI** to:
*   Explain security risks in plain English.
*   Calculate real-world cost impacts.
*   Map findings to compliance frameworks (CIS, SOC2, HIPAA).
*   Assign confidence scores to every finding.

### 2. 📉 Sliding Window Risk Tracker (NEW)
The backend maintains a **10-scan sliding window** for every repository:
*   **Trend Analysis:** Detects if a repo is "Improving", "Degrading", or "Stable".
*   **Alerting:** Automatically flags a repository if its security score drops for 3 consecutive PRs.
*   **Average Scoring:** Calculates a weighted risk score over time, not just for a single commit.

### 3. 🛠️ "Safe-Patch" Automated Remediation
The system identifies "safe-to-fix" findings (like missing tags, unpinned versions, or public S3 buckets) and:
*   Generates the exact code fix using AI.
*   Can apply the patch automatically via CLI or PR request.
*   **Safety First:** Uses a Git-based checkpointing system to ensure no code is lost.

### 4. 🔄 Self-Learning Feedback Loop (RAG)
OpsOracle remembers past decisions using a **Pinecone Vector Database**:
*   **Pattern Recognition:** If a developer marks a finding as a "False Positive", the system learns and stops flagging it.
*   **Context Awareness:** During a PR scan, the AI is fed context about *past* recurring issues in that specific repository.

### 5. 🛡️ Automated Rollback Protection
Integrated with the patching engine, the **Auto-Rollback** system:
*   Takes a snapshot of the repo state before any AI change.
*   Can be triggered to revert the repository to a known-good state if the AI-generated patch fails a build or test.

### 6. 🚦 Trigger Agent (Cost & Performance Optimizer)
To save API costs and improve speed, the Trigger Agent:
*   **Smart Caching:** Reuses AI evaluations for identical file contents.
*   **Scan Cooldown:** Prevents redundant AI calls on rapid-fire commits to the same PR.

---

## 🛠️ Detailed Tech Stack

*   **Core Logic:** Python 3.11+
*   **Web Framework:** FastAPI (Asynchronous, High-Performance)
*   **AI Models:** 
    *   **Reasoning:** Google Gemini (via `google-genai` SDK)
    *   **Embeddings:** HuggingFace `sentence-transformers` (Local execution)
*   **Databases:**
    *   **Metadata:** SQLite (PR scan history, scan IDs)
    *   **Vector DB:** Pinecone (Historical context & RAG)
    *   **Trends:** JSON Persistence (Sliding windows, repo metrics)
*   **Infrastructure:** Docker & Docker Compose
*   **Tunnelling:** ngrok (For receiving GitHub webhooks on local dev)
*   **CLI:** Click & Rich (For beautiful, interactive terminal output)

---

## 🌊 Detailed Feature Workflows

### A. The PR Analysis Flow
1.  **Webhook:** GitHub sends a `pull_request` event.
2.  **Validator:** `webhook_server.py` verifies the GitHub signature.
3.  **Trigger Agent:** Checks if this file has been analyzed recently (Cache hit?) or if the PR is on "cooldown".
4.  **Scanner:** Runs a regex-based fast scan to find raw issues.
5.  **RAG Lookup:** Queries Pinecone for past issues in this repo.
6.  **AI Evaluator:** Sends raw issues + Repo History + File Context to Gemini.
7.  **Risk Engine:** Calculates the `0-100` Risk Score and `Overall Severity`.
8.  **Risk Tracker:** Updates the sliding window for this repo in `data/risk_tracker.json`.
9.  **Reporter:** Posts an formatted review comment and inline line-by-line comments to the GitHub PR.

### B. The Local Patching Flow
1.  **Command:** User runs `python cli.py scan . --patch`.
2.  **Scanning:** Local engine finds issues.
3.  **Checkpoint:** `git_checkpoint.py` creates a temporary git commit.
4.  **AI Generation:** `PatchAgent` asks Gemini for the corrected code for "Safe-to-Fix" findings.
5.  **Application:** The file is overwritten with corrected code.
6.  **Review:** User reviews the changes; if they dislike them, they run `python cli.py rollback`.

---

## 🏁 Getting Started (On Any Device)

Follow these steps to set up OpsOracle from scratch on a new machine.

### 1. Prerequisites
*   **Docker Desktop** (Must be running)
*   **Python 3.11+**
*   **ngrok** account (for a free static domain)
*   **Google AI Studio API Key** (Gemini)

### 2. Clone and Configure
```bash
git clone <your-repo-url>
cd project-root
cp .env.example .env
```
Update the `.env` file with your credentials:
*   `GEMINI_API_KEY`: Your key from AI Studio.
*   `GITHUB_APP_ID` & `GITHUB_PRIVATE_KEY_PATH`: From your GitHub App settings.
*   `NGROK_AUTHTOKEN`: From your ngrok dashboard.

### 3. Launch the Backend
```bash
docker-compose up --build -d
```
This starts the **FastAPI backend** and the **ngrok tunnel**. 
*   Check health: `http://localhost:8000/health`
*   Get your ngrok URL: `http://localhost:4040/api/tunnels`

### 4. Setup the CLI (On the local machine)
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows

# Install requirements
pip install -r requirements.txt
```

### 5. Running your first scan
**Local Mode:**
```bash
python cli.py scan ./my-project-files/
```
**Auto-Fix Mode:**
```bash
python cli.py scan ./my-project-files/ --patch
```

---

## 📦 Docker Hub Integration

To pull the pre-built OpsOracle image from Docker Hub:
```bash
docker pull <your-dockerhub-username>/opsoracle-backend:latest
```

To run it without the source code:
```bash
docker run -p 8000:8000 --env-file .env <your-dockerhub-username>/opsoracle-backend:latest
```

---

## 📖 Component Directory

| Component | Responsibility |
| :--- | :--- |
| `main.py` | Main API entry point and router |
| `cli.py` | The "Swiss Army Knife" terminal interface |
| `core/risk_tracker.py` | Logic for the 10-PR sliding window and trends |
| `core/patch_agent.py` | AI-powered code generation for fixes |
| `core/evaluator.py` | The "Brain" that talks to Gemini |
| `rag/pinecone_store.py` | The "Memory" that stores historical findings |
| `auto_rollback.py` | The "Panic Button" to revert changes |
| `risk_engine.py` | The "judge" that calculates the 0-100 score |

---
*Created by the OpsOracle Team — Automated DevSecOps for the Modern Era.*
