"""Integration tests for agentic planner, reflection, and selective execution."""

from __future__ import annotations

import pytest

from schema import CaseState
from orchestrator import run_investigation
from agents.photo import PhotoAgent

from conftest import SAFE_LISTING, SCAM_ABROAD, SCAM_TOKEN, CONFLICT_LISTING


def _verdicts(state: CaseState) -> dict[str, str]:
    return {f.agent: f.verdict for f in state.findings}


@pytest.mark.asyncio
async def test_safe_listing_standard_flow():
    state = await run_investigation(SAFE_LISTING)

    assert state.directives.get("photo") == "standard_scan"
    assert state.directives.get("web") == "standard_lookup"
    assert state.directives.get("commute") == "standard_route"
    assert len(state.findings) == 5
    assert "escalating" not in " ".join(state.trace).lower()
    assert _verdicts(state)["price"] == "CLEAN"
    assert _verdicts(state)["text"] == "CLEAN"
    assert any("planner:" in t.lower() for t in state.trace)
    assert any("reflection:" in t.lower() for t in state.trace)


@pytest.mark.asyncio
async def test_scam_escalation_after_price_and_text():
    """Planner escalates bait price + scam text → deep photo scan + phone web-recon."""
    state = await run_investigation(SCAM_ABROAD)

    assert state.directives["photo"] == "deep_scan"
    assert state.directives["web"] == "check_phone_and_dupes"
    assert any("escalating" in t.lower() for t in state.trace)

    verdicts = _verdicts(state)
    assert verdicts["price"] == "BAIT"
    assert verdicts["text"] == "SUSPICIOUS"


@pytest.mark.asyncio
async def test_scam_photo_to_commute_handoff():
    """Planner routes commute after suspicious photo with address verification."""
    state = await run_investigation(SCAM_ABROAD)

    assert "verify address" in state.directives.get("commute", "")
    assert any(
        "commute" in t.lower() and ("address" in t.lower() or "photo" in t.lower())
        for t in state.trace
    )
    assert _verdicts(state)["photo"] == "SUSPICIOUS"
    assert _verdicts(state)["commute"] in ("LIE", "SUSPICIOUS")


@pytest.mark.asyncio
async def test_scam_full_pipeline_all_agents_flag():
    """Complex scam: all 5 agents should surface red flags."""
    state = await run_investigation(SCAM_ABROAD)
    verdicts = _verdicts(state)

    assert len(state.findings) == 5
    assert verdicts["price"] == "BAIT"
    assert verdicts["text"] == "SUSPICIOUS"
    assert verdicts["photo"] == "SUSPICIOUS"
    assert verdicts["web"] == "SUSPICIOUS"
    assert verdicts["commute"] in ("LIE", "SUSPICIOUS")
    assert len(state.trace) >= 5


@pytest.mark.asyncio
async def test_token_scam_pipeline():
    state = await run_investigation(SCAM_TOKEN)
    verdicts = _verdicts(state)

    assert verdicts["price"] == "BAIT"
    assert verdicts["text"] == "SUSPICIOUS"
    assert verdicts["photo"] == "SUSPICIOUS"
    assert verdicts["web"] == "SUSPICIOUS"


@pytest.mark.asyncio
async def test_reflection_redispatch_on_conflict():
    """Reflection re-dispatches Photo when clean photo conflicts with price/text/web flags."""
    state = await run_investigation(CONFLICT_LISTING)

    assert any("reflection" in t.lower() and "conflict" in t.lower() for t in state.trace)
    assert state.directives.get("photo") == "dedup_lowthreshold"
    assert _verdicts(state)["photo"] == "SUSPICIOUS"
    assert _verdicts(state)["price"] == "BAIT"


@pytest.mark.asyncio
async def test_reflection_dedup_lowthreshold_directive():
    """Photo agent flips to SUSPICIOUS under reflection dedup directive."""
    state = CaseState(listing=CONFLICT_LISTING, directives={"photo": "dedup_lowthreshold"})
    result = await PhotoAgent().run(state)
    state2 = CaseState(listing=SCAM_ABROAD, directives={"photo": "dedup_lowthreshold"})
    result2 = await PhotoAgent().run(state2)
    assert result2.verdict == "SUSPICIOUS"


@pytest.mark.asyncio
async def test_trace_records_planner_and_reflection():
    state = await run_investigation(SCAM_ABROAD)
    trace_text = " ".join(state.trace).lower()

    assert "planner:" in trace_text
    assert "photo" in trace_text
    assert "reflection:" in trace_text
    assert "commute" in trace_text


@pytest.mark.asyncio
async def test_findings_shared_via_case_state():
    """Agents communicate through shared CaseState findings list."""
    state = await run_investigation(SCAM_ABROAD)
    agents_seen = {f.agent for f in state.findings}

    assert agents_seen == {"price", "text", "photo", "web", "commute"}
    assert all(f.confidence > 0 for f in state.findings)
    assert all(f.detail for f in state.findings)
    assert all(isinstance(f.recommend_next, list) for f in state.findings)


@pytest.mark.asyncio
async def test_agents_emit_structured_recommendations():
    state = await run_investigation(SCAM_ABROAD)
    price = next(f for f in state.findings if f.agent == "price")
    assert price.recommend_next
    assert price.structured_evidence.get("agent_output", {}).get("recommend_next")
