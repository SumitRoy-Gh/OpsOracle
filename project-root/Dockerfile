FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    wget \
    git \
    gnupg \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# Install Trivy (modern gpg keyring method — apt-key is removed in Debian Trixie)
RUN wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key \
    | gpg --dearmor -o /usr/share/keyrings/trivy.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" \
    | tee /etc/apt/sources.list.d/trivy.list \
    && apt-get update \
    && apt-get install -y trivy \
    && rm -rf /var/lib/apt/lists/*

# Install OSV Scanner (Google's dependency vulnerability tool)
RUN curl -L https://github.com/google/osv-scanner/releases/download/v2.3.8/osv-scanner_linux_amd64 \
    -o /usr/local/bin/osv-scanner \
    && chmod +x /usr/local/bin/osv-scanner

# Install Node.js (for CloudSploit)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install CloudSploit
RUN git clone https://github.com/aquasecurity/cloudsploit.git /opt/cloudsploit \
    && cd /opt/cloudsploit \
    && git reset --hard af8618a4f9b98340d76e30201d6f4127c23e2b88 \
    && npm install --quiet

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data && \
    ( [ -f /app/data/findings_history.json ] || echo "[]" > /app/data/findings_history.json ) && \
    ( [ -f /app/data/feedback_store.json ]   || echo "[]" > /app/data/feedback_store.json )

# Make cli.py directly executable inside container
RUN chmod +x /app/cli.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]