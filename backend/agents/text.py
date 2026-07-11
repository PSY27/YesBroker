import agents._path  # noqa: F401

import re

from agents.base import BaseAgent
from schema import AgentResult, CaseState
from tools.gemini_client import generate_json, is_configured

# Regex fallback when Gemini key is not set
SCAM_PATTERNS_EN = {
    "owner abroad": [
        r"owner (?:is )?going abroad",
        r"owner abroad",
        r"living abroad",
        r"out of country",
    ],
    "token to hold": [
        r"token (?:to )?hold",
        r"pay token",
        r"reserve the flat",
        r"refundable token",
        r"advance token",
    ],
    "whatsapp direct": [
        r"whatsapp me",
        r"whatsapp directly",
        r"message on whatsapp",
        r"no calls",
        r"direct owner contact",
    ],
    "coercive urgency": [
        r"urgent listing",
        r"huge queue",
        r"first come first served",
        r"rent out urgently",
    ],
}

SCAM_PATTERNS_MULTILINGUAL = {
    "token/advance pressure (kn/hi)": [
        r"token kodsi",
        r"advance kodi",
        r"token dedo",
        r"jaldi book",
        r"token pay",
    ],
    "owner unavailable (kn/hi)": [
        r"owner videsh",
        r"malik abroad",
        r"ghar ka malik bahar",
    ],
}


def _regex_scan(text: str) -> tuple[list[str], list[str]]:
    flagged: list[str] = []
    evidence: list[str] = []
    for patterns in (SCAM_PATTERNS_EN, SCAM_PATTERNS_MULTILINGUAL):
        for label, regexes in patterns.items():
            for regex in regexes:
                match = re.search(regex, text)
                if match:
                    flagged.append(label)
                    evidence.append(f"Found phrase matching '{match.group(0)}'")
                    break
    return flagged, evidence


async def _gemini_scan(description: str) -> tuple[list[str], list[str], float] | None:
    if not is_configured():
        return None

    prompt = (
        "Analyze this Bangalore rental listing description for scam indicators. "
        "Check English, Kannada, Hindi, and mixed-language text. "
        'Respond with JSON: {"flags": ["short label"], "evidence": ["quote or reason"], "confidence": 0.0-1.0}\n\n'
        f"Description:\n{description}"
    )
    data = await generate_json(prompt)
    if not data:
        return None
    return (
        data.get("flags", []),
        data.get("evidence", []),
        float(data.get("confidence", 0.85)),
    )


class TextAgent(BaseAgent):
    """Scans listing copy for scam linguistics via Gemini (regex fallback offline)."""

    name = "text"
    weight = 0.10

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        desc = (listing.description or "").strip()
        if not desc:
            return AgentResult(
                agent=self.name,
                verdict="CLEAN",
                detail="No description provided; no linguistic red flags detected.",
                evidence=["Empty description"],
                confidence=0.60,
                weight=self.weight,
            )

        flagged: list[str] = []
        evidence: list[str] = []
        confidence_boost: float | None = None

        gemini = await _gemini_scan(desc)
        if gemini:
            flagged, evidence, confidence_boost = gemini
            evidence = [str(e) for e in evidence]
            source = "Gemini analysis"
        else:
            flagged, evidence = _regex_scan(desc.lower())
            source = "Regex fallback (set GEMINI_API_KEY in .env for live analysis)"

        if len(flagged) >= 2:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Scam linguistics found: {', '.join(flagged)}. High indicators of bait-and-switch.",
                evidence=evidence + [source],
                confidence=confidence_boost or 0.90,
                weight=self.weight,
            )

        if len(flagged) == 1:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Suspicious pattern found: {flagged[0]}. Directing verification.",
                evidence=evidence + [source],
                confidence=confidence_boost or 0.70,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail="Description text appears normal with no known scam linguistic markers.",
            evidence=evidence or ["No scam keywords flagged", source],
            confidence=confidence_boost or 0.85,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await TextAgent().run(state)


run_text_agent = run
