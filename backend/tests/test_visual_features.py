"""Tests for visual feature upgrades: photo matches, commute coords, share snapshots."""

from __future__ import annotations

import pytest

from schema import CaseState, Listing
from agents.photo import PhotoAgent
from agents.commute import CommuteAgent
from media import resolve_listing_photo_url, media_file_path
from share_store import create_share, get_share, new_token, SharedListingSnapshot, SharedReportSnapshot
from scoring import build_trust_report

from conftest import SCAM_ABROAD


@pytest.mark.asyncio
async def test_photo_evidence_has_matches_and_source():
    state = CaseState(listing=SCAM_ABROAD, directives={"photo": "deep_scan"})
    result = await PhotoAgent().run(state)
    s = result.structured_evidence
    assert s is not None
    assert s["source_photo"]
    assert len(s["matches"]) >= 1
    match = s["matches"][0]
    assert "source_url" in match
    assert "match_url" in match
    assert "portal" in match


@pytest.mark.asyncio
async def test_commute_evidence_has_coordinates():
    result = await CommuteAgent().run(CaseState(listing=SCAM_ABROAD))
    s = result.structured_evidence
    assert s is not None
    assert s["origin_lat"] is not None
    assert s["origin_lng"] is not None
    assert s["destination_lat"] is not None
    assert s["destination_lng"] is not None
    assert s["origin_label"]


def test_resolve_listing_photo_url_demo():
    url = resolve_listing_photo_url("photo_abroad_1.jpg")
    assert url.startswith("/media/")
    assert "photo_abroad_1" in url


def test_media_file_path_serves_demo_photo():
    url = resolve_listing_photo_url("photo_abroad_1.jpg")
    rel = url.replace("/media/", "")
    path = media_file_path(rel)
    assert path is not None
    assert path.endswith("photo_abroad_1.jpg")


def test_share_create_and_fetch():
    listing = Listing(**SCAM_ABROAD.model_dump())
    state = CaseState(listing=listing)
    report = build_trust_report(state)
    report.flags = []

    token = new_token()
    snapshot = SharedReportSnapshot(
        token=token,
        listing=SharedListingSnapshot(
            id=listing.id,
            title=listing.title,
            rent=listing.rent,
            bhk=listing.bhk,
            address=listing.address,
        ),
        report=report,
    )
    create_share(snapshot)
    loaded = get_share(token)
    assert loaded is not None
    assert loaded.token == token
    assert loaded.listing.id == "SCAM_001"


@pytest.mark.asyncio
async def test_scam_001_photo_and_commute_evidence():
    """End-to-end evidence shape for hackathon demo listing SCAM_001."""
    photo = await PhotoAgent().run(
        CaseState(listing=SCAM_ABROAD, directives={"photo": "deep_scan"})
    )
    commute = await CommuteAgent().run(CaseState(listing=SCAM_ABROAD))

    assert photo.structured_evidence["is_stolen"] is True
    assert photo.structured_evidence["matches"]
    assert commute.structured_evidence["discrepancy_minutes"] >= 5
    assert commute.structured_evidence["origin_lat"]
