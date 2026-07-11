from __future__ import annotations
import agents._path  # noqa: F401

from agents.base import BaseAgent
from agents.confidence import commute_confidence
from agents.evidence import CommuteEvidence, structured_to_dict
from schema import AgentResult, CaseState
from tools.maps import GoogleMapsWrapper

DEFAULT_OFFICE = "Embassy GolfLinks, Bangalore"


def _parse_distance_km(distance: str) -> float:
    try:
        return float(str(distance).replace(" km", "").strip())
    except ValueError:
        return 0.0


class CommuteAgent(BaseAgent):
    """Validates claimed commute times via Google Maps (Gemini-grounded)."""

    name = "commute"
    weight = 0.15

    def __init__(self) -> None:
        self._maps = GoogleMapsWrapper()

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        claimed = listing.claimed_commute_min or 5
        office = state.directives.get("office", DEFAULT_OFFICE)
        if not office.endswith("Bangalore"):
            office = f"{office}, Bangalore"

        maps_result = await self._maps.get_commute_time(listing.address, office)
        real_metro = int(maps_result["metro_duration_minutes"])
        real_office = int(maps_result["drive_duration_minutes"])
        distance_str = maps_result.get("distance", "0 km")
        live = bool(maps_result.get("is_grounded_live", False))
        discrepancy = real_metro - claimed

        structured = CommuteEvidence(
            distance_km=_parse_distance_km(distance_str),
            drive_minutes=real_office,
            metro_minutes=real_metro,
            target_office=office,
            claimed_minutes=claimed,
            discrepancy_minutes=discrepancy,
            is_live_maps=live,
            origin_lat=maps_result.get("origin_lat"),
            origin_lng=maps_result.get("origin_lng"),
            destination_lat=maps_result.get("destination_lat"),
            destination_lng=maps_result.get("destination_lng"),
            origin_label=maps_result.get("origin_label", listing.address[:40]),
        )
        evidence = [
            f"Claimed commute: {claimed} min",
            f"Real metro commute (9 AM): {real_metro} min",
            f"Real office commute to {office} (9 AM): {real_office} min",
            f"Distance: {distance_str}",
        ]
        if live:
            evidence.append("Source: Gemini Google Maps grounding (live)")

        directive = state.directives.get("commute", "")

        if directive and "verify address" in directive.lower() and discrepancy >= 5:
            verdict = "LIE"
            return AgentResult(
                agent=self.name,
                verdict=verdict,
                detail=(
                    f"Address/commute mismatch under photo conflict. Claimed {claimed} min to metro; "
                    f"peak drive is {real_metro} min. Office commute: {real_office} min."
                ),
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=commute_confidence(discrepancy, live, verdict),
                weight=self.weight,
            )

        if discrepancy >= 10:
            verdict = "LIE"
            detail = (
                f"Claimed '{claimed} min to metro' is inaccurate. Peak 9 AM drive to metro is "
                f"{real_metro} mins. Real drive to office is {real_office} mins."
            )
        elif discrepancy >= 5:
            verdict = "SUSPICIOUS"
            detail = (
                f"Commute claims are slightly exaggerated. Metro is {real_metro} min; "
                f"office commute is {real_office} min."
            )
        else:
            verdict = "CLEAN"
            detail = (
                f"Commute times are accurate. Metro is {real_metro} min away. "
                f"Commute to office is {real_office} min."
            )

        return AgentResult(
            agent=self.name,
            verdict=verdict,
            detail=detail,
            evidence=evidence,
            structured_evidence=structured_to_dict(structured),
            confidence=commute_confidence(discrepancy, live, verdict),
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await CommuteAgent().run(state)


run_commute_agent = run
