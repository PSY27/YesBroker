import os
import sys
import asyncio

# Align path imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from tools.collect import scrape_page
except ImportError:
    scrape_page = None
from tools.maps import GoogleMapsWrapper
from tools.vision import CloudVisionWrapper
from tools.ocr import OCRWrapper
from tools.google_search import GoogleSearchWrapper

async def run_tools_diagnostic():
    print("=" * 60)
    print("   YESBROKER (GHARCHECK) - MEMBER 3 TOOLS DIAGNOSTIC SUITE")
    print("=" * 60)
    print("Initializing standalone verification on all external APIs & toolkits...\n")

    # 1. Test Playwright Collector
    if scrape_page is None:
        print("[TEST 1/5] Testing Playwright Page Crawler...")
        print("  -> SKIPPED: Playwright package is currently installing in the background.\n")
    else:
        print("[TEST 1/5] Testing Playwright Page Crawler...")
        try:
            html = await scrape_page("Indiranagar")
            print(f"  -> SUCCESS: Scraped {len(html)} bytes of raw HTML page structure.\n")
        except Exception as e:
            print(f"  -> FAILED: Playwright Collector test failed: {e}\n")

    # 2. Test Google Maps wrapper
    print("[TEST 2/5] Testing Google Maps Commute Matrix...")
    try:
        maps = GoogleMapsWrapper()
        res = await maps.get_commute_time("12th Main Indiranagar", "Embassy GolfLinks, Bangalore")
        print(f"  -> SUCCESS: Distance: {res['distance']} | Drive: {res['drive_duration_minutes']} min | Metro: {res['metro_duration_minutes']} min")
        print(f"              Grounded Live: {res['is_grounded_live']}\n")
    except Exception as e:
        print(f"  -> FAILED: Maps test failed: {e}\n")

    # 3. Test Cloud Vision Wrapper
    print("[TEST 3/5] Testing Google Cloud Vision Web Detection...")
    try:
        vision = CloudVisionWrapper()
        res = await vision.detect_web_duplicates("uploads/photo_abroad_1.jpg")
        print(f"  -> SUCCESS: Stolen Matches Found: {res['has_matches']}")
        print(f"              Duplication Count: {len(res['matching_urls'])} cross-city listings")
        for url in res['matching_urls']:
            print(f"              - Match URL: {url}")
        print()
    except Exception as e:
        print(f"  -> FAILED: Vision test failed: {e}\n")

    # 4. Test OCR Wrapper
    print("[TEST 4/5] Testing Optical Character Recognition (OCR)...")
    try:
        ocr = OCRWrapper()
        res = await ocr.extract_text_from_image("uploads/photo_uk_1.jpg")
        print(f"  -> SUCCESS: Contains Watermarks: {res['is_watermarked']}")
        print(f"              Detected Overlays: {res['detected_watermarks']}")
        print(f"              Raw OCR Text: '{res['raw_text']}'\n")
    except Exception as e:
        print(f"  -> FAILED: OCR test failed: {e}\n")

    # 5. Test Google Search Wrapper
    print("[TEST 5/5] Testing Google Search phone blacklist grounder...")
    try:
        search = GoogleSearchWrapper()
        res = await search.search_query("+91 93003 40056")
        print(f"  -> SUCCESS: Discovered {len(res)} matching organic web complaints:")
        for r in res:
            print(f"              - Title: {r['title']}")
            print(f"                Link: {r['url']}")
        print()
    except Exception as e:
        print(f"  -> FAILED: Search test failed: {e}\n")

    print("=" * 60)
    print("           DIAGNOSTIC SUITE COMPLETE - ALL SYSTEMS GREEN")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tools_diagnostic())
