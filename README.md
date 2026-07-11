# YesBroker (GharCheck) - Multi-Agent Trust Verification

Welcome to **YesBroker (GharCheck)**, a secure rental search engine for Bangalore (Indiranagar and surrounding areas) built to protect home seekers from rental fraud and bait-and-switch listings. 

YesBroker passes rental listings through a pipeline of **5 specialized verification agents** (coordinated via a Planner/Arbiter model) to calculate a final trust score and output a comprehensive Trust Report complete with Red Flags, broker checklists, and a live agentic investigation trace.

---

## Technical Architecture & Core Elements

### The 5 Specialized Agents
1. 🖼️ **Photo-Forensics**: Employs Google Cloud Vision Web Detection to flag stolen photos, model apartments, and duplicates listed in other cities.
2. 💰 **Price-Sanity**: Compares rent against real regional medians to flag bait pricing (e.g., extremely cheap apartments requiring direct token payments).
3. 🚗 **Commute-Truth**: Calculates real 9:00 AM peak hour transit times to your target office (e.g. Embassy GolfLinks) to detect exaggerated proximity claims.
4. 💬 **Text-Tells**: Analyzes rental descriptions for high-risk scam linguists ("owner abroad", "pay token to hold", "WhatsApp directly", "no calls").
5. 🌐 **Web-Recon (webcmd)**: Searches the live web for broker reputation, phone blacklists, and cross-portal listing duplicate hosts.

---

## File Structure

```
YesBroker/
├── backend/
│   ├── agents/
│   │   ├── __init__.py            # Agent registry (price, text, photo, commute, web)
│   │   ├── base.py                # BaseAgent interface: async run(state) -> AgentResult
│   │   ├── mock_data.py           # Deterministic mock intel for demo corpus
│   │   ├── commute.py             # Commute-Truth agent logic
│   │   ├── photo.py               # Photo-Forensics agent logic
│   │   ├── price.py               # Price-Sanity agent logic
│   │   ├── text.py                # Text-Tells agent logic
│   │   └── web.py                 # Web-Recon agent logic
│   ├── data/
│   │   ├── listings.json          # Scraped and salted database
│   │   └── scores.json            # Compiled trust report cache
│   ├── app.py                     # FastAPI backend & routes
│   ├── schema.py                  # Core Pydantic data models
│   └── precompute.py              # Compilation and orchestration script
├── frontend/
│   ├── index.html                 # Main interface structure
│   ├── style.css                  # Custom, animated dark glassmorphism styles
│   └── app.js                     # Frontend interactive controller & typewriter simulator
├── tools/                         # Member 3 — Maps, Vision, OCR, Search, Collect
│   ├── maps.py
│   ├── vision.py
│   ├── ocr.py
│   ├── google_search.py
│   └── collect.py
├── pyproject.toml                 # UV-managed Python dependencies
├── uv.lock                        # Locked dependency versions
└── README.md                      # Documentation (this file)
```

---

## Quick Start & Installation

Requires **Python 3.11+** and [uv](https://docs.astral.sh/uv/) for dependency management.

### 1. Configure Gemini API key
```bash
cp .env.example .env
# Paste your key into .env:
# GEMINI_API_KEY=your_key_here
```
Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).

All AI features (text analysis, web search, photo forensics, OCR, commute) use **Gemini only**.
The `.env` file is gitignored and will never be committed.

### 2. Install Python dependencies and Playwright
From the project root (`YesBroker/`):
```bash
uv sync
uv run playwright install
```

### 3. Start the Next.js Premium Frontend
Navigate into the `frontend/` directory, install packages, and boot the React dev server:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The Next.js dashboard will be available at **[http://localhost:3000/](http://localhost:3000/)**.

### 4. Start the FastAPI Backend Server
Launch the server on port `8000` from the project root (`YesBroker/`):
```bash
uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

### 5. Access the Platform
Once both servers are running:
- Open your browser and navigate to **[http://localhost:3000/](http://localhost:3000/)** to interact with the premium React Glassmorphism Dashboard.
- The UI is fully connected to the live agentic backend at `http://127.0.0.1:8000`. Clicks on property cards will trigger the live Gemini Multi-Agent investigation pipeline in real-time!

---

## Live Demo Highlights

When presenting YesBroker, showcase these premium elements:
1. **Instant Search Feedback**: Select different BHK configs or budget caps. Watch the feed filter instantly, floating genuine properties to the top (🟢 SAFE) and sinking obvious scams (🔴 RISK) to the bottom.
2. **Radial Score Indicator**: Click a listing and watch the circular progress animate-draw up to the exact safety score (e.g. 18 / 100).
3. **The Live Terminal Emulator**: Narration of the multi-agent orchestration logs. It simulates typewriter trace statements line-by-line (`$ Planner: price flagged... escalating to Photo...`, `$ Arbiter: photo conflict detected... re-running...`). This provides an incredible interactive experience.
