import os
import json
import sys
import asyncio

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schema import Prefs, RankedListing, TrustReport, Listing
from orchestrator import run_investigation
from scoring import build_trust_report
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


class InvestigateRequest(BaseModel):
    id: str


@app.get("/health")
def health():
    from tools.gemini_client import is_configured, get_model
    return {
        "status": "healthy",
        "gemini": "configured" if is_configured() else "missing_key",
        "model": get_model(),
    }


@app.post("/search", response_model=List[RankedListing])
def search(p: Prefs):
    listings = load_listings()
    scores = load_scores()

    matched = []
    for l in listings:
        pincode_match = False if p.pincode else True
        area_match = False if p.area else True

        if p.pincode:
            pincode_match = l.get("pincode") == p.pincode
        if p.area:
            area_match = (
                p.area.lower() in l.get("address", "").lower()
                or p.area.lower() in l.get("title", "").lower()
            )

        location_match = pincode_match and area_match
        rent_match = l.get("rent", 0) <= p.max_rent
        bhk_match = l.get("bhk") == p.bhk

        # Apply custom lifestyle preference filtering based on description keywords
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
        score_info = scores.get(l_id, {"score": 50, "verdict": "CAUTION", "one_liner": "Unverified listing"})
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
                score=s_info["score"],
                verdict=verdict,
                one_liner=s_info["one_liner"],
            )
        )

    return ranked_listings


async def _live_investigation(listing_id: str) -> tuple[TrustReport, list]:
    listing = get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    async with TracedInvestigation(echo=True) as tracer:
        state = await run_investigation(listing)
        report = build_trust_report(state)
        # Merge structured trace lines into reasoning for UI terminal
        trace_lines = [e.terminal_line() for e in tracer.events]
        report.reasoning = trace_lines + state.trace
        return report, tracer.events


@app.post("/investigate", response_model=TrustReport)
async def investigate(req: InvestigateRequest):
    """Run live multi-agent investigation with Gemini and return trust report."""
    report, _ = await _live_investigation(req.id)
    return report


@app.get("/investigate/stream")
async def investigate_stream(id: str):
    """SSE stream of agent conversation / trace events, then final report."""

    listing = get_listing_by_id(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    async def event_generator():
        async with TracedInvestigation(echo=False) as tracer:
            yield f"data: {json.dumps({'type': 'start', 'listing_id': id, 'title': listing.title})}\n\n"

            state = await run_investigation(listing)

            for event in tracer.events:
                payload = {"type": "trace", **event.model_dump()}
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(0.05)

            report = build_trust_report(state)
            trace_lines = [e.terminal_line() for e in tracer.events]
            report.reasoning = trace_lines + state.trace

            yield f"data: {json.dumps({'type': 'done', 'report': report.model_dump()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
