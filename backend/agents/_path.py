from __future__ import annotations
"""Ensure repo root is on sys.path and .env is loaded before any Gemini calls."""

import os
import sys

from dotenv import load_dotenv

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

load_dotenv(os.path.join(_ROOT, ".env"))
