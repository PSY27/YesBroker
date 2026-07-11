import agents._path  # noqa: F401

from agents.base import BaseAgent
from agents.confidence import web_confidence
from agents.evidence import WebEvidence, structured_to_dict
from schema import AgentResult, CaseState
from tools.google_search import GoogleSearchWrapper

SCAM_SNIPPET_KEYWORDS = (
    "scam", "fraud", "blacklist", "complaint", "cheat", "beware", "warning",
    "cyber crime", "cybercrime",
)
NEGATIVE_PHRASES = ("no scam", "no immediate scam", "no complaints", "appears clean", "normal business")
GOV_DOMAINS = ("police", "gov.in", "cybercrime", "consumerforum")


class WebAgent(BaseAgent):
    """Web-recon via Gemini Google Search grounding."""

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

    def _has_gov_source(self, results: list[dict]) -> bool:
        return any(
            any(g in (r.get("url", "") + r.get("title", "")).lower() for g in GOV_DOMAINS)
            for r in results
        )

    async def _search_phone(self, phone: str) -> tuple[list[dict], list[dict]]:
        if not phone:
            return [], []
        results = await self._search.search_query(phone)
        return results, [r for r in results if self._is_scam_hit(r)]

    async def _search_address(self, address: str) -> tuple[list[dict], list[dict]]:
        if not address:
            return [], []
        results = await self._search.search_query(f'"{address}" rental scam')
        return results, [r for r in results if self._is_scam_hit(r)]

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        phone = listing.phone or ""
        address = listing.address or ""
        directive = state.directives.get("web", "standard_lookup")

        phone_results, phone_scam_hits = await self._search_phone(phone)
        address_results, address_scam_hits = (
            await self._search_address(address) if directive == "check_phone_and_dupes" else ([], [])
        )

        all_scam_hits = phone_scam_hits + address_scam_hits
        all_results = phone_results + address_results
        sources = [
            {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("snippet", "")[:120]}
            for r in all_results[:5]
        ]

        structured = WebEvidence(
            phone=phone,
            scam_hits=len(all_scam_hits),
            total_results=len(all_results),
            sources=sources,
            address_scanned=directive == "check_phone_and_dupes",
        )

        evidence = [f"{s['title']}: {s['url']}" for s in sources]
        has_gov = self._has_gov_source(all_scam_hits)
        confidence = web_confidence(len(all_scam_hits), len(all_results), has_gov)

        source = (listing.source_url or "").lower()
        low_trust_portal = any(d in source for d in ("craigslist", "olx", "facebook", "quikr"))

        if all_scam_hits:
            top = all_scam_hits[0]
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=top.get("snippet", f"Phone {phone} flagged in web complaint databases."),
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=confidence,
                weight=self.weight,
            )

        if low_trust_portal:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail="Listing source is a low-trust portal with limited broker verification.",
                evidence=evidence + [f"Source URL: {listing.source_url}"],
                structured_evidence=structured_to_dict(structured),
                confidence=min(confidence, 0.72),
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail="Broker phone and address show no scam complaints in web search.",
            evidence=evidence or ["Web search: 0 scam complaints found"],
            structured_evidence=structured_to_dict(structured),
            confidence=confidence,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await WebAgent().run(state)


run_web_agent = run
