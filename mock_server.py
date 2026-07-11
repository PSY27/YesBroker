import time
import asyncio
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schema import Prefs, RankedListing, TrustReport, AgentResult

app = FastAPI(title="GharCheck Mock API", description="Mock API for GharCheck frontend testing")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock DB of Ranked Listings (matching 2BHK Indiranagar <= 35k)
MOCK_LISTINGS = [
    RankedListing(rank=1, id="L034", title="2BHK 100 Ft Road", rent=34000, score=87, verdict="SAFE", one_liner="Original photos, fair price, 18-min commute"),
    RankedListing(rank=2, id="L055", title="2BHK 12th Main", rent=33000, score=82, verdict="SAFE", one_liner="Verified owner history, RERA registered society, 14-min commute"),
    RankedListing(rank=3, id="L012", title="2BHK CMH Road", rent=35000, score=79, verdict="SAFE", one_liner="Fair pricing, right next to metro, 25-min commute"),
    RankedListing(rank=4, id="L088", title="2BHK Jeevan Bima Nagar", rent=32000, score=68, verdict="CAUTION", one_liner="Slightly low rent, minor photo matches in Chennai listings"),
    RankedListing(rank=5, id="L074", title="2BHK HAL 2nd Stage", rent=31000, score=61, verdict="CAUTION", one_liner="Commute claim is exaggerated, owner phone unverified"),
    RankedListing(rank=6, id="L042", title="2BHK Domlur border", rent=30000, score=55, verdict="CAUTION", one_liner="15% below median rent, phone registered in multiple states"),
    RankedListing(rank=7, id="L021", title="2BHK Prime Indiranagar", rent=24000, score=34, verdict="HIGH_RISK", one_liner="Stock interior photos, 31% below median rent"),
    RankedListing(rank=8, id="L063", title="2BHK Spacious, near metro", rent=22000, score=28, verdict="HIGH_RISK", one_liner="Identical description found on Olx scam reports"),
    RankedListing(rank=9, id="L091", title="2BHK Owner going abroad", rent=18000, score=18, verdict="HIGH_RISK", one_liner="Stolen photo + 49% below market + scam language"),
    RankedListing(rank=10, id="L009", title="2BHK Urgent, token to hold", rent=16000, score=12, verdict="HIGH_RISK", one_liner="Demands token advance prior to physical visit, stolen image")
]

# Detailed Trust Reports mapping
MOCK_REPORTS = {
    "L091": TrustReport(
        listing_id="L091",
        score=18,
        verdict="HIGH_RISK",
        flags=[
            AgentResult(agent="photo", verdict="SUSPICIOUS", detail="Photo #2 stolen — appears on Hyderabad + Pune listings", evidence=["nobroker.in/hyd/flat/2bhk-hsr-layout", "99acres.com/pune/property/2bhk-wakad"], confidence=0.95, weight=0.35),
            AgentResult(agent="web", verdict="SUSPICIOUS", detail="Broker phone number (+91 98860 XXXXX) flagged in multiple scam-report forums on Olx/NoBroker, and exact description appears on 4 other listings under different owners.", evidence=["scamalert-bangalore.com/phone/98860xxxxx", "magicbricks.com/bangalore/dup-listing-102"], confidence=0.90, weight=0.25),
            AgentResult(agent="price", verdict="BAIT", detail="Rent ₹18,000 is 49% below the Indiranagar 2BHK area median of ₹35,000", evidence=["Indiranagar 2BHK Median: ₹35,000"], confidence=1.0, weight=0.15),
            AgentResult(agent="commute", verdict="LIE", detail="Listing claims '5 min to metro' — real 9 AM commute is 21 min; commute to your office (Embassy GolfLinks) is 47 min", evidence=["Real 9 AM commute to nearest Metro: 21 min", "Commute to Embassy GolfLinks: 47 min"], confidence=0.85, weight=0.15),
            AgentResult(agent="text", verdict="SUSPICIOUS", detail="Linguistic patterns match common rental scams: 'owner abroad', 'pay token to hold', 'WhatsApp me directly'", evidence=["owner abroad", "pay token", "WhatsApp me"], confidence=0.8, weight=0.1)
        ],
        reasoning=[
            "Planner initiated: detected cheap price (₹18k vs ₹35k median) + suspicious words ('owner abroad') in text.",
            "Planner dispatched Price and Text agents (cheap price flagged BAIT, text flagged SUSPICIOUS).",
            "Planner escalated to deep Photo-Forensics scan and Web-Recon search on broker's phone.",
            "Photo agent ran Cloud Vision Web Detection and found Photo #2 was first posted in a Hyderabad listing 6 months ago, and then in Pune.",
            "Web-Recon agent queried Google Search grounding and found 3 fraud complaints on the phone number on Indian real-estate complaint boards.",
            "Arbiter triggered: conflict detected (Photos marked CLEAN by standard listing tags but flagged by deep Vision web-deduplication).",
            "Arbiter hypothesis: photo stolen recently, bypasses standard index. Re-dispatched Photo with low-threshold within-batch dedup.",
            "Re-dispatch confirmed: Photo is a direct duplicate of a known scam listing. Arbiter consolidated findings.",
            "Arbiter dispatched Commute-Truth agent to double-check '5 min to metro' claim vs actual distance matrix. Commute agent flagged LIE (21 min actual commute).",
            "Arbiter resolved final verdict: HIGH_RISK (Score: 18/100)."
        ],
        questions_to_ask=[
            "Can I video-call live from inside the flat right now?",
            "Why is the rent so far below other 2BHKs here?",
            "Can I pay strictly after a physical visit — no token advance?"
        ]
    ),
    "L034": TrustReport(
        listing_id="L034",
        score=87,
        verdict="SAFE",
        flags=[
            AgentResult(agent="photo", verdict="CLEAN", detail="Original photo cluster. Metadata matches device parameters. No web matches found outside owner listings.", evidence=["No web matches detected"], confidence=0.98, weight=0.35),
            AgentResult(agent="web", verdict="CLEAN", detail="Broker phone history has 4-year active history in Bangalore rental market with zero scam reports. Listed address matches legal municipal societies.", evidence=["Verified broker account", "BDA layout matched"], confidence=0.92, weight=0.25),
            AgentResult(agent="price", verdict="CLEAN", detail="Rent ₹34,000 is perfectly in line with Indiranagar 100 Ft Road market median (3% below area average).", evidence=["Median rent: ₹35,000"], confidence=1.0, weight=0.15),
            AgentResult(agent="commute", verdict="CLEAN", detail="Claimed commute: 15 min. Real 9 AM Google Maps driving time to Embassy GolfLinks is 18 minutes (Minor deviation).", evidence=["Real commute: 18 min", "Maps verified"], confidence=0.95, weight=0.15),
            AgentResult(agent="text", verdict="CLEAN", detail="Neutral, descriptive writing. Recommends standard physical verification. No scam trigger words.", evidence=["Standard draft pattern"], confidence=0.90, weight=0.1)
        ],
        reasoning=[
            "Planner initiated: standard pricing (₹34k) + clean textual description.",
            "Planner dispatched Price and Text agents. Both returned CLEAN.",
            "Planner dispatched Photo-Forensics and Web-Recon as a routine verification step.",
            "Photo-Forensics found completely unique photos without watermarks or cross-portal copies.",
            "Web-Recon verified broker's phone number as a registered premium agency with several historical listings and no negative reports.",
            "Commute-Truth verified commute claims as accurate (18-min real drive).",
            "Arbiter consolidated results. No conflicts or red flags. Score determined at 87/100.",
            "Arbiter resolved final verdict: SAFE"
        ],
        questions_to_ask=[
            "Is the maintenance charges included in the rent?",
            "What is the notice period for lease termination?",
            "Can I get a copy of the building association rules?"
        ]
    )
}

