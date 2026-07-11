"""Shared fixtures and mock listings for agent/orchestration tests."""

from __future__ import annotations

import os
import sys

import pytest

# backend/ on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schema import Listing  # noqa: E402


@pytest.fixture(autouse=True)
def offline_gemini(monkeypatch):
    """Force offline demo corpus so tests are deterministic without API keys."""
    monkeypatch.setattr("tools.gemini_client.is_configured", lambda: False)
    monkeypatch.setattr("tools.gemini_client.get_api_key", lambda: None)


SAFE_LISTING = Listing(
    id="TEST_SAFE",
    title="2BHK · 100 Ft Road",
    rent=34000,
    deposit=150000,
    bhk="2",
    area_sqft=1100,
    address="100 Ft Road, Near Toit, Indiranagar, Bangalore",
    pincode="560038",
    landmark="Near Toit Brewpub",
    claimed_commute_min=15,
    description="Premium 2BHK flat. Semi-furnished, gated community, families welcome.",
    phone="+91 98860 12345",
    photo_urls=["photo_item_TEST_SAFE_1.jpg", "photo_item_TEST_SAFE_2.jpg"],
    source_url="https://nobroker.in/blr/indiranagar/safe",
)

SCAM_ABROAD = Listing(
    id="SCAM_001",
    title='2BHK · "Owner going abroad"',
    rent=18000,
    deposit=30000,
    bhk="2",
    area_sqft=1200,
    address="HAL 3rd Stage, Near Metro, Indiranagar, Bangalore",
    pincode="560038",
    landmark="Indiranagar Club",
    claimed_commute_min=5,
    description=(
        "Luxurious 2 BHK apartment. Owner going abroad, hence renting out very cheap. "
        "Please pay a minor refundable token to reserve and hold the flat. "
        "WhatsApp me directly at the number to visit. No calls."
    ),
    phone="+91 93003 40056",
    photo_urls=["photo_abroad_1.jpg", "photo_abroad_2.jpg"],
    source_url="https://facebook.com/marketplace/blr/flat_abroad",
)

SCAM_TOKEN = Listing(
    id="SCAM_002",
    title='2BHK · "Urgent, token to hold"',
    rent=16000,
    deposit=25000,
    bhk="2",
    area_sqft=1000,
    address="Defence Colony, Indiranagar, Bangalore",
    pincode="560038",
    claimed_commute_min=4,
    description=(
        "Urgent listing! Beautiful 2BHK flat. Need to pay token amount of ₹5,000 to hold "
        "this flat today as there is a huge queue. Very urgent."
    ),
    phone="+91 94004 50067",
    photo_urls=["photo_token_1.jpg", "photo_token_2.jpg"],
    source_url="https://quikr.com/blr/defence/token",
)

# Triggers arbiter: photo CLEAN (generic filename) but price/text suspicious
CONFLICT_LISTING = Listing(
    id="TEST_CONFLICT",
    title="2BHK · Prime bait",
    rent=15000,
    deposit=20000,
    bhk="2",
    address="Double Road, Indiranagar, Bangalore",
    pincode="560038",
    claimed_commute_min=5,
    description="Owner going abroad. Pay token to hold. WhatsApp me directly. Urgent listing.",
    phone="+91 91001 20034",
    photo_urls=["photo_misc_1.jpg", "photo_token_hidden.jpg"],
    source_url="https://craigslist.com/blr/scam",
)
