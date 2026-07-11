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
├── .venv/                         # Pristine isolated Python environment
└── README.md                      # Documentation (this file)
```

---

## Quick Start & Installation

Ensure you have Python 3.9+ installed.

### 1. Set Up and Active Virtual Environment
From the root of the project directory (`YesBroker/`), run:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt  # Or pip install pydantic fastapi uvicorn
```

### 3. Run Pre-computation (Optional)
This compiles the raw listings database and runs all 5 agents through the Planner and Arbiter loops, saving the results in `backend/data/scores.json` for latency-free demo performance:
```bash
python backend/precompute.py
```

### 4. Start the FastAPI Server
Launch the server on port `8000`:
```bash
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

### 5. Access the Platform
Once running, simply:
- Open your browser and navigate to **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** (hosted directly by FastAPI).
- Or double-click **`frontend/index.html`** on your system (handles cross-origin requests seamlessly).

---

## Live Demo Highlights

When presenting YesBroker, showcase these premium elements:
1. **Instant Search Feedback**: Select different BHK configs or budget caps. Watch the feed filter instantly, floating genuine properties to the top (🟢 SAFE) and sinking obvious scams (🔴 RISK) to the bottom.
2. **Radial Score Indicator**: Click a listing and watch the circular progress animate-draw up to the exact safety score (e.g. 18 / 100).
3. **The Live Terminal Emulator**: Narration of the multi-agent orchestration logs. It simulates typewriter trace statements line-by-line (`$ Planner: price flagged... escalating to Photo...`, `$ Arbiter: photo conflict detected... re-running...`). This provides an incredible interactive experience.
