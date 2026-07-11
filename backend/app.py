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
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from schema import Prefs, RankedListing, TrustReport, Listing
from orchestrator import run_investigation
from scoring import build_trust_report, search_summary_from_report
from trace import TracedInvestigation, SearchTraceHub
from listing_store import (
    register_live_listings,
    get_live_listing,
    all_live_listings,
    clear_session,
    cache_report,
    get_cached_report,
    all_cached_reports,
)
from tools.collect import fetch_live_listings

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
_USE_LIVE = os.getenv("USE_LIVE_LISTINGS", "true").lower() in ("1", "true", "yes")
_INVESTIGATE_ON_SEARCH = os.getenv("INVESTIGATE_ON_SEARCH", "true").lower() in ("1", "true", "yes")
_INVESTIGATE_PARALLEL = int(os.getenv("INVESTIGATE_PARALLEL", "3"))


def load_static_listings() -> list[dict]:
    if not os.path.exists(LISTINGS_PATH):
        return []
    with open(LISTINGS_PATH, "r") as f:
        return json.load(f)


def load_scores():
    if not os.path.exists(SCORES_PATH):
        return {}
    with open(SCORES_PATH, "r") as f:
        return json.load(f)


async def fetch_listings_for_search(p: Prefs) -> list[dict]:
    """Primary: Playwright live scrape. Fallback: static listings.json."""
    area = (p.area or "Indiranagar").strip()

    if _USE_LIVE:
        try:
            live_rows = await fetch_live_listings(
                area,
                bhk=p.bhk,
                max_rent=p.max_rent,
                limit=25,
            )
            if live_rows:
                register_live_listings(live_rows)
                return live_rows
        except Exception as exc:
            print(f"[App] Live scrape failed: {exc}")

    return load_static_listings()


def get_listing_by_id(listing_id: str) -> Listing | None:
    live = get_live_listing(listing_id)
    if live:
        return live
    for row in load_static_listings():
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


def _filter_listings(listings: list[dict], p: Prefs) -> list[dict]:
    p_pincode = p.pincode.strip() if (p.pincode and p.pincode.strip().lower() not in ("null", "undefined", "")) else None
    p_area = p.area.strip() if (p.area and p.area.strip().lower() not in ("null", "undefined", "")) else None

    matched = []
    for l in listings:
        pincode_match = False if p_pincode else True
        area_match = False if p_area else True

        if p_pincode:
            pincode_match = l.get("pincode") == p_pincode
        if p_area:
            addr = l.get("address", "").lower()
            title = l.get("title", "").lower()
            area_match = p_area.lower() in addr or p_area.lower() in title

        location_match = pincode_match or area_match
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

    return matched


async def _investigate_one(
    listing_row: dict,
    office: str | None,
    hub: SearchTraceHub | None = None,
) -> TrustReport:
    listing = Listing(**listing_row)
    short = (listing.title or listing.id)[:36]

    if hub:
        hub.status(f"▶ Analyzing: {short}")

    async with TracedInvestigation(echo=hub is None) as tracer:
        task = asyncio.create_task(run_investigation(listing, office=office))

        while not task.done():
            if hub:
                event = await tracer.wait_event(timeout=0.1)
                if event is not None:
                    hub.trace(listing.id, short, event)
            else:
                await asyncio.sleep(0.05)

        state = await task

        if hub:
            while True:
                event = await tracer.wait_event(timeout=0.01)
                if event is None:
                    break
                hub.trace(listing.id, short, event)

        report = build_trust_report(state)
        trace_lines = [e.terminal_line() for e in tracer.events]
        report.reasoning = trace_lines + state.trace
        cache_report(report)

        if hub:
            hub.status(f"✓ Done: {short} — score {report.score} ({report.verdict})")

        return report


async def batch_investigate(
    listings: list[dict],
    office: str | None,
    limit: int = 10,
    hub: SearchTraceHub | None = None,
) -> None:
    """Run agent pipeline once per listing during search; results cached for instant detail view."""
    sem = asyncio.Semaphore(_INVESTIGATE_PARALLEL)

    async def guarded(row: dict) -> None:
        async with sem:
            await _investigate_one(row, office, hub=hub)

    await asyncio.gather(*[guarded(row) for row in listings[:limit]])


def _score_from_report(report: TrustReport | None, listing_id: str, scores: dict) -> dict:
    if report:
        summary = search_summary_from_report(report)
        return summary
    return score_info_for_listing(scores, listing_id)


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
        "live_listings": _USE_LIVE,
        "cached_live_count": len(all_live_listings()),
        "cached_reports": len(all_cached_reports()),
    }


