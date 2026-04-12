"""
ngrok_url.py
Fetches the current ngrok public URL and prints the webhook URL.
Run this after docker-compose up to get the URL to paste into GitHub.

Usage:
    python ngrok_url.py
"""

import json
import sys
import time
import urllib.request


NGROK_API = "http://localhost:4040/api/tunnels"


def get_ngrok_url(retries: int = 10, delay: float = 2.0) -> str | None:
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(NGROK_API, timeout=3) as response:
                data = json.loads(response.read())
                tunnels = data.get("tunnels", [])
                if tunnels:
                    # Prefer https tunnel
                    for tunnel in tunnels:
                        if tunnel.get("proto") == "https":
                            return tunnel["public_url"]
                    # Fallback to first tunnel
                    return tunnels[0]["public_url"]
        except Exception as e:
            print(f"  Attempt {attempt + 1}/{retries} — waiting for ngrok... ({e})")
            time.sleep(delay)
    return None


def main():
    print()
    print("Fetching ngrok tunnel URL...")
    print()

    url = get_ngrok_url()

    if not url:
        print("ERROR: Could not reach ngrok at http://localhost:4040")
        print()
        print("Make sure you ran: docker-compose up")
        print("Then wait 10 seconds and try again.")
        sys.exit(1)

    webhook_url = url + "/webhook/github"

    print("=" * 60)
    print("  NGROK TUNNEL IS ACTIVE")
    print("=" * 60)
    print()
    print(f"  Public URL  :  {url}")
    print(f"  Webhook URL :  {webhook_url}")
    print()
    print("  Paste this into your GitHub App settings:")
    print(f"  {webhook_url}")
    print()
    print("  GitHub App settings:")
    print("  https://github.com/settings/apps")
    print()
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()