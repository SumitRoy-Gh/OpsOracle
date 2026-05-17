# 🚀 OpsOracle Setup & Configuration Guide

Welcome to **OpsOracle**! This guide is designed so that **any developer can set up the project and get it running locally in under 5 minutes without hesitation.** 

Follow these steps carefully to configure your workspace, connect Docker, and set up your external credentials.

---

## 📋 1. Prerequisites (What you need installed)

Before starting, make sure you have the following installed on your machine:
* **Git:** For cloning the repository and managing branches. ([Download Git](https://git-scm.com/downloads))
* **Docker Desktop:** Essential for running the backend database, scanners, and tunnels. ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))
* **Python 3.11 or higher:** For running the local CLI scripts. ([Download Python](https://www.python.org/downloads/))
* **Ngrok (Free Account):** Needed to securely expose your local backend server to GitHub's webhook events. ([Sign Up for Ngrok](https://dashboard.ngrok.com/signup))

---

## 🔑 2. Shared Project Credentials (No GitHub App creation required!)

To save you time, **you do not need to create your own GitHub App.** The Lead has already created and configured a shared GitHub App (`Opsoracle`). 

For security reasons and to prevent public key leaks, the **active secret tokens/keys must be requested directly from the Project Lead (Sumit)**. 

Once you get the shared team credentials sheet from the Lead, copy the values into your local `.env` file as shown below.

---

## 🛠️ 3. Step-by-Step Local Setup

### Step 1: Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/SumitRoy-Gh/Devsecops-project.git
cd Devsecops-project
```

### Step 2: Create Your Local `.env` File
In your terminal, navigate to the `project-root` directory and copy the template:
```bash
cd project-root
cp .env.example .env
```
*(On Windows PowerShell, use: `copy .env.example .env`)*

Now, open the newly created `.env` file in your IDE (VS Code, etc.). 

---

## 📝 4. Filling Out Your `.env` File

Copy and paste the following **pre-configured template** directly into your `.env` file. It already contains all the shared team configuration layouts. 

Replace the placeholders (e.g., `<ASK_SUMIT_FOR_THIS_SECRET>`) with the actual values from the shared team credentials sheet, and generate your 3 personal tokens.

```env
# =========================================================================
# 👥 SHARED TEAM CREDENTIALS (Ask Project Lead Sumit for these values)
# =========================================================================

# GitHub App Configuration
GITHUB_APP_ID=3354256
GITHUB_APP_NAME=Opsoracle
GITHUB_WEBHOOK_SECRET=<ASK_SUMIT_FOR_SHARED_WEBHOOK_SECRET>
GITHUB_PRIVATE_KEY_PATH=/app/private-key.pem

# Shared Vector Embeddings Engine (HuggingFace)
HF_API_KEY=<ASK_SUMIT_FOR_SHARED_HUGGINGFACE_KEY>

# Shared GitHub OAuth (For developer login)
GITHUB_OAUTH_CLIENT_ID=<ASK_SUMIT_FOR_SHARED_GITHUB_OAUTH_CLIENT_ID>
GITHUB_OAUTH_CLIENT_SECRET=<ASK_SUMIT_FOR_SHARED_GITHUB_OAUTH_CLIENT_SECRET>

# Shared Google Login OAuth
GOOGLE_CLIENT_ID=<ASK_SUMIT_FOR_SHARED_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<ASK_SUMIT_FOR_SHARED_GOOGLE_CLIENT_SECRET>

# Local Workspace Configuration
DASHBOARD_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=opsoracle_super_secret_key_change_this_in_production
DATABASE_URL=

# =========================================================================
# 👤 PERSONAL DEVELOPER KEYS (You must generate these 3 keys yourself)
# =========================================================================

# 1. Gemini API Key (Get from Google AI Studio - see section below)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Ngrok Auth Token (Get from Ngrok Dashboard - see section below)
NGROK_AUTHTOKEN=your_ngrok_auth_token_here
NGROK_DOMAIN=

# 3. Pinecone Vector DB (Get from Pinecone Dashboard - see section below)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=opsoracle-findings
```

---

## 🌟 5. How to Generate Your Personal Keys

Follow these simple sub-guides to get your personal keys in 60 seconds:

### 🤖 How to Get Your Google Gemini API Key
OpsOracle uses Gemini to evaluate PR code risks and generate security auto-fixes.
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click the blue button in the top left: **"Get API key"**.
4. Click **"Create API key"** and choose a project (or create a new one).
5. Copy the generated key (it starts with `AIzaSy...`) and paste it into `GEMINI_API_KEY=` in your `.env` file.

---

### 🌐 How to Get Your Ngrok Auth Token
Ngrok creates a secure secure tunnel from your local PC to GitHub, allowing the shared GitHub App to send webhook events to your running backend.
1. Sign in to your [Ngrok Dashboard](https://dashboard.ngrok.com/).
2. On the left sidebar, click on **"Your Authtoken"** (under the "Getting Started" section).
3. Copy your personal token.
4. Paste it into `NGROK_AUTHTOKEN=` in your `.env` file.

---

### 🌲 How to Set Up Pinecone (Vector Storage)
OpsOracle stores past vulnerability findings in Pinecone so it can remember them and evaluate new PRs smarter.
1. Sign up for a free account at [Pinecone.io](https://www.pinecone.io/).
2. Log in and go to the **API Keys** tab on the left.
3. Click **"Create API Key"**, give it a name (e.g. `opsoracle`), and copy the key (starts with `pcsk_...`). Paste it into `PINECONE_API_KEY=` in your `.env`.
4. Go to the **Indexes** tab on the left.
5. Click **"Create Index"** and fill in these exact settings:
   * **Index Name:** `opsoracle-findings`
   * **Dimensions:** `384` *(Crucial: Must be 384 to match the HuggingFace embeddings model size)*
   * **Metric:** `cosine`
   * **Environment/Type:** Choose **Serverless** (AWS -> us-east-1 is free).
6. Click **Create Index**. You are good to go!

---

## 🔑 6. GitHub App Private Key Setup

Because you are using the shared GitHub App `Opsoracle`, you need the App's secure private key to run the webhook listener.

1. Obtain the **`private-key.pem`** file directly from the Project Lead (Sumit).
2. Place this file inside your local `project-root/` directory:
   ```filepath
   project-root/private-key.pem
   ```
   *(Note: This file is already ignored in git via `.gitignore` so you will never accidentally commit or leak it).*

---

## 🚀 7. Running the Project!

Once your `.env` is fully set up and `private-key.pem` is in place:

1. **Pull the backend Docker image:**
   ```bash
   docker pull sumitroydocker/project-root-backend:latest
   ```

2. **Start the containers:**
   ```bash
   docker compose up
   ```

3. **Verify Ngrok Webhook is Active:**
   Look at your terminal console. You will see a beautiful banner print out showing your custom **Webhook URL**:
   ```text
   ============================================================
     NGROK TUNNEL ACTIVE
   ============================================================
     Public URL:  https://xxxx-xx-xx-xx.ngrok-free.app
     Webhook URL: https://xxxx-xx-xx-xx.ngrok-free.app/webhook/github
   ```

You are completely set up and ready to start developing features or scanning code! 🎉
