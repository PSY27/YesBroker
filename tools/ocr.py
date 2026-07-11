import os
from typing import Dict, Any

class OCRWrapper:
    """
    OCR (Optical Character Recognition) Parser: Extracts embedded text, 
    landlord phone numbers, or corporate watermarks from uploaded listing photos.
    Helps verify if a landlord is reposting someone else's managed property.
    """
    def __init__(self, use_tesseract: bool = False):
        self.use_tesseract = use_tesseract

    async def extract_text_from_image(self, image_url: str) -> Dict[str, Any]:
        """
        Runs OCR scan over images to locate watermarks (e.g. Nestaway, Housing.com)
        or contact details written inside the photo graphic layer.
        """
        print(f"[Tools/OCR] Extracting text overlays from image: '{image_url}'...")
        
        file_basename = os.path.basename(image_url)
        
        # Mock OCR output for known duplicated pictures
        ocr_database = {
            "photo_abroad_1.jpg": {
                "watermarks": ["PropDial Hyderabad", "Watermark #H-1923"],
                "raw_text": "PropDial Property Management Hyderabad. Under CCTV surveillance.",
                "confidence": 0.95
            },
            "photo_uk_1.jpg": {
                "watermarks": ["Nestaway Pune Rental"],
                "raw_text": "NESTAWAY PROPERTY SERVICES PUNE. VISIT NESTAWAY.COM FOR REAL POSTS.",
                "confidence": 0.92
            },
            "photo_army_1.jpg": {
                "watermarks": ["Delhi Cantonment Board", "Army Accommodations"],
                "raw_text": "Property of Delhi Cantonment Officers Housing Society.",
                "confidence": 0.89
            }
        }

        data = ocr_database.get(file_basename, {
            "watermarks": [],
            "raw_text": "",
            "confidence": 0.0
        })

        if data["watermarks"]:
            print(f"[Tools/OCR] Extracted watermarked patterns: {data['watermarks']}")
        else:
            print(f"[Tools/OCR] OCR scan complete. Clean image with no text watermarks.")

        return {
            "image_url": image_url,
            "detected_watermarks": data["watermarks"],
            "raw_text": data["raw_text"],
            "ocr_confidence": data["confidence"],
            "is_watermarked": len(data["watermarks"]) > 0
        }
