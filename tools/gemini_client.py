"""
Central Gemini API client for YesBroker.
All AI/LLM features use Google Gemini only — no OpenAI, Groq, or other providers.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


def get_api_key() -> str | None:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return key or None


def get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()


def is_configured() -> bool:
    return get_api_key() is not None


def _client() -> genai.Client | None:
    key = get_api_key()
    if not key:
        return None
    return genai.Client(api_key=key)


async def generate_content(
    prompt: str,
    *,
    json_mode: bool = False,
    google_search: bool = False,
    google_maps: bool = False,
) -> str | None:
    """Call Gemini generateContent. Returns response text or None on failure / missing key."""
    client = _client()
    if not client:
        return None

    tools: list[types.Tool] = []
    if google_search:
        tools.append(types.Tool(google_search=types.GoogleSearch()))
    if google_maps:
        tools.append(types.Tool(google_maps=types.GoogleMaps()))

    config = types.GenerateContentConfig(
        tools=tools or None,
        response_mime_type="application/json" if json_mode else None,
    )

    def _call() -> str:
        response = client.models.generate_content(
            model=get_model(),
            contents=prompt,
            config=config,
        )
        return response.text or ""

    try:
        return await asyncio.to_thread(_call)
    except Exception as exc:
        print(f"[Gemini] API error: {exc}")
        return None


async def generate_json(
    prompt: str,
    *,
    google_search: bool = False,
    google_maps: bool = False,
) -> dict | None:
    """Call Gemini and parse a JSON object response."""
    text = await generate_content(
        prompt,
        json_mode=True,
        google_search=google_search,
        google_maps=google_maps,
    )
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Strip markdown fences if model wrapped JSON
        cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            print("[Gemini] Failed to parse JSON response")
            return None
