# YesBroker (GharCheck) - Multi-Agent Trust Verification

Welcome to **YesBroker (GharCheck)**, a secure rental search engine for Bangalore (Indiranagar and surrounding areas) built to protect home seekers from rental fraud and bait-and-switch listings.

YesBroker passes rental listings through a pipeline of **5 specialized verification agents** (coordinated via `orchestrator.py`) to calculate a final trust score and output a comprehensive Trust Report complete with Red Flags, broker checklists, and a live agentic investigation trace.

---

## Technical Architecture & Core Elements

### The 5 Specialized Agents
1. **Photo-Forensics**: Flags stolen photos, model apartments, and duplicates listed in other cities.
2. **Price-Sanity**: Compares rent against regional medians to flag bait pricing.
3. **Commute-Truth**: Calculates real peak-hour transit times to your target office to detect exaggerated proximity claims.
4. **Text-Tells**: Analyzes rental descriptions for high-risk scam language.
5. **Web-Recon**: Searches the web for broker reputation, phone blacklists, and cross-portal duplicates.

---

## File Structure

```
YesBroker/
├── backend/
│   ├── agents/           # Price, Text, Photo, Commute, Web agents
│   ├── data/
│   │   ├── listings.json # L_100–L_199, SCAM_001–SCAM_012
│   │   └── scores.json   # Precomputed trust reports + search summaries
│   ├── app.py            # FastAPI API (port 8000)
│   ├── orchestrator.py   # Multi-agent planner + arbiter logic
│   ├── scoring.py        # Trust score computation
│   ├── schema.py         # Pydantic models
│   └── precompute.py     # Batch investigation → scores.json
├── frontend/
│   ├── app/              # Next.js app (port 3000) — primary UI
│   ├── components/       # Dashboard, trust report, search form
│   ├── lib/api.ts        # Backend API client
│   └── legacy/           # Old static HTML UI (optional)
├── tools/                # Maps, Vision, OCR, Search, Gemini client
├── pyproject.toml
└── README.md
```

---

## Quick Start

Requires **Python 3.11+**, [uv](https://docs.astral.sh/uv/), and **Node.js** for the Next.js frontend.

### 1. Configure Gemini API key

```bash
cp .env.example .env
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-3.1-pro-preview
```

### 2. Install Python dependencies and Playwright

From the project root (`YesBroker/`):

```bash
uv sync
uv run playwright install
```

### 3. Install frontend dependencies

```bash
cd frontend
cp .env.example .env.local
npm install --legacy-peer-deps
```

### 4. Start both servers (two terminals)

**Terminal 1 — Backend API:**
```bash
uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Next.js UI:**
```bash
cd frontend && npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

The Next.js app calls the backend at `http://127.0.0.1:8000` (configured in `frontend/.env.local`).

### 5. Pre-compute scores (optional)

Regenerates `backend/data/scores.json` for fast search ranking:

```bash
uv run python backend/precompute.py
```

This runs all agents per listing. With live Gemini it can take 1–2 hours; offline fallbacks are faster.

### 6. CLI trace demo

```bash
uv run python backend/trace_demo.py SCAM_001
```

### 7. Run tests

```bash
uv run pytest backend/tests -q
```

---

## Demo listing IDs

| ID | Type | Notes |
|----|------|-------|
| `SCAM_001` | Scam | "Owner going abroad" bait listing |
| `SCAM_002` | Scam | Urgent token payment |
| `L_100` | Safe | Verified Indiranagar 2BHK |

Search defaults: `area=Indiranagar`, `pincode=560038`, `bhk=2`, `max_rent=35000`.

---

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health + Gemini status |
| `POST` | `/search` | Filter and rank listings |
| `POST` | `/investigate` | Live investigation (JSON) |
| `GET` | `/investigate/stream?id=...&office=...` | SSE live trace + report |

---

## Legacy static UI

The original HTML/JS UI is in `frontend/legacy/`. It can be served separately if needed; the primary UI is Next.js on port 3000.
