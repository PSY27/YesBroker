import os
from typing import Any

from tools.gemini_client import generate_json, is_configured

# Offline demo matches when GEMINI_API_KEY is not set
_KNOWN_DUPLICATES: dict[str, list[str]] = {
    "photo_abroad_1.jpg": [
        "https://www.nobroker.in/hyderabad/flat-for-rent-gachibowli_H0129",
        "https://www.99acres.com/pune/luxurious-2bhk-hinjewadi_P931",
        "https://pinterest.com/pin/luxurious-apartment-render-scam",
    ],
    "photo_token_1.jpg": [
        "https://olx.in/item/pune/scam-flat-1029",
        "https://facebook.com/groups/flat-rent-mumbai/stolen-post",
    ],
    "photo_army_1.jpg": [
        "https://magicbricks.com/delhi/dwarka-rent-scam-129",
    ],
}


class CloudVisionWrapper:
    """
    Photo forensics via Gemini (Google Search grounding for reverse-image signals).
    Falls back to offline demo corpus when API key is not configured.
    """

    async def detect_web_duplicates(self, image_url: str) -> dict[str, Any]:
        print(f"[Tools/Vision] Scanning photo: '{image_url}' for duplication...")
        file_basename = os.path.basename(image_url)

        if is_configured():
            prompt = (
                f"Analyze rental listing photo '{file_basename}' for signs of stolen/reused images "
                "across Indian rental portals (NoBroker, 99acres, OLX, Pinterest). "
                "Search for cross-city duplicate listings using this image.\n"
                'Return JSON: {"has_matches": bool, "matching_urls": ["url", ...], "confidence": 0.0-1.0, "detail": "..."}'
            )
            data = await generate_json(prompt, google_search=True)
            if data is not None:
                matches = data.get("matching_urls", [])
                has = bool(data.get("has_matches")) or bool(matches)
                if has:
                    print(f"[Tools/Vision] Gemini: {len(matches)} duplicate(s) found.")
                else:
                    print("[Tools/Vision] Gemini: photo appears unique.")
                return {
                    "image_url": image_url,
                    "has_matches": has,
                    "matching_urls": matches,
                    "is_grounded_live": True,
                    "match_confidence": float(data.get("confidence", 0.9 if has else 0.0)),
                    "detail": data.get("detail", ""),
                }

        matches = _KNOWN_DUPLICATES.get(file_basename, [])
        if matches:
            print(f"[Tools/Vision] Offline corpus: {len(matches)} duplicate(s) found.")
        else:
            print("[Tools/Vision] Offline corpus: photo appears unique.")

        return {
            "image_url": image_url,
            "has_matches": len(matches) > 0,
            "matching_urls": matches,
            "is_grounded_live": False,
            "match_confidence": 0.98 if matches else 0.0,
            "detail": "",
        }
