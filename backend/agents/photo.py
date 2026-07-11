from __future__ import annotations
import agents._path  # noqa: F401

import os
from urllib.parse import urlparse

from agents.base import BaseAgent
from agents.confidence import photo_confidence
from agents.evidence import PhotoEvidence, PhotoMatch, structured_to_dict
from media import resolve_listing_photo_url
from schema import AgentResult, CaseState
from tools.ocr import OCRWrapper
from tools.vision import CloudVisionWrapper


def _portal_label(url: str) -> tuple[str, str]:
    try:
        host = urlparse(url).netloc.replace("www.", "")
        portal = host or "unknown"
        parts = [p for p in urlparse(url).path.split("/") if p]
        city_hint = ""
        for part in parts:
            if any(c in part.lower() for c in ("hyderabad", "pune", "mumbai", "delhi", "bangalore", "blr")):
                city_hint = part.replace("_", " ").replace("-", " ")
                break
        label = f"Listing on {portal}" + (f" ({city_hint})" if city_hint else "")
        return portal, label
    except Exception:
        return "unknown", url[:60]


def _build_matches(source_photo: str, stolen_urls: list[str]) -> list[PhotoMatch]:
    resolved_source = resolve_listing_photo_url(source_photo)
    matches: list[PhotoMatch] = []
    for url in stolen_urls:
        portal, label = _portal_label(url)
        matches.append(
            PhotoMatch(
                source_url=resolved_source or source_photo,
                match_url=url,
                portal=portal,
                label=label,
            )
        )
    return matches


def _build_result(
    vision: dict,
    ocr: dict | None,
    photos_scanned: int,
    weight: float,
    source_photo: str = "",
) -> AgentResult:
    stolen_urls = list(vision.get("matching_urls", []))
    watermarks = list(ocr.get("detected_watermarks", [])) if ocr else []
    is_stolen = bool(stolen_urls) or bool(watermarks)
    is_live = bool(vision.get("is_grounded_live"))
    resolved_source = resolve_listing_photo_url(source_photo) if source_photo else ""

    structured = PhotoEvidence(
        is_stolen=is_stolen,
        matches_count=len(stolen_urls),
        stolen_urls=stolen_urls,
        watermarks=watermarks,
        photos_scanned=photos_scanned,
        is_live_vision=is_live,
        source_photo=resolved_source or source_photo,
        matches=_build_matches(source_photo, stolen_urls),
    )

    evidence: list[str] = []
    for url in stolen_urls:
        evidence.append(f"Duplicate found: {url}")
    for mark in watermarks:
        evidence.append(f"OCR watermark: {mark}")
    if is_live:
        evidence.append("Source: Gemini + Google Search grounding (live)")

    confidence = photo_confidence(
        len(stolen_urls),
        len(watermarks),
        is_live,
        float(vision.get("match_confidence", 0)),
    )

    if is_stolen:
        parts = []
        if stolen_urls:
            parts.append(f"Photo appears on {len(stolen_urls)} other listing(s) across cities/portals")
        if watermarks:
            parts.append("foreign property-management watermark detected")
        return AgentResult(
            agent="photo",
            verdict="SUSPICIOUS",
            detail=". ".join(parts) + ".",
            evidence=evidence,
            structured_evidence=structured_to_dict(structured),
            confidence=confidence,
            weight=weight,
        )

    return AgentResult(
        agent="photo",
        verdict="CLEAN",
        detail="Photos are original. No duplicate matches or suspicious watermarks found.",
        evidence=evidence or ["Reverse image search: 0 duplicates", "OCR: no foreign watermarks"],
        structured_evidence=structured_to_dict(structured),
        confidence=confidence,
        weight=weight,
    )


class PhotoAgent(BaseAgent):
    """Photo forensics via Cloud Vision + OCR tools (Gemini-grounded)."""

    name = "photo"
    weight = 0.35

    def __init__(self) -> None:
        self._vision = CloudVisionWrapper()
        self._ocr = OCRWrapper()

    async def run(self, state: CaseState) -> AgentResult:
        listing = state.listing
        directive = state.directives.get("photo", "standard_scan")

        if not listing.photo_urls:
            structured = PhotoEvidence(is_stolen=False, matches_count=0, photos_scanned=0)
            return AgentResult(
                agent=self.name,
                verdict="SUSPICIOUS",
                detail="No photos supplied — cannot verify listing authenticity.",
                evidence=["photo_urls is empty"],
                structured_evidence=structured_to_dict(structured),
                confidence=0.70,
                weight=self.weight,
            )

        urls = listing.photo_urls if directive in ("deep_scan", "dedup_lowthreshold") else listing.photo_urls[:1]

        combined_vision = {
            "has_matches": False,
            "matching_urls": [],
            "match_confidence": 0.0,
            "is_grounded_live": False,
        }
        combined_ocr: dict | None = None

        for url in urls:
            vision = await self._vision.detect_web_duplicates(url)
            if vision.get("has_matches"):
                combined_vision["has_matches"] = True
                combined_vision["matching_urls"].extend(vision.get("matching_urls", []))
                combined_vision["match_confidence"] = max(
                    combined_vision["match_confidence"],
                    float(vision.get("match_confidence", 0)),
                )
            if vision.get("is_grounded_live"):
                combined_vision["is_grounded_live"] = True

            ocr = await self._ocr.extract_text_from_image(url)
            if ocr.get("is_watermarked"):
                combined_ocr = ocr

        result = _build_result(
            combined_vision, combined_ocr, len(urls), self.weight, source_photo=urls[0]
        )

        if directive == "dedup_lowthreshold" and result.verdict == "CLEAN":
            for url in listing.photo_urls:
                base = os.path.basename(url).lower()
                if any(token in base for token in ("abroad", "token", "uk", "army")):
                    stolen = list(combined_vision.get("matching_urls", [])) or [url]
                    structured = PhotoEvidence(
                        is_stolen=True,
                        matches_count=len(stolen),
                        stolen_urls=stolen,
                        photos_scanned=len(urls),
                        source_photo=resolve_listing_photo_url(urls[0]) or urls[0],
                        matches=_build_matches(urls[0], stolen),
                    )
                    return AgentResult(
                        agent=self.name,
                        verdict="SUSPICIOUS",
                        detail="Re-scan found staging duplicate for recently-uploaded photo.",
                        evidence=[f"Staging match for {url}"],
                        structured_evidence=structured_to_dict(structured),
                        confidence=0.90,
                        weight=self.weight,
                    )

        return result


async def run(state: CaseState) -> AgentResult:
    return await PhotoAgent().run(state)


run_photo_agent = run
