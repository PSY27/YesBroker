#!/usr/bin/env python3
"""CLI demo: run a live traced investigation and print agent conversation logs."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from schema import Listing
from orchestrator import run_investigation
from scoring import build_trust_report
from trace import TracedInvestigation
from tools.gemini_client import is_configured, get_model


def load_listing(listing_id: str) -> Listing | None:
    path = os.path.join(os.path.dirname(__file__), "data", "listings.json")
    with open(path) as f:
        for row in json.load(f):
            if row["id"] == listing_id:
                return Listing(**row)
    return None


async def main() -> None:
    parser = argparse.ArgumentParser(description="YesBroker live agent trace demo")
    parser.add_argument("listing_id", nargs="?", default="SCAM_001", help="Listing ID to investigate")
    args = parser.parse_args()

    listing = load_listing(args.listing_id)
    if not listing:
        print(f"Listing {args.listing_id} not found.")
        sys.exit(1)

    print("=" * 70)
    print(f"  YesBroker Agent Trace — {listing.id}")
    print(f"  Gemini: {'LIVE (' + get_model() + ')' if is_configured() else 'OFFLINE (no API key)'}")
    print("=" * 70)

    async with TracedInvestigation(echo=True) as tracer:
        state = await run_investigation(listing)
        report = build_trust_report(state)

    print("=" * 70)
    print(f"  SCORE: {report.score}/100  VERDICT: {report.verdict}")
    print("=" * 70)
    for f in report.flags:
        print(f"  • {f.agent:8} {f.verdict:12} {f.detail[:70]}")
    print(f"\n  Trace events: {len(tracer.events)}")


if __name__ == "__main__":
    asyncio.run(main())
