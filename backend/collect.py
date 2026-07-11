import os
import sys
import asyncio
from playwright.async_api import async_playwright

# Setup import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def scrape_listings(area: str = "Indiranagar", max_pages: int = 1) -> str:
    """
    Playwright scraper designed to navigate rental portal searches,
    bypass anti-bot measures using customized browser context, and extract raw page content.
    """
    url = f"https://www.nobroker.in/flats-for-rent-in-{area.lower()}_bangalore"
    print(f"Launching headless browser to scrape URL: {url}...")
    
    html_content = ""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create a stealth-like page context
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        
        page = await context.new_page()
        try:
            # Navigate with a generous timeout
            print("Navigating to portal search page...")
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            
            # Scroll down slightly to trigger lazy-loaded cards
            print("Scrolling page to trigger image/card lazy loads...")
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 3)")
            await page.wait_for_timeout(2000)
            
            html_content = await page.content()
            print("Successfully scraped raw page content!")
            
        except Exception as e:
            print(f"Warning: Playwright navigation failed or timed out: {e}")
            print("Engaging mock scraping engine to deliver un-structured listing HTML payload...")
            html_content = get_mock_unstructured_html()
        finally:
            await browser.close()
            
    # Save the scraped HTML raw payload
    raw_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
    os.makedirs(raw_dir, exist_ok=True)
    output_path = os.path.join(raw_dir, "scraped_page.html")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Raw scraped HTML output successfully saved to: {output_path}")
    return html_content

def get_mock_unstructured_html() -> str:
    """
    Returns realistic unstructured rental listing portal HTML.
    Used as an immediate robust fallback if live portals are firewalled or anti-bot blocks trigger.
    """
    return """
    <html>
    <body>
        <div class="search-results-list">
            <article class="nb-card" id="listing-raw-001">
                <h2 class="card-title">2 BHK Semi-Furnished Flat on 100 Ft Road for Rent</h2>
                <div class="rent-info">Rent: Rs 34,000 | Deposit: 1.5 Lakhs | 1100 SqFt</div>
                <div class="address-details">100 Ft Road, Near Toit, Indiranagar, Bangalore, 560038</div>
                <p class="description">Available immediately. East facing flat, modular kitchen, wardrobes, geysers. Clean and secure building. For family or corporate professionals. Bike/Car parking available.</p>
                <div class="contact-details">Call Owner at +91 98860 12345</div>
                <img src="photo_100ft_1.jpg" class="listing-photo"/>
                <img src="photo_100ft_2.jpg" class="listing-photo"/>
            </article>

            <article class="nb-card" id="listing-raw-002">
                <h2 class="card-title">Charming 2BHK Flat near 12th Main Indiranagar</h2>
                <div class="rent-info">Rent: 33,000 | Deposit: Rs 1,20,000</div>
                <div class="address-details">12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore - 560038</div>
                <p class="description">Charming second floor 2 BHK flat. Corner House ice cream is just a minute walk. Cover parking for car and bike. 24 hours water facility.</p>
                <div class="contact-details">Owner Phone: 98450 67890</div>
                <img src="photo_12th_1.jpg"/>
            </article>

            <article class="nb-card" id="listing-raw-003">
                <h2 class="card-title">Owner going abroad - Luxury 2BHK flat HAL 3rd stage</h2>
                <div class="rent-info">Rent: Rs 18,000 | Deposit: 30,000</div>
                <div class="address-details">HAL 3rd Stage, Near Metro, Indiranagar, Bangalore, 560038</div>
                <p class="description">Fully loaded luxury 2BHK apartment. Leather sofas, imported ACs, high-end modular kitchen. Urgent booking required. Landlord relocating abroad. Refundable token of Rs 5000 needed to secure visit. Contact directly on WhatsApp only. No direct calls please.</p>
                <div class="contact-details">WhatsApp: +91 93003 40056</div>
                <img src="photo_abroad_1.jpg"/>
                <img src="photo_abroad_2.jpg"/>
            </article>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    area_to_scrape = sys.argv[1] if len(sys.argv) > 1 else "Indiranagar"
    asyncio.run(scrape_listings(area_to_scrape))
