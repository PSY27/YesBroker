"""Compute trust score and verdict from agent findings."""

from __future__ import annotations

from schema import CaseState, TrustReport

_PENALTY = {
    "BAIT": 0.90,
    "LIE": 0.85,
    "SUSPICIOUS": 0.55,
    "CLEAN": 0.0,
    "SAFE": 0.0,
}

_QUESTIONS_SCAM = [
    "Can I video-call live from inside the flat right now?",
    "Why is the rent so far below other 2BHKs here?",
    "Can I pay strictly after a physical visit — no token?",
]
_QUESTIONS_CAUTION = [
    "Can you share the exact building society registration number?",
    "Is there 24x7 security guard coverage?",
    "Why is the claimed transit time slightly lower than live map times?",
]
_QUESTIONS_SAFE = [
    "Is the security deposit refundable in the agreement?",
    "Are there any maintenance charges excluded from the rent?",
    "What are the rules regarding tenant guests or pets?",
]


def build_trust_report(state: CaseState) -> TrustReport:
    score = 100
    for finding in state.findings:
        penalty = _PENALTY.get(finding.verdict, 0.3)
        score -= int(finding.weight * 100 * penalty)
    score = max(0, min(100, score))

    if score >= 75:
        verdict, questions = "SAFE", _QUESTIONS_SAFE
    elif score >= 45:
        verdict, questions = "CAUTION", _QUESTIONS_CAUTION
    elif score < 25:
        verdict, questions = "HIGH_RISK", _QUESTIONS_SCAM
    else:
        verdict, questions = "RISK", _QUESTIONS_SCAM

    return TrustReport(
        listing_id=state.listing.id,
        score=score,
        verdict=verdict,
        flags=state.findings,
        reasoning=state.trace,
        questions_to_ask=questions,
    )
