from __future__ import annotations
import agents._path  # noqa: F401

import re

from agents.base import BaseAgent
from agents.confidence import text_confidence
from agents.evidence import TextEvidence, structured_to_dict
from schema import AgentResult, CaseState
from tools.gemini_client import generate_json, is_configured

# Offline-only fallback (no API key)
_SCAM_PATTERNS = [
    (r"(?<!not )(?<!no )owner (?:is )?going abroad", "owner abroad"),
    (r"(?<!not )(?<!no )pay token", "token to hold"),
    (r"(?<!not )(?<!no )whatsapp me", "whatsapp direct"),
    (r"urgent listing", "coercive urgency"),
]


async def _gemini_semantic_scan(description: str) -> dict | None:
    if not is_configured():
        return None

    prompt = (
        "You are a rental fraud analyst for Bangalore listings.\n"
        "Classify the description's INTENT — do NOT flag negated statements.\n"
        "Examples that are CLEAN: 'I am NOT living abroad', 'Do NOT send advance token', "
        "'No WhatsApp — calls only'.\n"
        "Flag only genuine scam pressure: absentee owner, token/advance before visit, "
        "off-platform payment, coercive urgency.\n"
        "Check English, Kannada, Hindi, and mixed-language text.\n"
        'Return JSON: {"flags": ["label"], "quotes": ["exact suspicious phrase"], '
        '"confidence": 0.0-1.0, "verdict": "CLEAN" | "SUSPICIOUS"}\n\n'
        f"Description:\n{description}"
    )
    return await generate_json(prompt, caller="text_agent")


def _regex_fallback(text: str) -> tuple[list[str], list[str]]:
    flagged: list[str] = []
    quotes: list[str] = []
    for pattern, label in _SCAM_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            flagged.append(label)
            quotes.append(match.group(0))
    return flagged, quotes


class TextAgent(BaseAgent):
    """Semantic scam-language analysis via Gemini; regex only when offline."""

    name = "text"
    weight = 0.10

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        desc = (listing.description or "").strip()
        if not desc:
            structured = TextEvidence(flags=[], quotes=[], analyzer="none")
            return AgentResult(
                agent=self.name,
                verdict="CLEAN",
                detail="No description provided; no linguistic red flags detected.",
                evidence=["Empty description"],
                structured_evidence=structured_to_dict(structured),
                confidence=0.60,
                weight=self.weight,
            )

        data = await _gemini_semantic_scan(desc)
        used_gemini = data is not None

        if data:
            flags = [str(f) for f in data.get("flags", [])]
            quotes = [str(q) for q in data.get("quotes", data.get("evidence", []))]
            gemini_conf = float(data.get("confidence", 0.85))
            verdict = data.get("verdict", "SUSPICIOUS" if flags else "CLEAN")
            analyzer = "gemini-semantic"
        else:
            flags, quotes = _regex_fallback(desc)
            gemini_conf = None
            verdict = "SUSPICIOUS" if flags else "CLEAN"
            analyzer = "regex-offline-fallback"

        structured = TextEvidence(
            flags=flags,
            quotes=quotes,
            analyzer=analyzer,
            negation_handled=used_gemini,
        )
        evidence = quotes or [f"Flag: {f}" for f in flags] or ["No scam indicators"]
        evidence.append(f"Analyzer: {analyzer}")
        confidence = text_confidence(len(flags), gemini_conf, used_gemini)

        if verdict == "SUSPICIOUS" or len(flags) >= 2:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Scam linguistics found: {', '.join(flags) or 'semantic risk'}. Intent suggests bait-and-switch.",
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=confidence,
                weight=self.weight,
            )

        if len(flags) == 1:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Suspicious pattern: {flags[0]}. Directing verification.",
                evidence=evidence,
                structured_evidence=structured_to_dict(structured),
                confidence=confidence,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail="Description appears legitimate; no scam intent detected.",
            evidence=evidence,
            structured_evidence=structured_to_dict(structured),
            confidence=confidence,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await TextAgent().run(state)


run_text_agent = run
