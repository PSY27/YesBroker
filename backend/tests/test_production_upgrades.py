"""Tests for production upgrades: structured evidence, dynamic confidence, parallel stages."""

from __future__ import annotations

import pytest

from schema import CaseState
from agents.price import PriceAgent
from agents.text import TextAgent
from agents.web import WebAgent
from agents.commute import CommuteAgent
from agents.photo import PhotoAgent
from orchestrator import run_investigation

from conftest import SAFE_LISTING, SCAM_ABROAD


@pytest.mark.asyncio
async def test_structured_evidence_on_price():
    result = await PriceAgent().run(CaseState(listing=SCAM_ABROAD))
    assert result.structured_evidence is not None
    assert "area_median" in result.structured_evidence
    assert "deviation_pct" in result.structured_evidence
    assert result.structured_evidence["listing_rent"] == 18000


@pytest.mark.asyncio
async def test_structured_evidence_on_commute():
    result = await CommuteAgent().run(CaseState(listing=SCAM_ABROAD))
    s = result.structured_evidence
    assert s is not None
    assert "drive_minutes" in s
    assert "metro_minutes" in s
    assert "target_office" in s


@pytest.mark.asyncio
async def test_structured_evidence_on_photo_scam():
    state = CaseState(listing=SCAM_ABROAD, directives={"photo": "deep_scan"})
    result = await PhotoAgent().run(state)
    s = result.structured_evidence
    assert s is not None
    assert s["is_stolen"] is True
    assert s["matches_count"] >= 1


@pytest.mark.asyncio
async def test_web_dynamic_confidence_more_hits_higher():
    state = CaseState(listing=SCAM_ABROAD, directives={"web": "check_phone_and_dupes"})
    result = await WebAgent().run(state)
    assert result.structured_evidence["scam_hits"] >= 1
    assert result.confidence >= 0.6


@pytest.mark.asyncio
async def test_text_negation_not_flagged_offline():
    """Offline regex uses negation-aware patterns."""
    from schema import Listing

    clean = Listing(
        id="NEG_TEST",
        title="2BHK",
        rent=33000,
        bhk="2",
        address="Indiranagar",
        description="Owner is NOT going abroad. Do NOT pay any advance token. Calls only, no WhatsApp.",
        phone="+91 90000 00001",
    )
    result = await TextAgent().run(CaseState(listing=clean))
    assert result.verdict == "CLEAN"


@pytest.mark.asyncio
async def test_parallel_batch_execution():
    """Planner runs independent agents concurrently when selected together."""
    state = await run_investigation(SCAM_ABROAD)
    agents = {f.agent for f in state.findings}
    assert agents == {"price", "text", "photo", "web", "commute"}
    assert any("parallel" in t.lower() for t in state.trace)


@pytest.mark.asyncio
async def test_safe_listing_has_structured_evidence():
    state = await run_investigation(SAFE_LISTING)
    for finding in state.findings:
        assert finding.structured_evidence is not None, f"{finding.agent} missing structured_evidence"
