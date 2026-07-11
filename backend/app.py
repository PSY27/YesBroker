import os
import json
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schema import Prefs, RankedListing, TrustReport

app = FastAPI(title="YesBroker (GharCheck) Backend")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LISTINGS_PATH = os.path.join(BASE_DIR, "data", "listings.json")
SCORES_PATH = os.path.join(BASE_DIR, "data", "scores.json")

def load_listings():
    if not os.path.exists(LISTINGS_PATH):
        return []
    with open(LISTINGS_PATH, "r") as f:
        return json.load(f)

def load_scores():
    if not os.path.exists(SCORES_PATH):
        return {}
    with open(SCORES_PATH, "r") as f:
        return json.load(f)

# Request schema for single listing investigation
class InvestigateRequest(BaseModel):
    id: str

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/search", response_model=List[RankedListing])
def search(p: Prefs):
    listings = load_listings()
    scores = load_scores()
    
    matched = []
    for l in listings:
        # 1. Pincode / Area match
        pincode_match = True
        area_match = True
        
        if p.pincode:
            pincode_match = (l.get("pincode") == p.pincode)
        if p.area:
            area_match = (p.area.lower() in l.get("address", "").lower() or p.area.lower() in l.get("title", "").lower())
            
        # Match either area or pincode
        location_match = pincode_match or area_match
        
        # 2. Max Rent match
        rent_match = (l.get("rent", 0) <= p.max_rent)
        
        # 3. BHK match
        bhk_match = (l.get("bhk") == p.bhk)
        
        if location_match and rent_match and bhk_match:
            matched.append(l)
            
    # Sort by trust score from scores.json, safest first
    # Fallback score is 50 if not precomputed
    matched_with_scores = []
    for l in matched:
        l_id = l.get("id")
        score_info = scores.get(l_id, {"score": 50, "verdict": "CAUTION", "one_liner": "Unverified listing"})
        matched_with_scores.append((l, score_info))
        
    # Sort descending by score
    matched_with_scores.sort(key=lambda x: x[1]["score"], reverse=True)
    
    # Cap at top 10
    top_10 = matched_with_scores[:10]
    
    ranked_listings = []
    for i, (l, s_info) in enumerate(top_10):
        # In case the pre-computed verdict was HIGH_RISK, standard UI displays RISK or HIGH_RISK.
        # We ensure it conforms to SAFE | CAUTION | RISK as specified in standard search UI rows.
        verdict = s_info["verdict"]
        if verdict == "HIGH_RISK":
            verdict = "RISK"
            
        ranked_listings.append(RankedListing(
            rank=i + 1,
            id=l["id"],
            title=l["title"],
            rent=l["rent"],
            score=s_info["score"],
            verdict=verdict,
            one_liner=s_info["one_liner"]
        ))
        
    return ranked_listings

@app.post("/investigate", response_model=TrustReport)
def investigate(req: InvestigateRequest):
    scores = load_scores()
    l_id = req.id
    
    if l_id not in scores:
        raise HTTPException(status_code=404, detail="Listing score details not found.")
        
    return scores[l_id]

# Mount frontend if it exists
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
