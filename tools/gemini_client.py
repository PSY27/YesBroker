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
    return os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview").strip()


def is_configured() -> bool:
    return get_api_key() is not None


def _client() -> genai.Client | None:
    key = get_api_key()
    if not key:
        return None
    return genai.Client(api_key=key)


def _log_gemini(direction: str, message: str, **meta: object) -> None:
    try:
        import sys
        sys.path.insert(0, str(_ROOT / "backend"))
        from trace import TraceKind, trace_emit

        trace_emit(TraceKind.GEMINI, "gemini", message, direction=direction, **meta)
    except Exception:
        pass


async def generate_content(
    prompt: str,
    *,
    json_mode: bool = False,
    google_search: bool = False,
    google_maps: bool = False,
    caller: str = "unknown",
) -> str | None:
    """Call Gemini generateContent. Returns response text or None on failure / missing key."""
    client = _client()
    if not client:
        _log_gemini("skip", f"No API key — {caller} using offline fallback", caller=caller)
        return None

    model = get_model()
    tools_label = []
    if google_search:
        tools_label.append("google_search")
    if google_maps:
        tools_label.append("google_maps")

    _log_gemini(
        "request",
        f"{caller} → {model}" + (f" + [{', '.join(tools_label)}]" if tools_label else ""),
        caller=caller,
        prompt_preview=prompt[:160].replace("\n", " "),
    )

    tools: list[types.Tool] = []
    if google_search:
        tools.append(types.Tool(google_search=types.GoogleSearch()))
    if google_maps:
        tools.append(types.Tool(google_maps=types.GoogleMaps()))

    # Google Maps grounding does not support response_mime_type=application/json
    use_json_mode = json_mode and not google_maps

    config = types.GenerateContentConfig(
        tools=tools or None,
        response_mime_type="application/json" if use_json_mode else None,
    )

    def _call() -> str:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=config,
        )
        return response.text or ""

    try:
        text = await asyncio.to_thread(_call)
        _log_gemini(
            "response",
            f"{caller} ← {len(text)} chars",
            caller=caller,
            preview=text[:120].replace("\n", " "),
        )
        return text
    except Exception as exc:
        _log_gemini("error", f"{caller} failed: {exc}", caller=caller)
        print(f"[Gemini] API error: {exc}")
        return None


async def generate_json(
    prompt: str,
    *,
    google_search: bool = False,
    google_maps: bool = False,
    caller: str = "unknown",
) -> dict | None:
    """Call Gemini and parse a JSON object response."""
    # Maps grounding: get plain text then parse JSON manually
    if google_maps:
        text = await generate_content(
            prompt + "\n\nRespond with a single JSON object only, no markdown.",
            json_mode=False,
            google_maps=True,
            caller=caller,
        )
    else:
        text = await generate_content(
            prompt,
            json_mode=True,
            google_search=google_search,
            caller=caller,
        )
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            print("[Gemini] Failed to parse JSON response")
            return None
