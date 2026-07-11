from pydantic import BaseModel
from typing import Optional, List, Dict

class Prefs(BaseModel):
    area: str
    pincode: Optional[str] = None
    max_rent: int
    bhk: str
    office: Optional[str] = None
    power_backup: Optional[bool] = False
    non_veg: Optional[bool] = False

class Listing(BaseModel):
    id: str
    rent: Optional[int] = None
    deposit: Optional[int] = None
    bhk: Optional[str] = None
    area_sqft: Optional[int] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    claimed_commute_min: Optional[int] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    photo_urls: List[str] = []
    source_url: Optional[str] = None

class AgentResult(BaseModel):
    agent: str            # photo | web | price | commute | text
    verdict: str          # SAFE | CAUTION | BAIT | LIE | SUSPICIOUS | CLEAN
    detail: str           # explanatory text
    evidence: List[str] = []  # links, values, etc.
    confidence: float     # 0.0 to 1.0
    weight: float         # influence on final score

class CaseState(BaseModel):
    listing: Listing
    findings: List[AgentResult] = []
    directives: Dict[str, str] = {}
    trace: List[str] = []

class RankedListing(BaseModel):
    rank: int
    id: str
    title: str
    rent: int
    score: int
    verdict: str          # SAFE | CAUTION | HIGH_RISK
    one_liner: str        # e.g., "Original photos, fair price, 18-min commute"

class TrustReport(BaseModel):
    listing_id: str
    score: int
    verdict: str          # SAFE | CAUTION | HIGH_RISK
    flags: List[AgentResult]
    reasoning: List[str]
    questions_to_ask: List[str]
