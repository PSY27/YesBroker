"""Playwright-based live listing fetch from NoBroker search pages."""

from __future__ import annotations

import hashlib
import os
import re
import sys
from typing import Any

from playwright.async_api import async_playwright

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

AREA_PINCODES: dict[str, str] = {
    "indiranagar": "560038",
    "domlur": "560071",
    "jeevan bima nagar": "560075",
    "koramangala": "560034",
    "whitefield": "560066",
    "chinnapanna halli": "560037",
    "chinnappanahalli": "560037",
}

_CARD_SELECTORS = (
    "article",
    ".nb-card",
    ".card",
    "[data-testid='property-card']",
    ".property-card",
    "div[class*='listing']",
)

_DETAIL_GALLERY_SELECTORS = (
    "[class*='gallery'] img",
    "[class*='carousel'] img",
    "[class*='property'] img",
    "img[src*='nobroker.in/images']",
    "img[src*='images.nobroker']",
)


def _root_dir() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_fallback_image(filename: str) -> str:
    root_dir = _root_dir()
    images_dir = os.path.join(root_dir, "frontend", "images")
    os.makedirs(images_dir, exist_ok=True)

    save_path = os.path.join(images_dir, filename)
    fallback_source = os.path.join(root_dir, "stolen_flat.png")
    if not os.path.exists(fallback_source):
        fallback_source = os.path.join(root_dir, "hero_apartment.png")

    if os.path.exists(fallback_source):
        import shutil

        try:
            shutil.copy(fallback_source, save_path)
            return save_path
        except Exception:
            pass
    return save_path


def _slug_area(area: str) -> str:
    return area.lower().strip().replace(" ", "_").replace("-", "_")


def _pincode_for_area(area: str) -> str:
    key = area.lower().strip()
    return AREA_PINCODES.get(key, "560038")


