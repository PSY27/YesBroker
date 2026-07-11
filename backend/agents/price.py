from __future__ import annotations
import agents._path  # noqa: F401

import json
import os

from agents.base import BaseAgent
from agents.confidence import price_confidence
from agents.evidence import PriceEvidence, structured_to_dict
from schema import AgentResult, CaseState

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MEDIANS_PATH = os.path.join(DATA_DIR, "medians.json")

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
        if median is None or isinstance(median, str):
            median = area_medians.get("2", 35000)

        rent = listing.rent
        deviation = (median - rent) / median if median else 0.0
        deviation_pct = round(deviation * 100, 1)
        deposit_months = (listing.deposit / rent) if listing.deposit and rent > 0 else None

        structured = PriceEvidence(
            area_median=int(median),
            listing_rent=rent,
            deviation_pct=deviation_pct,
            pincode=pincode,
            bhk=bhk,
            deposit_months=round(deposit_months, 2) if deposit_months else None,
        )
        evidence = [
            f"Area median ({pincode}, {bhk}BHK): ₹{median:,}",
            f"Listing rent: ₹{rent:,}",
            f"Deviation: {deviation_pct}% below median",
        ]
        if deposit_months is not None:
            evidence.append(f"Deposit: ₹{listing.deposit:,} ({deposit_months:.1f}× monthly rent)")

        deposit_flag = None
        if deposit_months is not None:
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
            verdict = "BAIT"
            return AgentResult(
                agent=self.name,
                verdict=verdict,
                detail=". ".join(parts) + ".",
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=price_confidence(deviation, deposit_months, verdict),
                weight=self.weight,
            )

        if deviation >= 0.20 or deposit_flag == "SUSPICIOUS":
            pct = int(deviation * 100)
            detail_parts = []
            if deviation >= 0.20:
                detail_parts.append(f"Rent ₹{rent:,} is {pct}% below the ₹{median:,} area median")
            if deposit_flag == "SUSPICIOUS":
                detail_parts.append("deposit-to-rent ratio is lower than typical for this market")
            verdict = "SUSPICIOUS"
            return AgentResult(
                agent=self.name,
                verdict=verdict,
                detail=". ".join(detail_parts) + ".",
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=price_confidence(deviation, deposit_months, verdict),
                weight=self.weight,
            )

        verdict = "CLEAN"
        return AgentResult(
            agent=self.name,
            verdict=verdict,
            detail=f"Rent ₹{rent:,} is in line with the ₹{median:,} area median.",
            evidence=evidence,
            structured_evidence=structured_to_dict(structured),
            confidence=price_confidence(deviation, deposit_months, verdict),
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await PriceAgent().run(state)


run_price_agent = run
