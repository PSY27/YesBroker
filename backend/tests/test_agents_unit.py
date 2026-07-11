"""Unit tests for individual specialist agents."""

from __future__ import annotations

import pytest

from schema import CaseState
from agents import AGENTS
from agents.price import PriceAgent
from agents.text import TextAgent
from agents.photo import PhotoAgent
from agents.web import WebAgent
from agents.commute import CommuteAgent

from conftest import SAFE_LISTING, SCAM_ABROAD, SCAM_TOKEN


@pytest.mark.parametrize("name,agent_cls", [
    ("price", PriceAgent),
    ("text", TextAgent),
    ("photo", PhotoAgent),
    ("commute", CommuteAgent),
    ("web", WebAgent),
])
def test_agent_registry(name, agent_cls):
    assert name in AGENTS
    assert isinstance(AGENTS[name], agent_cls)


@pytest.mark.asyncio
async def test_price_clean_listing():
    result = await PriceAgent().run(CaseState(listing=SAFE_LISTING))
    assert result.agent == "price"
    assert result.verdict == "CLEAN"


@pytest.mark.asyncio
async def test_price_bait_on_scam():
    result = await PriceAgent().run(CaseState(listing=SCAM_ABROAD))
    assert result.verdict == "BAIT"
    assert "below" in result.detail.lower() or "deposit" in result.detail.lower()


@pytest.mark.asyncio
async def test_text_flags_scam_language():
    result = await TextAgent().run(CaseState(listing=SCAM_ABROAD))
    assert result.verdict == "SUSPICIOUS"
    assert len(result.evidence) >= 1


@pytest.mark.asyncio
async def test_photo_detects_stolen_image():
    state = CaseState(listing=SCAM_ABROAD, directives={"photo": "deep_scan"})
    result = await PhotoAgent().run(state)
    assert result.verdict == "SUSPICIOUS"
    assert any("duplicate" in e.lower() or "watermark" in e.lower() for e in result.evidence)


@pytest.mark.asyncio
async def test_web_flags_blacklisted_phone():
    state = CaseState(listing=SCAM_ABROAD, directives={"web": "check_phone_and_dupes"})
    result = await WebAgent().run(state)
    assert result.verdict == "SUSPICIOUS"


@pytest.mark.asyncio
async def test_commute_detects_lie():
    state = CaseState(listing=SCAM_ABROAD, directives={"commute": "verify address vs duplicate"})
    result = await CommuteAgent().run(state)
    assert result.verdict in ("LIE", "SUSPICIOUS")


@pytest.mark.asyncio
async def test_photo_respects_deep_scan_directive():
    """Deep scan should inspect all photos, not just the first."""
    state = CaseState(listing=SCAM_TOKEN, directives={"photo": "deep_scan"})
    result = await PhotoAgent().run(state)
    assert result.verdict == "SUSPICIOUS"
