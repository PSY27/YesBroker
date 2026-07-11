from pydantic import BaseModel
from typing import List, Optional

class CommuteResult(BaseModel):
    distance_km: float
    drive_minutes: int
    metro_minutes: int
    is_grounded_live: bool
    summary: str

class DuplicateMatch(BaseModel):
    url: str
    city: str
    price_listed: Optional[int] = None

class DuplicateScanResult(BaseModel):
    has_matches: bool
    matches: List[DuplicateMatch]
    confidence: float
    summary: str

class OCRScanResult(BaseModel):
    is_watermarked: bool
    detected_watermarks: List[str]
    raw_text: str
    summary: str

class SearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str

class SearchScanResult(BaseModel):
    is_blacklisted: bool
    severity: str # SAFE, SUSPICIOUS, HIGH_RISK
    reports_count: int
    items: List[SearchResultItem]
    summary: str
