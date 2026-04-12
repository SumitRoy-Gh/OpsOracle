# 🛡️ OpsOracle: AI-Powered DevSecOps Agent

OpsOracle is an intelligent backend system designed to automate security audits for Infrastructure-as-Code (IaC). It acts as a bridge between GitHub Pull Requests and AI-driven analysis, providing instant feedback on security, reliability, and cost-efficiency.

---

## 🏗️ Architecture Overview

OpsOracle is composed of three main layers:
1.  **Ingestion (GitHub Webhook):** Listens for Pull Request events, verifies signatures, and fetches changed files.
2.  **Analysis Engine:** Uses regex-based scanning for quick detection and **Google Gemini AI** for deep security evaluation and automated fix suggestions.
3.  **Persistence & API:** Stores results in a local **SQLite** database and exposes them via a **FastAPI** REST interface.

---

## 📂 Project Structure
Knowing where everything is helps you find the code you need:
*   `main.py`: The entry point for the API. This is where all the URLs (endpoints) are defined.
*   `schemas.py`: Defines the "Shape" of the data sent to and from the API (Pydantic models).
*   `github_app/db.py`: All the code for talking to the SQLite database.
*   `cli.py`: The command-line tool for manually testing the backend.
*   `opsoracle.db`: The SQLite database file (appears after you start the app).
*   `data/`: Folder where AI-related history and findings are stored in JSON format.

---

## ⏱️ The 5-Minute "Zero to Running" Checklist

