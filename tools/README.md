# YesBroker (GharCheck) - Member 3: Tools & External APIs

This package contains the completed specialist tools and live verification crawlers designed for the 4-person YesBroker development team.

---

## 📂 Directory Structure

* **[collect.py](collect.py)**: Playwright-powered active crawler for extracting DOM pages from real estate portals.
* **[maps.py](maps.py)**: Google Maps Distance Matrix wrapper for calculating commute times to EGL, Indiranagar, and main Bangalore office hubs.
* **[vision.py](vision.py)**: Cloud Vision duplicate detector for cross-city listing image lookup.
* **[ocr.py](ocr.py)**: Optical Character Recognition engine for identifying watermarks or overlays (e.g. Nestaway, PropDial) on photos.
* **[google_search.py](google_search.py)**: Cybercrime number and broker blacklist organic search scanner.

---

## ⚡ Verification & Diagnostic Scripts

We have provided three automated diagnostic and test suites to verify that your integrations are working perfectly:

### 1. Standalone System Diagnostics
Exercises all 5 specialist toolsets and prints a unified health report of all external APIs.
```bash
python3 tools/test_tools.py
```

### 2. Live Requirement & Property Scraper
Connects directly to active Bangalore portal streams, scrapes real listings, and returns active detail links and live verified image assets for any matching criteria.
```bash
python3 tools/scrape_live_requirement.py
```

### 3. User Lifestyle Preference Matcher
Simulates lifestyle matching loops (e.g., verifying a "2 BHK in Chinnappanahalli" with strict "Non-Veg Allowed" and "Power Backup Required" preferences).
```bash
python3 tools/simulate_preference_match.py
```

---

## 🤝 Collaborative Working Guidelines (4-Person Team)
1. **Branch Integrity**: All Member 3 work must be committed directly to the `tools` branch.
2. **Merge Flow**: When Member 1 or Member 2 is ready to integrate, they should pull the `tools` branch and merge it into `backend-core` or `agents`.
3. **Collaborator Access**: Collaborators (e.g. `abdulsamad183`) must accept their invitation on GitHub under `PSY27/YesBroker` settings to gain push privileges to this repository.
