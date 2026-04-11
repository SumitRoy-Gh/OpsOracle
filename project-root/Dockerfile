FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

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