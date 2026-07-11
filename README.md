# YesBroker (GharCheck)

**GharCheck** is an AI-powered rental trust verification platform for Bangalore. It helps home seekers spot scams, bait pricing, stolen photos, and exaggerated commute claims before they book a visit.

Listings are scraped from live portals (or loaded from static demo data), analyzed by **five specialist agents**, ranked by trust score, and presented in a Next.js dashboard with live investigation traces, photo forensics, commute maps, and shareable reports.

---

## What it does

1. **Search** — Enter area, budget, BHK, and office location. Click **Find Safe Homes** to start (nothing runs automatically on login).
2. **Analyze** — The backend scrapes listings and runs multi-agent trust analysis on the top matches. Progress streams live in the right panel.
3. **Review** — Click any listing to open its cached trust report instantly (no re-analysis).
4. **Share** — Generate a public link or QR code for a completed report.

---

## The five verification agents

| Agent | What it checks |
|-------|----------------|
| **Photo Forensics** | Stolen photos, model apartments, duplicates listed in other cities |
| **Price Sanity** | Rent vs regional medians; bait pricing |
| **Commute Truth** | Peak-hour transit time to your office vs listing claims |
| **Text Tells** | Scam language and urgency patterns in descriptions |
| **Web Recon** | Broker reputation, phone blacklists, cross-portal duplicates |

Agents are coordinated by `backend/orchestrator.py` (planner → parallel specialists → reflection) and produce a **Trust Report** with score, verdict, red flags, evidence, and agent reasoning.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Backend | Python 3.11+, FastAPI, Pydantic, Playwright |
| AI | Google Gemini (`google-genai`) |
| Frontend | Next.js 16, React 19, Tailwind, Framer Motion, Leaflet |
| Package manager | [uv](https://docs.astral.sh/uv/) (Python), npm (frontend) |

---

## Prerequisites

- **Python 3.11+**
- **[uv](https://docs.astral.sh/uv/)**
- **Node.js 18+** (for the Next.js frontend)
- **Gemini API key** — [Get one here](https://aistudio.google.com/apikey)

---

## Quick start

### 1. Clone and configure environment

From the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your Gemini key:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-pro-preview
```

Optional backend flags (defaults shown):

```env
USE_LIVE_LISTINGS=true          # Playwright scrape; false = static listings.json only
INVESTIGATE_ON_SEARCH=true      # Run full agent pipeline during search
INVESTIGATE_PARALLEL=3          # Concurrent investigations during search
PUBLIC_APP_URL=http://localhost:3000   # Base URL for share links
```

### 2. Install Python dependencies and Playwright

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

`frontend/.env.local` should point at the backend:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 4. Start both servers (two terminals)

**Terminal 1 — Backend (port 8000):**

```bash
uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend && npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

### 5. Use the app

1. Log in on the auth screen.
2. Set search preferences (area, budget, BHK, office).
3. Click **Find Safe Homes** — analysis starts only on this click.
4. Wait for listings to appear (sorted by trust score).
5. Click a listing to view its full trust report.

---

## Project structure

```
YesBroker/
├── backend/
│   ├── agents/              # price, text, photo, commute, web agents
│   ├── data/
│   │   ├── listings.json    # Static demo listings (L_*, SCAM_*)
│   │   ├── scores.json      # Precomputed trust reports (optional fast path)
│   │   └── shares.json      # Persisted share snapshots (gitignored)
│   ├── app.py               # FastAPI routes
│   ├── orchestrator.py      # Multi-agent planner + arbiter
│   ├── scoring.py           # Trust score computation
│   ├── listing_store.py     # Live listing + report cache (per search session)
│   ├── share_store.py       # Shareable report tokens
│   ├── media.py             # Photo URL resolver + /media serving
│   ├── trace.py             # Live SSE trace events
│   └── precompute.py        # Batch precompute → scores.json
├── frontend/
│   ├── app/                 # Next.js pages (dashboard, public /report/[token])
│   ├── components/
│   │   ├── auth/            # Login screen
│   │   ├── dashboard/       # Search form, listings, trust panel
│   │   └── trust-report/    # Score gauge, photo forensics, commute map, share
│   ├── lib/api.ts           # Backend API client (search stream, reports, share)
│   └── public/demo/         # Demo photo assets for forensics UI
├── tools/
│   ├── collect.py           # Playwright live listing scraper + detail screenshots
│   ├── maps.py              # Bangalore geocoding + commute estimates
│   ├── vision.py            # Image duplicate detection
│   ├── gemini_client.py     # Gemini API wrapper
│   └── README.md            # Tool-level diagnostics
├── pyproject.toml
└── README.md
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + Gemini config status |
| `POST` | `/search` | Filter, analyze, and rank listings (JSON) |
| `GET` | `/search/stream` | Same as search, with SSE live agent trace |
| `GET` | `/report/{listing_id}` | Cached trust report from last search |
| `POST` | `/investigate` | Run live investigation (JSON) |
| `GET` | `/investigate/stream` | Investigation with SSE trace (uses cache if available) |
| `GET` | `/media/{path}` | Serve listing photos and demo assets |
| `POST` | `/share/{listing_id}` | Create shareable report link |
| `GET` | `/share/{token}` | Fetch shared report snapshot |

**Search stream query params:** `area`, `pincode`, `max_rent`, `bhk`, `office`, `power_backup`, `non_veg`

---

## Frontend features

- **Dashboard** — Search form, ranked listings, trust report panel
- **Live trace** — Color-coded agent activity during search (SSE)
- **Photo Forensics** — Side-by-side source photo vs matched duplicates
- **Commute Truth Map** — Leaflet map with claimed vs estimated commute
- **Share Report** — Copy link, QR code, public page at `/report/[token]`
- **Trust Report** — Score gauge, verdict, red flags, agent pipeline, broker checklist

---

## Demo listing IDs

Static listings in `backend/data/listings.json` for testing without live scrape:

| ID | Type | Notes |
|----|------|-------|
| `SCAM_001` | Scam | "Owner going abroad" bait listing |
| `SCAM_002` | Scam | Urgent token payment |
| `L_100` | Safe | Verified Indiranagar 2 BHK |

Default search prefs: `area=Indiranagar`, `pincode=560038`, `bhk=2`, `max_rent=35000`.

**CLI trace demo:**

```bash
uv run python backend/trace_demo.py SCAM_001
```

---

## Tests

```bash
uv run pytest backend/tests -q
```

Covers orchestration, agents, production upgrades, and visual/share features.

---

## Optional: precompute scores

Regenerate `backend/data/scores.json` for faster ranking without live Gemini calls on every search:

```bash
uv run python backend/precompute.py
```

With live Gemini this can take 1–2 hours. Offline fallbacks are much faster.

---

## Scraping and images

Live search uses Playwright (`tools/collect.py`) to scrape NoBroker and capture detail-page screenshots. Images are saved under `frontend/images/` (gitignored) and served via `/media/`.

If scraping fails, the app falls back to `backend/data/listings.json`.

---

## Known limitations

- **Search is slow** — Batch investigation + detail screenshots run per listing during search.
- **Maps** — Commute map coordinates appear only after a fresh investigation; stale `scores.json` entries may lack lat/lng.
- **Static listing photos** — Some `L_*` demo entries reference image files that are not bundled; live scraped listings use PNG screenshots instead.
- **Share links** — Stored locally in `backend/data/shares.json`; not suitable for production without a real database.

---

## Legacy UI

An older static HTML UI lives in `frontend/legacy/`. The primary interface is the Next.js app on port 3000.

---

## License

Hackathon project — see repository for details.
