import agents._path  # noqa: F401

import os
import re

from agents.base import BaseAgent
from schema import AgentResult, CaseState

# English scam linguistic patterns
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

# Kannada / Hindi transliterated scam phrases common in Bangalore listings
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
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        import httpx

        prompt = (
            "Analyze this rental listing description for scam indicators. "
            "Respond with JSON only: "
            '{"flags": ["short label", ...], "evidence": ["quote or reason", ...], "confidence": 0.0-1.0}. '
            "Check English, Kannada, Hindi, and mixed-language text.\n\n"
            f"Description:\n{description}"
        )
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                params={"key": api_key},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            import json

            # Strip markdown fences if present
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
            data = json.loads(text)
            return data.get("flags", []), data.get("evidence", []), float(data.get("confidence", 0.85))
    except Exception:
        return None


class TextAgent(BaseAgent):
    """Scans listing copy for scam linguistics (regex + optional Gemini)."""

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

        desc_lower = desc.lower()
        flagged, evidence = _regex_scan(desc_lower)

        gemini = await _gemini_scan(desc)
        if gemini:
            g_flags, g_evidence, g_conf = gemini
            for f in g_flags:
                if f not in flagged:
                    flagged.append(f)
            evidence.extend(g_evidence)
            confidence_boost = g_conf
        else:
            confidence_boost = None

        if len(flagged) >= 2:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Scam linguistics found: {', '.join(flagged)}. High indicators of bait-and-switch.",
                evidence=evidence,
                confidence=confidence_boost or 0.90,
                weight=self.weight,
            )

        if len(flagged) == 1:
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail=f"Suspicious pattern found: {flagged[0]}. Directing verification.",
                evidence=evidence,
                confidence=confidence_boost or 0.70,
                weight=self.weight,
            )

        return AgentResult(
            agent=self.name,
            verdict="CLEAN",
            detail="Description text appears normal with no known scam linguistic markers.",
            evidence=["No scam keywords flagged"],
            confidence=confidence_boost or 0.85,
            weight=self.weight,
        )


async def run(state: CaseState) -> AgentResult:
    return await TextAgent().run(state)


run_text_agent = run