def _extract_rent(text: str) -> int | None:
    patterns = [
        r"(?:rent|₹|rs\.?)\s*[:\-]?\s*([\d,]+)",
        r"([\d,]+)\s*/\s*month",
        r"₹\s*([\d,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = int(match.group(1).replace(",", ""))
            if 3000 <= val <= 500000:
                return val
    nums = [int(n.replace(",", "")) for n in re.findall(r"[\d,]{4,7}", text)]
    for n in nums:
        if 5000 <= n <= 200000:
            return n
    return None


def _extract_bhk(text: str) -> str | None:
    match = re.search(r"(\d)\s*bhk", text, re.IGNORECASE)
    return match.group(1) if match else None


def _extract_pincode(text: str, area: str) -> str:
    match = re.search(r"\b(560\d{3})\b", text)
    return match.group(1) if match else _pincode_for_area(area)


def _extract_deposit(text: str) -> int | None:
    match = re.search(
        r"deposit\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)",
        text,
        re.IGNORECASE,
    )
    if match:
        return int(match.group(1).replace(",", ""))
    lakh = re.search(r"deposit\s*[:\-]?\s*([\d.]+)\s*lakh", text, re.IGNORECASE)
    if lakh:
        return int(float(lakh.group(1)) * 100000)
    return None


def _extract_sqft(text: str) -> int | None:
    match = re.search(r"(\d{3,4})\s*(?:sq\.?\s*ft|sqft)", text, re.IGNORECASE)
    return int(match.group(1)) if match else None


def _extract_phone(text: str) -> str | None:
    match = re.search(r"(\+91[\s\-]?\d{5}[\s\-]?\d{5}|\d{10})", text)
    return match.group(1) if match else None


def _listing_id(source_url: str, idx: int) -> str:
    if source_url:
        digest = hashlib.md5(source_url.encode()).hexdigest()[:10]
        return f"LIVE_{digest}"
    return f"LIVE_{idx:03d}"


def _is_property_detail_url(url: str) -> bool:
    return bool(url) and "/property/" in url


def _screenshot_ok(path: str, min_bytes: int = 800) -> bool:
    return os.path.isfile(path) and os.path.getsize(path) >= min_bytes


async def _screenshot_property_page(context, source_url: str, save_path: str) -> str | None:
    """Open listing detail URL and save a Playwright screenshot (not extracted img src)."""
    if not _is_property_detail_url(source_url):
        return None

    detail_page = await context.new_page()
    try:
        await detail_page.goto(source_url, wait_until="domcontentloaded", timeout=25000)
        await detail_page.wait_for_timeout(2000)

        for selector in _DETAIL_GALLERY_SELECTORS:
            el = await detail_page.query_selector(selector)
            if not el:
                continue
            try:
                await el.scroll_into_view_if_needed()
                await detail_page.wait_for_timeout(400)
                await el.screenshot(path=save_path)
                if _screenshot_ok(save_path):
                    return save_path
            except Exception:
                continue

        await detail_page.screenshot(path=save_path, full_page=False)
        if _screenshot_ok(save_path):
            return save_path
        return None
    except Exception as exc:
        print(f"[Tools/Collect] Detail page screenshot failed ({source_url}): {exc}")
        return None
    finally:
        await detail_page.close()


async def _screenshot_card_element(card, save_path: str) -> str | None:
    """Fallback: screenshot the whole search-result card."""
    try:
        await card.scroll_into_view_if_needed()
        await card.screenshot(path=save_path)
        if _screenshot_ok(save_path, min_bytes=500):
            return save_path
    except Exception as exc:
        print(f"[Tools/Collect] Card screenshot failed: {exc}")
    return None


async def capture_listing_photo(context, card, source_url: str, save_path: str) -> str:
    """Capture listing image via detail-page screenshot, then card, then static fallback."""
    local_name = os.path.basename(save_path)

    detail_path = await _screenshot_property_page(context, source_url, save_path)
    if detail_path:
        print(f"[Tools/Collect] Detail screenshot saved: {local_name}")
        return detail_path

    card_path = await _screenshot_card_element(card, save_path)
    if card_path:
        print(f"[Tools/Collect] Card screenshot saved: {local_name}")
        return card_path

    print(f"[Tools/Collect] Screenshot failed — using fallback for {local_name}")
    return get_fallback_image(local_name)


def _parse_html_articles(html: str, area: str, images_dir: str) -> list[dict[str, Any]]:
    """Parse emulated or cached HTML article blocks into listing dicts."""
    listings: list[dict[str, Any]] = []
    articles = re.findall(r"<article[^>]*>(.*?)</article>", html, re.DOTALL | re.IGNORECASE)
    if not articles:
        articles = [html]

    for idx, block in enumerate(articles[:20]):
        title_m = re.search(
            r"<h2[^>]*>(.*?)</h2>",
            block,
            re.DOTALL | re.IGNORECASE,
        )
        title = re.sub(r"<[^>]+>", "", title_m.group(1)).strip() if title_m else f"{area} rental {idx + 1}"

        rent_m = re.search(r"rent-info[^>]*>(.*?)</div>", block, re.DOTALL | re.IGNORECASE)
        addr_m = re.search(r"address-details[^>]*>(.*?)</div>", block, re.DOTALL | re.IGNORECASE)
        desc_m = re.search(r"<p[^>]*class=[\"']description[\"'][^>]*>(.*?)</p>", block, re.DOTALL | re.IGNORECASE)
        link_m = re.search(r'href=["\']([^"\']+)["\']', block)
        img_m = re.search(r'src=["\']([^"\']+\.(?:jpg|jpeg|png|webp))["\']', block, re.IGNORECASE)

        rent_text = re.sub(r"<[^>]+>", " ", rent_m.group(1)) if rent_m else block
        addr_text = re.sub(r"<[^>]+>", " ", addr_m.group(1)).strip() if addr_m else f"{area}, Bangalore"
        description = re.sub(r"<[^>]+>", " ", desc_m.group(1)).strip() if desc_m else title

        rent = _extract_rent(rent_text) or _extract_rent(block) or 25000
        bhk = _extract_bhk(title) or _extract_bhk(block) or "2"
        source_url = link_m.group(1) if link_m else f"https://www.nobroker.in/flats-for-rent-in-{_slug_area(area)}_bangalore"
        if source_url.startswith("/"):
            source_url = f"https://www.nobroker.in{source_url}"

        photo_urls: list[str] = []
        if img_m:
            img_url = img_m.group(1)
            local_name = f"scraped_{_slug_area(area)}_{idx:03d}.jpg"
            local_path = os.path.join(images_dir, local_name)
            photo_urls.append(local_path if os.path.isabs(local_path) else local_path)

        listings.append(
            {
                "id": _listing_id(source_url, idx),
                "title": title[:120],
                "rent": rent,
                "deposit": _extract_deposit(rent_text),
                "bhk": bhk,
                "area_sqft": _extract_sqft(rent_text),
                "address": addr_text[:200],
                "pincode": _extract_pincode(addr_text, area),
                "landmark": area,
                "claimed_commute_min": 15,
                "description": description[:500],
                "phone": _extract_phone(block),
                "photo_urls": photo_urls or [get_fallback_image(f"fallback_{idx:03d}.jpg")],
                "source_url": source_url,
            }
        )
    return listings


async def fetch_live_listings(
    area: str = "Indiranagar",
    *,
    bhk: str | None = None,
    max_rent: int | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """
    Scrape live rental listings via Playwright and return Listing-compatible dicts.
    Falls back to parsing cached/emulated HTML when the portal blocks headless access.
    """
    slug = _slug_area(area)
    url = f"https://www.nobroker.in/flats-for-rent-in-{slug}_bangalore"
    print(f"[Tools/Collect] Fetching live listings: {url}")

    root_dir = _root_dir()
    images_dir = os.path.join(root_dir, "frontend", "images")
    os.makedirs(images_dir, exist_ok=True)
    raw_dir = os.path.join(root_dir, "backend", "raw")
    os.makedirs(raw_dir, exist_ok=True)

    listings: list[dict[str, Any]] = []
    html_content = ""

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 900},
            )
            page = await context.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 3)")
            await page.wait_for_timeout(2500)

            html_content = await page.content()

            cards: list = []
            for selector in _CARD_SELECTORS:
                found = await page.query_selector_all(selector)
                if len(found) >= 2:
                    cards = found
                    break
            if not cards:
                cards = await page.query_selector_all("a[href*='/property/']")

            for idx, card in enumerate(cards[:limit]):
                try:
                    title_el = await card.query_selector("h2, h3, [class*='title']")
                    title = (await title_el.inner_text()).strip() if title_el else f"{area} flat {idx + 1}"

                    link_el = await card.query_selector("a[href*='/property/'], a")
                    link_href = await link_el.get_attribute("href") if link_el else ""
                    source_url = (
                        f"https://www.nobroker.in{link_href}"
                        if link_href and link_href.startswith("/")
                        else (link_href or url)
                    )

                    card_text = await card.inner_text()
                    rent = _extract_rent(card_text) or 30000
                    bhk_val = _extract_bhk(title) or _extract_bhk(card_text) or "2"

                    local_filename = f"scraped_{slug}_{idx:03d}.png"
                    local_path = os.path.join(images_dir, local_filename)
                    photo_path = await capture_listing_photo(
                        context, card, source_url, local_path
                    )
                    photo_urls = [photo_path]

                    address = f"{area}, Bangalore"
                    for line in card_text.split("\n"):
                        if any(
                            token in line.lower()
                            for token in ("road", "main", "layout", "stage", "bangalore", "bengaluru")
                        ):
                            address = line.strip()[:200]
                            break

                    listings.append(
                        {
                            "id": _listing_id(source_url, idx),
                            "title": title[:120],
                            "rent": rent,
                            "deposit": _extract_deposit(card_text),
                            "bhk": bhk_val,
                            "area_sqft": _extract_sqft(card_text),
                            "address": address,
                            "pincode": _extract_pincode(card_text, area),
                            "landmark": area,
                            "claimed_commute_min": 15,
                            "description": card_text[:500],
                            "phone": _extract_phone(card_text),
                            "photo_urls": photo_urls,
                            "source_url": source_url,
                        }
                    )
                except Exception as err:
                    print(f"[Tools/Collect] Card {idx} parse error: {err}")

            await browser.close()
        except Exception as e:
            print(f"[Tools/Collect] Playwright error: {e} — using HTML fallback parser")
            html_content = get_emulated_unstructured_html()

    if not listings and html_content:
        listings = _parse_html_articles(html_content, area, images_dir)

    if not listings:
        listings = _parse_html_articles(get_emulated_unstructured_html(), area, images_dir)

    # Filter by search prefs
    if bhk:
        listings = [l for l in listings if str(l.get("bhk")) == str(bhk)]
    if max_rent:
        listings = [l for l in listings if int(l.get("rent", 0)) <= max_rent]

    # Dedupe by source_url
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for row in listings:
        key = row.get("source_url") or row["id"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)

    cache_html = os.path.join(raw_dir, "scraped_page.html")
    with open(cache_html, "w", encoding="utf-8") as f:
        f.write(html_content or get_emulated_unstructured_html())

    cache_json = os.path.join(raw_dir, "scraped_listings.json")
    with open(cache_json, "w", encoding="utf-8") as f:
        import json

        json.dump(unique[:limit], f, indent=2)

    print(f"[Tools/Collect] Returning {len(unique[:limit])} live listings for {area}")
    return unique[:limit]


