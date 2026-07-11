import agents._path  # noqa: F401

import json
import os

from agents.base import BaseAgent
from schema import AgentResult, CaseState

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MEDIANS_PATH = os.path.join(DATA_DIR, "medians.json")

# Deposit months below this threshold is suspicious for Bangalore rentals
SUSPICIOUS_DEPOSIT_MONTHS = 2.0
BAIT_DEPOSIT_MONTHS = 1.5


def _load_medians() -> dict[str, dict[str, int]]:
    if not os.path.exists(MEDIANS_PATH):
        return {}
    with open(MEDIANS_PATH, "r") as f:
        return json.load(f)


class PriceAgent(BaseAgent):
    """Detects bait pricing and suspicious deposit-to-rent ratios."""

    name = "price"
    weight = 0.15

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        medians = _load_medians()
        pincode = listing.pincode or "560038"
        bhk = listing.bhk

        area_medians = medians.get(pincode, medians.get("560038", {"2": 35000}))
        median = area_medians.get(bhk)
        if median is None:
            median = area_medians.get("2", 35000)
        if isinstance(median, str):
            median = area_medians.get("2", 35000)

        rent = listing.rent
        deviation = (median - rent) / median if median else 0.0

        evidence = [
            f"Area median ({pincode}, {bhk}BHK): ₹{median:,}",
            f"Listing rent: ₹{rent:,}",
        ]

        deposit_flag = None
        if listing.deposit and rent > 0:
            deposit_months = listing.deposit / rent
            evidence.append(f"Deposit: ₹{listing.deposit:,} ({deposit_months:.1f}× monthly rent)")
            if deposit_months < BAIT_DEPOSIT_MONTHS:
                deposit_flag = "BAIT"
            elif deposit_months < SUSPICIOUS_DEPOSIT_MONTHS:
                deposit_flag = "SUSPICIOUS"

        if deviation >= 0.40 or deposit_flag == "BAIT":
            pct = int(deviation * 100)
            parts = []
            if deviation >= 0.40:
                parts.append(f"Rent ₹{rent:,} is {pct}% BELOW the ₹{median:,} area median for a {bhk} BHK")
            if deposit_flag == "BAIT":
                parts.append("deposit is unusually low vs rent (common token-scam pattern)")
            return AgentResult(
                agent=self.name,
                verdict="BAIT",
                detail=". ".join(parts) + ".",
                evidence=evidence,
                confidence=0.95,
                weight=self.weight,
            )

        if deviation >= 0.20 or deposit_flag == "SUSPICIOUS":
            pct = int(deviation * 100)
            detail_parts = []
            if deviation >= 0.20:
                detail_parts.append(f"Rent ₹{rent:,} is {pct}% below the ₹{median:,} area median")
            if deposit_flag == "SUSPICIOUS":
                detail_parts.append("deposit-to-rent ratio is lower than typical for this market")
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=". ".join(detail_parts) + ".",
                evidence=evidence,
                confidence=0.80,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail=f"Rent ₹{rent:,} is in line with the ₹{median:,} area median.",
            evidence=evidence,
            confidence=0.90,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await PriceAgent().run(state)

# Backward-compatible alias for precompute / planner imports
run_price_agent = run
