"""Persistent shareable trust report snapshots."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from schema import TrustReport

_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
_SHARES_PATH = os.path.join(_DATA_DIR, "shares.json")


class SharedListingSnapshot(BaseModel):
    id: str
    title: str
    rent: int
    bhk: str = "2"
    area: str = ""
    address: str = ""
    imageUrl: str | None = None


class SharedReportSnapshot(BaseModel):
    token: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    listing: SharedListingSnapshot
    report: TrustReport


def _load_all() -> dict[str, dict]:
    if not os.path.exists(_SHARES_PATH):
        return {}
    with open(_SHARES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_all(data: dict[str, dict]) -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)
    with open(_SHARES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def create_share(snapshot: SharedReportSnapshot) -> SharedReportSnapshot:
    data = _load_all()
    data[snapshot.token] = snapshot.model_dump()
    _save_all(data)
    return snapshot


def get_share(token: str) -> SharedReportSnapshot | None:
    raw = _load_all().get(token)
    if not raw:
        return None
    return SharedReportSnapshot(**raw)


def new_token() -> str:
    return uuid.uuid4().hex[:12]
