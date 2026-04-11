# empty
"""
gemini_client.py
Google Gemini API wrapper.
Replaces NovaClient (AWS Bedrock) entirely.
Used by evaluator, fix_builder, log analyzer, and chat.
"""

from __future__ import annotations
import os
from pathlib import Path

import google.generativeai as genai

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
except ImportError:
    pass


class GeminiClient:
    MODEL_ID = "gemini-1.5-flash"

    def __init__(self, api_key: str | None = None):
        key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Add it to your .env file."
            )
        genai.configure(api_key=key)
        self._model = genai.GenerativeModel(self.MODEL_ID)

    def invoke(self, prompt: str, system_prompt: str = "") -> str:
        """
        Send prompt to Gemini. Returns plain text response.
        """
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        try:
            response = self._model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            raise GeminiException(f"Gemini API call failed: {e}") from e

    def invoke_json(self, prompt: str, system_prompt: str = "") -> str:
        """
        Send prompt to Gemini and instruct it to return JSON only.
        Strips any accidental markdown code fences before returning.
        """
        json_suffix = (
            "\n\nCRITICAL INSTRUCTION: "
            "Return ONLY a valid JSON object or array. "
            "No markdown. No backticks. No explanation before or after. "
            "Start your response with { or [ immediately."
        )
        raw = self.invoke(prompt + json_suffix, system_prompt)
        return self._strip_fences(raw)

    @staticmethod
    def _strip_fences(text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            # Remove opening fence line
            lines = lines[1:]
            # Remove closing fence if present
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text


class GeminiException(Exception):
    pass


# Quick test
if __name__ == "__main__":
    client = GeminiClient()
    print(client.invoke("Say hello in one sentence."))

    