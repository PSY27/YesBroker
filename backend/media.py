"""Resolve listing photo paths to servable media URLs."""

from __future__ import annotations

import os
from urllib.parse import quote

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEMO_DIR = os.path.join(_ROOT, "frontend", "public", "demo")
_IMAGES_DIR = os.path.join(_ROOT, "frontend", "images")
_FALLBACK = os.path.join(_DEMO_DIR, "fallback.jpg")


def _safe_under_root(path: str) -> str | None:
    """Return absolute path if it exists and stays under project root."""
    abs_path = os.path.abspath(path)
    if not abs_path.startswith(_ROOT):
        return None
    if os.path.isfile(abs_path):
        return abs_path
    return None


def resolve_photo_file(path: str) -> str | None:
    """Resolve a photo reference to an on-disk file path."""
    if not path or not isinstance(path, str):
        return None

    stripped = path.strip()
    if not stripped:
        return None

    # Already a servable URL
    if stripped.startswith(("http://", "https://", "/media/")):
        return None

    # Absolute filesystem path
    found = _safe_under_root(stripped)
    if found:
        return found

    # Relative paths
    candidates = [
        os.path.join(_ROOT, stripped),
        os.path.join(_DEMO_DIR, os.path.basename(stripped)),
        os.path.join(_IMAGES_DIR, os.path.basename(stripped)),
        os.path.join(_IMAGES_DIR, stripped.replace("images/", "")),
    ]
    for candidate in candidates:
        found = _safe_under_root(candidate)
        if found:
            return found

    # Bare filename fallback
    if os.path.isfile(_FALLBACK):
        return _FALLBACK

    return None


def resolve_listing_photo_url(path: str, *, base_url: str = "") -> str:
    """Return a backend /media/... URL for a listing photo reference."""
    if not path:
        return ""

    stripped = path.strip()
    if stripped.startswith(("http://", "https://")):
        return stripped
    if stripped.startswith("/media/"):
        return f"{base_url}{stripped}" if base_url else stripped

    file_path = resolve_photo_file(stripped)
    if not file_path:
        return ""

    rel = os.path.relpath(file_path, _ROOT).replace(os.sep, "/")
    encoded = quote(rel, safe="/")
    url = f"/media/{encoded}"
    return f"{base_url}{url}" if base_url else url


def media_file_path(relative_path: str) -> str | None:
    """Resolve /media/{relative_path} to a safe file under project root."""
    decoded = relative_path.lstrip("/")
    full = os.path.normpath(os.path.join(_ROOT, decoded))
    if not full.startswith(_ROOT):
        return None
    if os.path.isfile(full):
        return full
    return None