1.  **Install Docker Desktop** on your computer.
2.  **Create a file** called `.env` in the root folder (`project-root/`).
3.  **Copy the contents** of `.env.example` into your new `.env` file.
4.  **Put any .pem file** in the root and rename it to `private-key.pem`. (If you don't have one, just create an empty text file with that name—it will still let you run the API).
5.  **Open a terminal** in the `project-root/` folder and run:
    ```bash
    docker-compose up --build -d
    ```
6.  **Verify it's working** by going to `http://localhost:8000/health`.

---

## 🚀 Detailed Setup Guide

### 1. The `.env` File
Create a file named `.env` in the `project-root/` directory. Use the following template:

```ini
# GitHub App credentials
GITHUB_APP_ID=123456                      # From GitHub App Settings
GITHUB_PRIVATE_KEY_PATH=/app/private-key.pem # Do NOT change this (Docker path)
GITHUB_WEBHOOK_SECRET=your_password        # Must match GitHub "Webhook secret"

# Gemini AI API
GEMINI_API_KEY=your_google_ai_key         # Get from ai.google.dev

# Dashboard Configuration
DASHBOARD_BASE_URL=http://localhost:3000  # Your local frontend URL

# Ngrok (Required for real GitHub Webhooks)
NGROK_AUTHTOKEN=your_ngrok_token
```

### 2. GitHub Private Key
1.  Go to **GitHub App Settings** -> **Private Keys**.
2.  Click **"Generate a private key"**.
3.  Rename the downloaded `.pem` file to exactly `private-key.pem`.
4.  Place it in the **`project-root/`** directory.

### 3. Ngrok & Webhook Setup
When running locally, GitHub cannot see your computer. OpsOracle uses a built-in Ngrok service to create a tunnel.
1.  Run `docker-compose up`.
2.  Open **[http://localhost:4040/status](http://localhost:4040/status)** in your browser.
3.  Copy the **Public URL** (e.g., `https://random-name.ngrok-free.app`).
4.  Append `/webhook/github` to it and paste it into the **Webhook URL** field in GitHub App Settings.

---

## 📊 Database Documentation

OpsOracle uses **SQLite** for local development. The database file is created at `project-root/opsoracle.db`.

### Table: `scans`
This is your primary table for the dashboard.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier for the scan. |
| `repo` | Text | The "owner/name" of the repo (e.g., `SumitRoy-Gh/test-repo`). |
| `pr_number` | Integer | The GitHub Pull Request number. |
| `overall_score`| Integer | Safety score from **0 to 100** (higher is safer). |
| `overall_grade`| Text | Letter grade (**A, B, C, D, F**) derived from the score. |
| `total_findings`| Integer | Total number of issues found. |
| `severity_counts`| JSON String| Breakdown of counts: `{"CRITICAL":1, "HIGH":2, ...}` |
| `results` | JSON String| The **raw AI findings list** (Explanations, patches, compliance). |
| `created_at` | ISO-8601 | Timestamp of the scan. |

---

## 🔌 API Reference

The backend runs at `http://localhost:8000`.

### 1. Fetch Scan History
*   **Endpoint:** `GET /api/scans`
*   **Description:** Get the list of all recent scans.
*   **Query Params:** `limit` (default 50), `repo` (filter by repo name).

### 2. Fetch Detailed Scan (`GET /api/scans/{scan_id}`)
This returns the full AI analysis. Here is an **example of what the data looks like** so you can plan your UI:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "repo": "SumitRoy-Gh/test-repo",
  "overall_score": 75,
  "overall_grade": "B",
  "findings": [
    {
      "id": "DET-001",
      "severity": "HIGH",
      "title": "Container Runs As Root",
      "file": "Dockerfile",
      "line": 10,
      "explanation": "Running as root is dangerous because...",
      "fix_suggestion": "Add 'USER appuser'...",
      "patch": "RUN useradd -r appuser && USER appuser",
      "compliance": ["SOC2", "CIS"]
    }
  ]
}
```

### 3. Repository Risk Summary
*   **Endpoint:** `GET /risk/repo/{owner}/{repository}`
*   **Description:** Returns historical risk trends and average scores for a repo. Perfect for making Line Charts!

### 4. Direct AI Chat
*   **Endpoint:** `POST /chat`
*   **Body:** `{"message": "How do I fix root user issues in Docker?", "history": []}`
*   **Description:** Talk to the OpsOracle AI DevSecOps assistant.

---

## 💻 Working with the CLI

You can interact with the backend using the command line inside the container:

```bash
# Check if backend is alive
docker-compose exec backend python cli.py health

# Analyze a raw log file manually
docker-compose exec backend python cli.py logs app_crash.log

# Scan a local file for immediate AI feedback
docker-compose exec backend python cli.py scan Dockerfile
```

---

## 🎨 Frontend Integration Tips

### 1. Handling JSON in SQLite
SQLite stores arrays and objects as **Text**.
*   When using `GET /api/scans`, the backend **already parses** `severity_counts` into an object for you.
*   The `results` field (the full findings) is also returned as a pre-parsed JSON object list.
*   **Tip:** You don't need to do `JSON.parse()` on these fields in your frontend code; the FastAPI backend handles it!

### 2. Status & Color Mapping
To match the OpsOracle aesthetics, use these color mappings for severities:
*   **CRITICAL:** `#E11D48` (Red)
*   **HIGH:** `#EA580C` (Orange)
*   **MEDIUM:** `#CA8A04` (Yellow)
*   **LOW:** `#2563EB` (Blue)
*   **INFO/CLEAN:** `#16A34A` (Green)

### 3. Date Formatting
The `created_at` field is returned in **ISO-8601** format (e.g., `2026-04-12T16:55:05+00:00`). Use a library like `date-fns` or native `Intl.DateTimeFormat` to make it pretty.

---

## ⚠️ Common Troubleshooting

*   **Error 401 (Unauthorized):** Check your `GITHUB_WEBHOOK_SECRET` in `.env`. It must match exactly what is in your GitHub App settings.
*   **Database is empty:** Scans only happen when a PR is opened or you run `cli.py scan`.
*   **Gemini API Limit (429 Error):** The free tier only allows 15 requests per minute. Wait 60 seconds and try again.
*   **Webhook Skipped:** OpsOracle only scans infrastructure files. If your PR only changes `.js` or `.css` files, it will skip analysis.
