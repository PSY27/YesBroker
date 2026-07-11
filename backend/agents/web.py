import agents._path  # noqa: F401

from agents.base import BaseAgent
from schema import AgentResult, CaseState
from tools.google_search import GoogleSearchWrapper

SCAM_SNIPPET_KEYWORDS = (
    "scam",
    "fraud",
    "blacklist",
    "complaint",
    "cheat",
    "beware",
    "warning",
    "cyber crime",
    "cybercrime",
)

NEGATIVE_PHRASES = (
    "no scam",
    "no immediate scam",
    "no complaints",
    "appears clean",
    "normal business",
)


class WebAgent(BaseAgent):
    """Web-recon via Member 3 Google Search tool for phone/address reputation."""

    name = "web"
    weight = 0.25

    def __init__(self) -> None:
        self._search = GoogleSearchWrapper()

    def _is_scam_hit(self, result: dict) -> bool:
        text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
        if any(neg in text for neg in NEGATIVE_PHRASES):
            return False
        if "scandirectory.com" in result.get("url", ""):
            return False
        return any(kw in text for kw in SCAM_SNIPPET_KEYWORDS) or "token" in text

    async def _search_phone(self, phone: str) -> tuple[list[dict], bool]:
        if not phone:
            return [], False
        results = await self._search.search_query(phone)
        scam_hits = [r for r in results if self._is_scam_hit(r)]
        return results, len(scam_hits) > 0

    async def _search_address(self, address: str) -> tuple[list[dict], bool]:
        if not address:
            return [], False
        results = await self._search.search_query(f'"{address}" rental scam')
        scam_hits = [r for r in results if self._is_scam_hit(r)]
        return results, len(scam_hits) > 0

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        phone = listing.phone or ""
        address = listing.address or ""
        directive = state.directives.get("web", "standard_lookup")

        phone_results, phone_scam = await self._search_phone(phone)
        address_results, address_scam = await self._search_address(address) if directive == "check_phone_and_dupes" else ([], False)

        evidence: list[str] = []
        for r in phone_results[:3]:
            evidence.append(f"{r.get('title', 'Result')}: {r.get('url', '')}")
        for r in address_results[:2]:
            evidence.append(f"Address hit: {r.get('title', 'Result')}")

        source = (listing.source_url or "").lower()
        low_trust_portal = any(d in source for d in ("craigslist", "olx", "facebook", "quikr"))

        if phone_scam or address_scam:
            top = next((r for r in phone_results if self._is_scam_hit(r)), phone_results[0] if phone_results else {})
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=top.get("snippet", f"Phone number {phone} flagged in web complaint databases."),
                evidence=evidence,
                confidence=0.95 if phone_scam else 0.85,
                weight=self.weight,
            )

        if low_trust_portal:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail="Listing source is a low-trust portal with limited broker verification.",
                evidence=evidence + [f"Source URL: {listing.source_url}"],
                confidence=0.72,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail="Broker phone and address show no scam complaints in web search.",
            evidence=evidence or ["Web search: 0 scam complaints found"],
            confidence=0.90,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await WebAgent().run(state)


run_web_agent = run
