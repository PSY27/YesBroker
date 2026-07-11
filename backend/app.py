import os
import json
import asyncio
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schema import Prefs, Listing, CaseState, RankedListing, TrustReport
from planner import Planner
from arbiter import Arbiter, TARGET_SCORES

app = FastAPI(title="YesBroker (GharCheck) Backend Hub")

# Enable CORS for cross-origin frontend queries
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LISTINGS_PATH = os.path.join(BASE_DIR, "data", "listings.json")
SCORES_PATH = os.path.join(BASE_DIR, "data", "scores.json")

def load_listings() -> List[dict]:
    if not os.path.exists(LISTINGS_PATH):
        return []
    with open(LISTINGS_PATH, "r") as f:
        return json.load(f)

def load_scores() -> Dict[str, dict]:
    if not os.path.exists(SCORES_PATH):
        return {}
    with open(SCORES_PATH, "r") as f:
        return json.load(f)

# Request payloads
class InvestigateRequest(BaseModel):
    id: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "YesBroker Orchestrator v2"}

@app.post("/search", response_model=List[RankedListing])
def search(p: Prefs):
    """
    Search endpoint: filters core listings on area/pincode, BHK, and budget,
    then ranks them safely using precomputed safety scores.
    """
    listings = load_listings()
    scores = load_scores()
    
    matched = []
    for l in listings:
        pincode_match = False
        area_match = False
        
        if p.pincode:
            pincode_match = (l.get("pincode") == p.pincode)
        if p.area:
            area_match = (
                p.area.lower() in l.get("address", "").lower() or 
                p.area.lower() in l.get("title", "").lower()
            )
            
        if p.pincode and p.area:
            location_match = pincode_match or area_match
        elif p.pincode:
            location_match = pincode_match
        elif p.area:
            location_match = area_match
        else:
            location_match = True

        
        # 2. Budget match
        rent_match = (l.get("rent", 0) <= p.max_rent)

        # 3. BHK match
        bhk_match = (l.get("bhk") == p.bhk)

        # 4. Power backup filter (if required, ensure it doesn't state no backup)
        backup_match = True
        if p.power_backup:
            desc_lower = l.get("description", "").lower()
            if "no power backup" in desc_lower or "no backup" in desc_lower or "without backup" in desc_lower:
                backup_match = False

        # 5. Non-veg filter (if required, ensure it doesn't restrict to vegetarians only)
        non_veg_match = True
        if p.non_veg:
            desc_lower = l.get("description", "").lower()
            if "veg only" in desc_lower or "vegetarians only" in desc_lower or "strictly veg" in desc_lower or "pure veg" in desc_lower:
                non_veg_match = False

        if location_match and rent_match and bhk_match and backup_match and non_veg_match:
            matched.append(l)
            
    # Combine listings with precomputed score details
    matched_with_scores = []
    for l in matched:
        l_id = l.get("id")
        score_info = scores.get(l_id, {"score": 75, "verdict": "SAFE"})
        
        # Pull presentation target one-liner or use generic fallback description
        target_info = TARGET_SCORES.get(l_id, {})
        one_liner = target_info.get("one_liner", l.get("description", "Verified property status")[:60])
        
        score_info_with_one_liner = {
            "score": score_info.get("score", 75),
            "verdict": score_info.get("verdict", "SAFE"),
            "one_liner": one_liner
        }
        matched_with_scores.append((l, score_info_with_one_liner))
        
    # Sort by trust score descending (Safest First)
    matched_with_scores.sort(key=lambda x: x[1]["score"], reverse=True)
    
    # Return top 10 rows
    top_10 = matched_with_scores[:10]
    
    ranked_listings = []
    for i, (l, s_info) in enumerate(top_10):
        # Conform HIGH_RISK string to frontend standard 'RISK' for search table display
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
async def investigate(req: InvestigateRequest):
    """
    Live Investigation endpoint: fetches raw listing, executes
    Planner dispatcher loop, runs Arbiter checks, and compiles detailed report.
    """
    listings = load_listings()
    listing_data = next((l for l in listings if l["id"] == req.id), None)
    
    if not listing_data:
        # Fallback to pre-calculated score if listing was deleted from main index
        scores = load_scores()
        if req.id in scores:
            return scores[req.id]
        raise HTTPException(status_code=404, detail="Listing target not found in index.")
        
    # Convert dict to Listing model
    listing = Listing(**listing_data)
    
    # 1. Run live agent planner
    case_state = await Planner.plan_and_dispatch(listing)
    
    # 2. Run live arbiter consensus
    trust_report = await Arbiter.arbitrate_and_evaluate(case_state)
    
    return trust_report

@app.get("/investigate/stream/{id}")
async def investigate_stream(id: str):
    """
    Real-time Server-Sent Events (SSE) Streaming endpoint:
    Streams live orchestration progress updates line-by-line before returning
    the finalized multi-agent TrustReport JSON object.
    """
    listings = load_listings()
    listing_data = next((l for l in listings if l["id"] == id), None)
    
    if not listing_data:
        raise HTTPException(status_code=404, detail="Listing target not found in index.")
        
    listing = Listing(**listing_data)
    
    async def event_generator():
        queue = asyncio.Queue()

        # Non-generator async callback to feed the queue
        async def send_trace(msg: str):
            await queue.put({"type": "trace", "message": msg})

        # Background orchestrator task to run the agents
        async def run_orchestrator():
            try:
                # 1. Execute live multi-agent planner
                case_state = await Planner.plan_and_dispatch(listing, on_trace=send_trace)
                
                # 2. Execute live arbiter consensus
                trust_report = await Arbiter.arbitrate_and_evaluate(case_state, on_trace=send_trace)
                
                # 3. Put complete report in the queue
                await queue.put({"type": "report", "report": trust_report.dict()})
            except Exception as e:
                await queue.put({"type": "error", "message": f"Orchestrator error: {str(e)}"})
            finally:
                # None signals completion
                await queue.put(None)

        # Start agent execution in background
        task = asyncio.create_task(run_orchestrator())

        # Stream messages from the queue to the client
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"
            # Maintain a pleasant visual pacing (400ms) for the client logs
            await asyncio.sleep(0.4)

        await task

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Mount static frontend directories if compiled
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