# Default report fallback for remaining listings
def generate_default_report(id: str) -> TrustReport:
    listing = next((l for l in MOCK_LISTINGS if l.id == id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    score = listing.score
    verdict = listing.verdict
    
    return TrustReport(
        listing_id=id,
        score=score,
        verdict=verdict,
        flags=[
            AgentResult(agent="photo", verdict="CLEAN" if score > 70 else "CAUTION" if score > 50 else "SUSPICIOUS", detail=f"Photo evaluation for {listing.title}", evidence=[], confidence=0.8, weight=0.35),
            AgentResult(agent="web", verdict="CLEAN" if score > 70 else "CAUTION" if score > 50 else "SUSPICIOUS", detail=f"Web reputation scan for {listing.title}", evidence=[], confidence=0.8, weight=0.25),
            AgentResult(agent="price", verdict="CLEAN" if score > 50 else "BAIT", detail=f"Price check: Rent is ₹{listing.rent:,}", evidence=[], confidence=0.9, weight=0.15),
            AgentResult(agent="commute", verdict="CLEAN" if score > 60 else "LIE", detail="Commute check completed", evidence=[], confidence=0.85, weight=0.15),
            AgentResult(agent="text", verdict="CLEAN" if score > 60 else "SUSPICIOUS", detail="Linguistic pattern evaluation completed", evidence=[], confidence=0.8, weight=0.1)
        ],
        reasoning=[
            f"Planner initiated investigation on {listing.title}.",
            f"Evaluated 5 distinct data streams. Score is {score}/100.",
            f"Arbiter resolved verdict as {verdict}."
        ],
        questions_to_ask=[
            "Can I get a written receipt for the deposit?",
            "Is there a dedicated parking slot for two-wheelers/four-wheelers?"
        ]
    )

@app.post("/search", response_model=List[RankedListing])
async def search(prefs: Prefs):
    # Simulate slight API round-trip delay
    await asyncio.sleep(1.0)
    return MOCK_LISTINGS

@app.post("/investigate", response_model=TrustReport)
async def investigate(req: Dict[str, str]):
    listing_id = req.get("id")
    if not listing_id:
        raise HTTPException(status_code=400, detail="id parameter is required")
    
    # Simulate Live Agentic Investigation Delay (the "wow" factor for frontend)
    await asyncio.sleep(0.5)
    
    if listing_id in MOCK_REPORTS:
        return MOCK_REPORTS[listing_id]
    else:
        return generate_default_report(listing_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("mock_server:app", host="127.0.0.1", port=8000, reload=True)
