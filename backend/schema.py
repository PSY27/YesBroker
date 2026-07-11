from pydantic import BaseModel
from typing import List, Optional, Dict

class Prefs(BaseModel):
    area: str
    pincode: Optional[str] = None
    max_rent: int
    bhk: str
    office: Optional[str] = None

class Listing(BaseModel):
    id: str
    title: str
    rent: int
    deposit: Optional[int] = None
    bhk: str
    area_sqft: Optional[int] = None
    address: str
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    claimed_commute_min: Optional[int] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    photo_urls: List[str] = []
    source_url: Optional[str] = None

class AgentResult(BaseModel):
    agent: str                 # photo | price | commute | text | web
    verdict: str               # SAFE | SUSPICIOUS | BAIT | LIE | CLEAN
    detail: str
    evidence: List[str] = []
    confidence: float
    weight: float

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
    verdict: str               # SAFE | CAUTION | RISK
    one_liner: str

class TrustReport(BaseModel):
    listing_id: str
    score: int
    verdict: str               # SAFE | CAUTION | HIGH_RISK
    flags: List[AgentResult]
    reasoning: List[str]
    questions_to_ask: List[str]
