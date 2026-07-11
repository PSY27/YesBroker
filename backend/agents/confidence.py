"""Dynamic confidence scoring from API result density."""

from __future__ import annotations


def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def price_confidence(deviation_pct: float, deposit_months: float | None, verdict: str) -> float:
    base = 0.75
    if verdict == "BAIT":
        base += min(0.20, deviation_pct * 0.4)
        if deposit_months is not None and deposit_months < 1.5:
            base += 0.05
    elif verdict == "SUSPICIOUS":
        base += min(0.10, deviation_pct * 0.2)
    else:
        base = 0.88 if deviation_pct < 0.1 else 0.82
    return clamp(base)


def commute_confidence(discrepancy: int, is_live: bool, verdict: str) -> float:
    base = 0.70 + min(0.25, abs(discrepancy) * 0.02)
    if is_live:
        base += 0.05
    if verdict == "LIE" and discrepancy >= 10:
        base += 0.08
    return clamp(base)


def photo_confidence(
    matches_count: int,
    watermarks_count: int,
    is_live: bool,
    match_confidence: float = 0.0,
) -> float:
    if matches_count == 0 and watermarks_count == 0:
        return 0.90 if is_live else 0.85
    base = 0.80 + min(0.15, matches_count * 0.05) + min(0.10, watermarks_count * 0.05)
    if is_live:
        base += 0.03
    if match_confidence:
        base = max(base, match_confidence * 0.95)
    return clamp(base)


def web_confidence(scam_hits: int, total_results: int, has_gov_source: bool) -> float:
    if scam_hits == 0:
        return 0.88
    base = 0.55 + min(0.35, scam_hits * 0.15)
    if has_gov_source:
        base += 0.12
    if scam_hits >= 2:
        base += 0.08
    if total_results > 0:
        density = scam_hits / total_results
        base += density * 0.10
    return clamp(base)


def text_confidence(flag_count: int, gemini_conf: float | None, used_gemini: bool) -> float:
    if used_gemini and gemini_conf is not None:
        return clamp(gemini_conf)
    if flag_count >= 2:
        return 0.78
    if flag_count == 1:
        return 0.65
    return 0.85
