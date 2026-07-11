from __future__ import annotations
import agents._path  # noqa: F401 — repo root on sys.path for tools/

from agents.base import BaseAgent
from agents.commute import CommuteAgent
from agents.photo import PhotoAgent
from agents.price import PriceAgent
from agents.text import TextAgent
from agents.web import WebAgent

AGENTS: dict[str, BaseAgent] = {
    "price": PriceAgent(),
    "text": TextAgent(),
    "photo": PhotoAgent(),
    "commute": CommuteAgent(),
    "web": WebAgent(),
}

__all__ = [
    "AGENTS",
    "BaseAgent",
    "PriceAgent",
    "TextAgent",
    "PhotoAgent",
    "CommuteAgent",
    "WebAgent",
]
