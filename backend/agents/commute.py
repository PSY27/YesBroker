import agents._path  # noqa: F401

from agents.base import BaseAgent
from schema import AgentResult, CaseState
from tools.maps import GoogleMapsWrapper

DEFAULT_OFFICE = "Embassy GolfLinks, Bangalore"


class CommuteAgent(BaseAgent):
    """Validates claimed commute times via Member 3 Google Maps tool."""

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
        distance = maps_result.get("distance", "unknown")
        live = maps_result.get("is_grounded_live", False)

        discrepancy = real_metro - claimed
        evidence = [
            f"Claimed commute: {claimed} min",
            f"Real metro commute (9 AM): {real_metro} min",
            f"Real office commute to {office} (9 AM): {real_office} min",
            f"Distance: {distance}",
        ]
        if live:
            evidence.append("Source: Google Distance Matrix API (live)")

        directive = state.directives.get("commute", "")
        if directive and "verify address" in directive.lower() and discrepancy >= 5:
            return AgentResult(
                agent=self.name,
                verdict="LIE",
                detail=(
                    f"Address/commute mismatch under photo conflict. Claimed {claimed} min to metro; "
                    f"peak drive is {real_metro} min. Office commute: {real_office} min."
                ),
                evidence=evidence,
                confidence=0.92,
                weight=self.weight,
            )

        if discrepancy >= 10:
            return AgentResult(
                agent=self.name,
                verdict="LIE",
                detail=(
                    f"Claimed '{claimed} min to metro' is inaccurate. Peak 9 AM drive to metro is "
                    f"{real_metro} mins. Real drive to office is {real_office} mins."
                ),
                evidence=evidence,
                confidence=0.90,
                weight=self.weight,
            )

        if discrepancy >= 5:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=(
                    f"Commute claims are slightly exaggerated. Metro is {real_metro} min; "
                    f"office commute is {real_office} min."
                ),
                evidence=evidence,
                confidence=0.75,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail=(
                f"Commute times are accurate. Metro is {real_metro} min away. "
                f"Commute to office is {real_office} min."
            ),
            evidence=evidence,
            confidence=0.95,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await CommuteAgent().run(state)


run_commute_agent = run
