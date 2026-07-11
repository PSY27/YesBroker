from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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
    structured_evidence: Optional[Dict[str, Any]] = None  # typed payload for frontend UI
    confidence: float
    weight: float
    recommend_next: List[str] = []

    def to_agent_output(self, recommend_next: List[str] | None = None) -> Dict[str, Any]:
        return {
            "agent": self.agent,
            "result": self.verdict,
            "confidence": round(self.confidence, 2),
            "reason": self.detail,
            "recommend_next": recommend_next if recommend_next is not None else self.recommend_next,
        }


class PlannerDecision(BaseModel):
    next_agents: List[str]
    reason: str
    stop: bool = False


class ReflectionDecision(BaseModel):
    sufficient: bool
    reason: str
    additional_agent: Optional[str] = None
    approved: bool = False

class CaseState(BaseModel):
    listing: Listing
    findings: List[AgentResult] = []
    directives: Dict[str, str] = {}
    trace: List[str] = []
    reflection_notes: List[str] = []

class RankedListing(BaseModel):
    rank: int
    id: str
    title: str
    rent: int
    score: int
    verdict: str               # SAFE | CAUTION | RISK
    one_liner: str
    bhk: Optional[str] = "2"
    area: Optional[str] = ""
    pincode: Optional[str] = ""
    imageUrl: Optional[str] = ""

class TrustReport(BaseModel):
    listing_id: str
    score: int
    verdict: str               # SAFE | CAUTION | HIGH_RISK
    flags: List[AgentResult]
    reasoning: List[str]
    questions_to_ask: List[str]