async def scrape_page(area: str = "Indiranagar") -> str:
    """Backward-compatible HTML scrape (used by tests/tools)."""
    listings = await fetch_live_listings(area, limit=5)
    raw_dir = os.path.join(_root_dir(), "backend", "raw")
    path = os.path.join(raw_dir, "scraped_page.html")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return f.read()
    return get_emulated_unstructured_html()


def get_emulated_unstructured_html() -> str:
    return """
    <div class="scraped-results">
        <article class="nb-card" id="listing-raw-001">
            <h2 class="card-title">2 BHK Semi-Furnished Flat on 100 Ft Road for Rent</h2>
            <img src="https://images.nobroker.in/images/8a9f82c488b3922c0188b3941bca0572/8a9f82c488b3922c0188b3941bca0572_77180_medium.jpg" alt="Property Photo 1" />
            <div class="rent-info">Rent: Rs 34,000 | Deposit: 1.5 Lakhs | 1100 SqFt</div>
            <div class="address-details">100 Ft Road, Near Toit, Indiranagar, Bangalore, 560038</div>
            <p class="description">Modular kitchen, wardrobes, geysers, gated community. Power backup available.</p>
            <a href="https://www.nobroker.in/property/2-bhk-apartment-for-rent-in-chinnapanna-halli-bangalore-for-rs-32000/8a9f82c488b3922c0188b3941bca0572/detail">View Detail</a>
        </article>
        <article class="nb-card" id="listing-raw-002">
            <h2 class="card-title">3 BHK Flat in Indiranagar 12th Main</h2>
            <img src="https://images.nobroker.in/images/8a9f82d288c3933c0188c3951bc10573/8a9f82d288c3933c0188c3951bc10573_99210_medium.jpg" />
            <div class="rent-info">Rent: Rs 48,000 | Deposit: Rs 2,00,000 | 1400 SqFt</div>
            <div class="address-details">12th Main Road, Indiranagar, Bangalore, 560038</div>
            <p class="description">Spacious 3 BHK with covered parking and 24x7 security.</p>
            <a href="https://www.nobroker.in/property/3-bhk-indiranagar/detail">View Detail</a>
        </article>
        <article class="nb-card" id="listing-raw-003">
            <h2 class="card-title">Owner going abroad - Luxury 2BHK flat HAL 3rd stage</h2>
            <img src="https://images.nobroker.in/images/8a9f82d288c3933c0188c3951bc10573/8a9f82d288c3933c0188c3951bc10573_99210_medium.jpg" />
            <div class="rent-info">Rent: Rs 18,000 | Deposit: 30,000</div>
            <div class="address-details">HAL 3rd Stage, Near Metro, Indiranagar, Bangalore, 560038</div>
            <p class="description">Relocating abroad. Pay refundable token before visit. WhatsApp only. No calls.</p>
            <a href="https://www.nobroker.in/property/2-bhk-apartment-for-rent-in-chinnapanna-halli-bangalore-for-rs-28000/8a9f82d288c3933c0188c3951bc10573/detail">View Detail</a>
        </article>
    </div>
    """
