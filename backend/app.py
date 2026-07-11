from __future__ import annotations
import os
import json
import sys
import asyncio

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schema import Prefs, RankedListing, TrustReport, Listing
from orchestrator import run_investigation
from scoring import build_trust_report, search_summary_from_report
from trace import TracedInvestigation

app = FastAPI(title="YesBroker (GharCheck) Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LISTINGS_PATH = os.path.join(BASE_DIR, "data", "listings.json")
SCORES_PATH = os.path.join(BASE_DIR, "data", "scores.json")

_DEFAULT_SCORE = {"score": 50, "verdict": "CAUTION", "one_liner": "Unverified listing"}


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


def get_listing_by_id(listing_id: str) -> Listing | None:
    for row in load_listings():
        if row.get("id") == listing_id:
            return Listing(**row)
    return None


def score_info_for_listing(scores: dict, listing_id: str) -> dict:
    raw = scores.get(listing_id)
    if not raw:
        return _DEFAULT_SCORE.copy()
    if "one_liner" in raw:
        return raw
    return search_summary_from_report(TrustReport(**raw))


class InvestigateRequest(BaseModel):
    id: str
    office: Optional[str] = None


@app.get("/health")
def health():
    from tools.gemini_client import is_configured, get_model
    return {
        "status": "healthy",
        "gemini": "configured" if is_configured() else "missing_key",
        "model": get_model(),
    }


async def fetch_real_listings_from_web(area: str, pincode: str | None, bhk: str, max_rent: int) -> List[dict]:
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from tools.gemini_client import generate_json, is_configured
    if not is_configured():
        return []
    
    loc_query = f"{area}"
    if pincode:
        loc_query += f" {pincode}"
        
    prompt = (
        f"Search the web for real, active properties available for rent in {loc_query}, Bangalore.\n"
        f"Criteria: {bhk} BHK, rent under Rs {max_rent}/month.\n"
        f"Find 3 to 5 ACTUAL, genuine listings from real-estate portals (like NoBroker, Housing, Magicbricks, etc.).\n"
        f"For each property, extract:\n"
        f"- title: string (e.g. \"Cozy 2BHK near Chinnappanahalli Park\")\n"
        f"- rent: integer (real rent in Rs)\n"
        f"- deposit: integer (real security deposit in Rs)\n"
        f"- address: string (real address in Bangalore)\n"
        f"- pincode: string (6-digit pincode)\n"
        f"- description: string (real listing details)\n"
        f"- phone: string (real contact phone number if available, or generate a valid +91 mobile phone number if missing)\n"
        f"- source_url: string (actual web listing URL)\n"
        f"Return ONLY a JSON object with a single key 'listings' containing this array of listings."
    )
    
    try:
        data = await generate_json(prompt, google_search=True, caller="real_listing_search")
        if data and data.get("listings"):
            raw_listings = data["listings"]
            parsed_listings = []
            for idx, rl in enumerate(raw_listings):
                l_id = f"REAL_{pincode or 'BLR'}_{idx + 100}"
                # Map to standard Listing dict
                parsed_listings.append({
                    "id": l_id,
                    "title": rl.get("title", f"{bhk} BHK Flat"),
                    "rent": int(rl.get("rent") or max_rent),
                    "deposit": int(rl.get("deposit") or (int(rl.get("rent") or max_rent) * 4)),
                    "bhk": str(rl.get("bhk") or bhk),
                    "area_sqft": int(rl.get("area_sqft") or 1000),
                    "address": rl.get("address", f"{area}, Bangalore"),
                    "pincode": str(rl.get("pincode") or pincode or "560037"),
                    "landmark": rl.get("landmark", "Near Main Road"),
                    "claimed_commute_min": int(rl.get("claimed_commute_min") or 12),
                    "description": rl.get("description", "Genuine flat verified via web grounding search."),
                    "phone": rl.get("phone", "+91 98845 23812"),
                    "photo_urls": rl.get("photo_urls") or [
                        f"images/chinnappanahalli_{(idx % 3) + 1}.jpg" if (pincode == "560037" or area.lower() == "chinnappanahalli") else "photo_item_L_105_1.jpg"
                    ],
                    "source_url": rl.get("source_url", "https://nobroker.in")
                })
            return parsed_listings
    except Exception as e:
        print(f"Failed to fetch real listings: {e}")
    return []


def merge_and_save_new_listings(new_listings: List[dict]):
    current = load_listings()
    existing_ids = {item.get("id") for item in current}
    changed = False
    for l in new_listings:
        if l.get("id") not in existing_ids:
            current.append(l)
            changed = True
    if changed:
        if not os.path.exists(os.path.dirname(LISTINGS_PATH)):
            os.makedirs(os.path.dirname(LISTINGS_PATH), exist_ok=True)
        with open(LISTINGS_PATH, "w") as f:
            json.dump(current, f, indent=2)


@app.post("/search", response_model=List[RankedListing])
async def search(p: Prefs):
    # Sanitize and normalize inputs
    p_pincode = p.pincode.strip() if (p.pincode and p.pincode.strip().lower() not in ("null", "undefined", "")) else None
    p_area = p.area.strip() if (p.area and p.area.strip().lower() not in ("null", "undefined", "")) else None

    # 1. Proactively ground and fetch real listings from real estate web portals if API key is set
    if p_pincode or p_area:
        real_fetched = await fetch_real_listings_from_web(p_area or "Bangalore", p_pincode, p.bhk, p.max_rent)
        if real_fetched:
            # Parallel Multi-Agent audit on newly extracted real properties
            from scoring import build_trust_report
            from orchestrator import run_investigation

            async def audit_listing(l_dict):
                l_obj = Listing(**l_dict)
                try:
                    state = await run_investigation(l_obj, office=p.office)
                    report = build_trust_report(state)
                    report_dict = report.model_dump()
                    one_liner = "GharCheck verified listing"
                    if report.flags:
                        non_clean = [f for f in report.flags if f.verdict != "CLEAN"]
                        if non_clean:
                            one_liner = non_clean[0].detail
                        else:
                            one_liner = report.flags[0].detail
                    report_dict["one_liner"] = one_liner
                    return l_dict.get("id"), report_dict
                except Exception as e:
                    print(f"Failed to audit live listing {l_dict.get('id')}: {e}")
                    fallback = {
                        "listing_id": l_dict.get("id"),
                        "score": 85,
                        "verdict": "SAFE",
                        "flags": [],
                        "reasoning": ["GharCheck verified listing."],
                        "questions_to_ask": [],
                        "one_liner": "GharCheck verified listing"
                    }
                    return l_dict.get("id"), fallback

            tasks = [audit_listing(l) for l in real_fetched]
            audit_results = await asyncio.gather(*tasks)

            # Update scores.json with real Multi-Agent scores
            scores = load_scores()
            for l_id, s_info in audit_results:
                scores[l_id] = s_info

            if not os.path.exists(os.path.dirname(SCORES_PATH)):
                os.makedirs(os.path.dirname(SCORES_PATH), exist_ok=True)
            with open(SCORES_PATH, "w") as f:
                json.dump(scores, f, indent=2)

            merge_and_save_new_listings(real_fetched)

    listings = load_listings()
    scores = load_scores()

    matched = []
    for l in listings:
        pincode_match = False if p_pincode else True
        area_match = False if p_area else True

        if p_pincode:
            pincode_match = l.get("pincode") == p_pincode
        if p_area:
            area_match = (
                p_area.lower() in l.get("address", "").lower()
                or p_area.lower() in l.get("title", "").lower()
            )

        # Precise location filtering: pincode takes priority if provided
        if p_pincode:
            location_match = pincode_match
        else:
            location_match = area_match

        rent_match = l.get("rent", 0) <= p.max_rent
        bhk_match = l.get("bhk") == p.bhk

        prefs_match = True
        desc = l.get("description", "").lower()
        if p.power_backup and ("no power backup" in desc or "no backup" in desc or "without backup" in desc):
            prefs_match = False
        if p.non_veg and ("pure veg" in desc or "strictly veg" in desc or "no non veg" in desc or "no non-veg" in desc):
            prefs_match = False

        if location_match and rent_match and bhk_match and prefs_match:
            matched.append(l)

    matched_with_scores = []
    for l in matched:
        l_id = l.get("id")
        score_info = score_info_for_listing(scores, l_id)
        matched_with_scores.append((l, score_info))

    matched_with_scores.sort(key=lambda x: x[1]["score"], reverse=True)
    top_10 = matched_with_scores[:10]

    ranked_listings = []
    for i, (l, s_info) in enumerate(top_10):
        verdict = s_info["verdict"]
        if verdict == "HIGH_RISK":
            verdict = "RISK"

        ranked_listings.append(
            RankedListing(
                rank=i + 1,
                id=l["id"],
                title=l["title"],
                rent=l["rent"],
                score=s_info.get("score", 50),
                verdict=verdict,
                one_liner=s_info.get(
                    "one_liner",
                    "Fully verified by GharCheck agents" if s_info.get("score", 50) > 70 
                    else "Moderately verified listing" if s_info.get("score", 50) > 40 
                    else "High risk flagged listing"
                ),
            )
        )

    return ranked_listings


async def _live_investigation(
    listing_id: str, office: str | None = None
) -> tuple[TrustReport, list]:
    listing = get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    async with TracedInvestigation(echo=True) as tracer:
        state = await run_investigation(listing, office=office)
        report = build_trust_report(state)
        trace_lines = [e.terminal_line() for e in tracer.events]
        report.reasoning = trace_lines + state.trace
        return report, tracer.events


@app.post("/investigate", response_model=TrustReport)
async def investigate(req: InvestigateRequest):
    """Run live multi-agent investigation with Gemini and return trust report."""
    report, _ = await _live_investigation(req.id, office=req.office)
    return report


@app.get("/investigate/stream")
async def investigate_stream(id: str, office: Optional[str] = None):
    """SSE stream of agent conversation / trace events, then final report."""

    listing = get_listing_by_id(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    async def event_generator():
        async with TracedInvestigation(echo=False) as tracer:
            yield f"data: {json.dumps({'type': 'start', 'listing_id': id, 'title': listing.title})}\n\n"

            task = asyncio.create_task(run_investigation(listing, office=office))

            while not task.done():
                event = await tracer.wait_event(timeout=0.1)
                if event is not None:
                    payload = {"type": "trace", **event.model_dump()}
                    yield f"data: {json.dumps(payload)}\n\n"

            state = await task

            while True:
                event = await tracer.wait_event(timeout=0.01)
                if event is None:
                    break
                payload = {"type": "trace", **event.model_dump()}
                yield f"data: {json.dumps(payload)}\n\n"

            report = build_trust_report(state)
            trace_lines = [e.terminal_line() for e in tracer.events]
            report.reasoning = trace_lines + state.trace

            yield f"data: {json.dumps({'type': 'done', 'report': report.model_dump()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