def _build_ranked_listings(
    top_candidates: list[dict], p: Prefs, scores: dict
) -> list[RankedListing]:
    matched_with_scores = []
    for l in top_candidates:
        l_id = l.get("id")
        cached = get_cached_report(l_id)
        score_info = _score_from_report(cached, l_id, scores)
        matched_with_scores.append((l, score_info))

    matched_with_scores.sort(key=lambda x: x[1]["score"], reverse=True)

    ranked_listings = []
    for i, (l, s_info) in enumerate(matched_with_scores):
        verdict = s_info["verdict"]
        if verdict == "HIGH_RISK":
            verdict = "RISK"

        photo = (l.get("photo_urls") or [None])[0]
        image_url = photo if isinstance(photo, str) and photo.startswith("images/") else ""

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
                    "Live listing — run investigation for trust score"
                    if l["id"].startswith("LIVE_")
                    else "Unverified listing",
                ),
                bhk=l.get("bhk"),
                area=p.area,
                pincode=l.get("pincode"),
                imageUrl=image_url or None,
            )
        )

    return ranked_listings


async def execute_search(
    p: Prefs, hub: SearchTraceHub | None = None
) -> list[RankedListing]:
    clear_session()

    if hub:
        hub.status("Scraping live listings from NoBroker...")

    listings = await fetch_listings_for_search(p)
    scores = load_scores()

    if hub:
        hub.status(f"Found {len(listings)} listings. Applying filters...")

    matched = _filter_listings(listings, p)
    top_candidates = matched[:10]

    if hub:
        hub.status(
            f"Matched {len(matched)} listings. "
            f"Running trust analysis on top {len(top_candidates)}..."
        )

    if _INVESTIGATE_ON_SEARCH and top_candidates:
        print(f"[App] Batch investigating {len(top_candidates)} listings...")
        await batch_investigate(top_candidates, p.office, limit=10, hub=hub)

    return _build_ranked_listings(top_candidates, p, scores)


@app.post("/search", response_model=List[RankedListing])
async def search(p: Prefs):
    return await execute_search(p)


@app.get("/search/stream")
async def search_stream(
    area: str = "Indiranagar",
    pincode: Optional[str] = None,
    max_rent: int = 35000,
    bhk: str = "2",
    office: Optional[str] = None,
    power_backup: bool = False,
    non_veg: bool = False,
):
    """SSE stream for search — emits live agent trace while analyzing listings."""

    p = Prefs(
        area=area,
        pincode=pincode if pincode and pincode.lower() not in ("null", "undefined", "") else None,
        max_rent=max_rent,
        bhk=bhk.replace(" BHK", "").replace("BHK", "").strip() or "2",
        office=office if office else None,
        power_backup=power_backup,
        non_veg=non_veg,
    )

    async def event_generator():
        hub = SearchTraceHub()
        yield f"data: {json.dumps({'type': 'start', 'area': p.area, 'bhk': p.bhk, 'max_rent': p.max_rent})}\n\n"

        task = asyncio.create_task(execute_search(p, hub=hub))

        while not task.done():
            evt = await hub.wait_event(timeout=0.1)
            if evt is not None:
                yield f"data: {json.dumps(evt)}\n\n"

        for evt in hub.drain():
            yield f"data: {json.dumps(evt)}\n\n"

        try:
            results = await task
            payload = {
                "type": "done",
                "listings": [r.model_dump() for r in results],
            }
            yield f"data: {json.dumps(payload)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/report/{listing_id}", response_model=TrustReport)
def get_report(listing_id: str):
    """Return cached trust report from the last search (instant detail view)."""
    report = get_cached_report(listing_id)
    if report:
        return report
    raise HTTPException(
        status_code=404,
        detail="Report not found. Run search first to analyze listings.",
    )


async def _live_investigation(
    listing_id: str, office: str | None = None, *, force: bool = False
) -> tuple[TrustReport, list]:
    if not force:
        cached = get_cached_report(listing_id)
        if cached:
            return cached, []

    listing = get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    async with TracedInvestigation(echo=True) as tracer:
        state = await run_investigation(listing, office=office)
        report = build_trust_report(state)
        trace_lines = [e.terminal_line() for e in tracer.events]
        report.reasoning = trace_lines + state.trace
        cache_report(report)
        return report, tracer.events


@app.post("/investigate", response_model=TrustReport)
async def investigate(req: InvestigateRequest):
    """Run live multi-agent investigation with Gemini and return trust report."""
    report, _ = await _live_investigation(req.id, office=req.office)
    return report


@app.get("/investigate/stream")
async def investigate_stream(id: str, office: Optional[str] = None, force: bool = False):
    """SSE stream — returns cached report instantly if available."""

    listing = get_listing_by_id(id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")

    cached = get_cached_report(id) if not force else None
    if cached:
        async def cached_generator():
            yield f"data: {json.dumps({'type': 'start', 'listing_id': id, 'title': listing.title})}\n\n"
            yield f"data: {json.dumps({'type': 'trace', 'actor': 'system', 'message': 'Loaded cached report from search analysis.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'report': cached.model_dump()})}\n\n"

        return StreamingResponse(
            cached_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

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
            cache_report(report)

            yield f"data: {json.dumps({'type': 'done', 'report': report.model_dump()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
