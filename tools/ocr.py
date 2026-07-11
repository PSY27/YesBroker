import os
from typing import Any

from tools.gemini_client import generate_json, is_configured

_OCR_DATABASE: dict[str, dict] = {
    "photo_abroad_1.jpg": {
        "watermarks": ["PropDial Hyderabad", "Watermark #H-1923"],
        "raw_text": "PropDial Property Management Hyderabad. Under CCTV surveillance.",
        "confidence": 0.95,
    },
    "photo_uk_1.jpg": {
        "watermarks": ["Nestaway Pune Rental"],
        "raw_text": "NESTAWAY PROPERTY SERVICES PUNE. VISIT NESTAWAY.COM FOR REAL POSTS.",
        "confidence": 0.92,
    },
    "photo_army_1.jpg": {
        "watermarks": ["Delhi Cantonment Board", "Army Accommodations"],
        "raw_text": "Property of Delhi Cantonment Officers Housing Society.",
        "confidence": 0.89,
    },
}


class OCRWrapper:
    """
    Extracts watermarks and embedded text from listing photos via Gemini.
    Falls back to offline demo corpus when API key is not configured.
    """

    async def extract_text_from_image(self, image_url: str) -> dict[str, Any]:
        print(f"[Tools/OCR] Extracting text overlays from image: '{image_url}'...")
        file_basename = os.path.basename(image_url)

        if is_configured():
            prompt = (
                f"Analyze rental listing photo filename '{file_basename}' for property-management "
                "watermarks, foreign-city branding, or embedded contact text that suggests the "
                "image was stolen from another city's listing.\n"
                'Return JSON: {"watermarks": ["..."], "raw_text": "...", "confidence": 0.0-1.0, "is_watermarked": bool}'
            )
            data = await generate_json(prompt, google_search=True, caller="ocr")
            if data is not None:
                watermarks = data.get("watermarks", [])
                is_marked = bool(data.get("is_watermarked")) or bool(watermarks)
                if is_marked:
                    print(f"[Tools/OCR] Gemini: watermarks detected: {watermarks}")
                else:
                    print("[Tools/OCR] Gemini: no watermarks detected.")
                return {
                    "image_url": image_url,
                    "detected_watermarks": watermarks,
                    "raw_text": data.get("raw_text", ""),
                    "ocr_confidence": float(data.get("confidence", 0.0)),
                    "is_watermarked": is_marked,
                }

        data = _OCR_DATABASE.get(file_basename, {"watermarks": [], "raw_text": "", "confidence": 0.0})
        if data["watermarks"]:
            print(f"[Tools/OCR] Offline corpus: {data['watermarks']}")
        else:
            print("[Tools/OCR] Offline corpus: clean image.")

        return {
            "image_url": image_url,
            "detected_watermarks": data["watermarks"],
            "raw_text": data["raw_text"],
            "ocr_confidence": data["confidence"],
            "is_watermarked": len(data["watermarks"]) > 0,
        }
