import json
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schema import Listing
from orchestrator import run_investigation
from scoring import build_trust_report, search_summary_from_report


async def investigate_listing(listing: Listing) -> dict:
    """Run orchestrator and attach trust score + search summary fields."""
    state = await run_investigation(listing)
    report = build_trust_report(state)
    dump = report.model_dump()
    dump.update(search_summary_from_report(report))
    return dump


async def main():
    print("Pre-computation pipeline started...")

    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    listings_path = os.path.join(data_dir, "listings.json")
    scores_path = os.path.join(data_dir, "scores.json")

    with open(listings_path, "r") as f:
        listings_data = json.load(f)

    listings = [Listing(**l) for l in listings_data]

    precomputed_scores = {}

    for l in listings:
        print(f"Investigating: {l.id} - {l.title}...")
        precomputed_scores[l.id] = await investigate_listing(l)

    with open(scores_path, "w") as f:
        json.dump(precomputed_scores, f, indent=2)

    print(f"Success! Pre-computed trust reports saved to: {scores_path}")


if __name__ == "__main__":
    asyncio.run(main())
