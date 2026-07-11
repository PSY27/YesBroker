"""Structured Pydantic evidence models per agent — for rich frontend rendering."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class PriceEvidence(BaseModel):
    area_median: int
    listing_rent: int
    deviation_pct: float
    pincode: str
    bhk: str
    deposit_months: Optional[float] = None


class CommuteEvidence(BaseModel):
    distance_km: float
    drive_minutes: int
    metro_minutes: int
    target_office: str
    claimed_minutes: int
    discrepancy_minutes: int
    is_live_maps: bool = False


class PhotoEvidence(BaseModel):
    is_stolen: bool
    matches_count: int
    stolen_urls: list[str] = Field(default_factory=list)
    watermarks: list[str] = Field(default_factory=list)
    photos_scanned: int = 0
    is_live_vision: bool = False


class WebEvidence(BaseModel):
    phone: str
    scam_hits: int
    total_results: int
    sources: list[dict[str, str]] = Field(default_factory=list)
    address_scanned: bool = False


class TextEvidence(BaseModel):
    flags: list[str] = Field(default_factory=list)
    quotes: list[str] = Field(default_factory=list)
    analyzer: str = "gemini"
    negation_handled: bool = True


def structured_to_dict(model: BaseModel) -> dict[str, Any]:
    return model.model_dump()
