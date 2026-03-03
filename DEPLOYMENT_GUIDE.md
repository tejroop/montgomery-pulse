# MontgomeryPulse — Step-by-Step Deployment Guide

## Prerequisites

Before deploying, make sure you have:
- Node.js 18+ installed (`node --version`)
- Python 3.9+ installed (`python3 --version`)
- A GitHub account (for Vercel deployment)
- A Vercel account (free tier works fine) — sign up at vercel.com

---

## Step 1: Project Structure Overview

```
montgomery-pulse/
├── data/
│   ├── endpoints.json          # ArcGIS dataset catalog
│   ├── fetch_data.py           # Fetches raw data from ArcGIS APIs
│   ├── process_scores.py       # Computes scores → outputs JSON
│   └── raw/                    # Raw fetched data (not deployed)
├── frontend/
│   ├── public/
│   │   └── data/
│   │       ├── neighborhoods.json  # Pre-computed GeoJSON (deployed)
│   │       ├── facilities.json     # Facility points (deployed)
│   │       └── city_stats.json     # Aggregate stats (deployed)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── components/
│   │       ├── SafetyMap.tsx
│   │       ├── Sidebar.tsx
│   │       ├── DetailPanel.tsx
│   │       ├── RadarChart.tsx
│   │       ├── Legend.tsx
│   │       ├── FacilityMarkers.tsx
│   │       ├── InsightCard.tsx
│   │       └── ScoreDistribution.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
└── DEPLOYMENT_GUIDE.md
```

---

## Step 2: Refresh Data (Optional)

If you want the latest data from Montgomery's ArcGIS servers:

```bash
cd data/

# Install Python dependencies
pip install geopandas shapely requests

# Fetch all datasets from ArcGIS REST APIs
python3 fetch_data.py

# Process scores and generate JSON files
python3 process_scores.py
```

This outputs three files into `frontend/public/data/`:
- `neighborhoods.json` (~500KB) — 403 neighborhoods with scores
- `facilities.json` (~15KB) — fire/police, shelters, sirens, etc.
- `city_stats.json` (~5KB) — city-wide aggregates

If you skip this step, the existing pre-computed JSON files will be used.

---

## Step 3: Local Development

```bash
cd frontend/

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser. You should see the dark-themed map of Montgomery with the sidebar.

---

## Step 4: Production Build

```bash
cd frontend/

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files. You can preview it locally:

```bash
npx vite preview
```

---

## Step 5: Deploy to Vercel (Recommended)

### Option A: Vercel CLI (fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# From the frontend/ directory
cd frontend/

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Option B: GitHub + Vercel Dashboard

1. Push the entire `montgomery-pulse/` repo to GitHub:
   ```bash
   cd montgomery-pulse/
   git init
   git add -A
   git commit -m "MontgomeryPulse - Community Safety Lens"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/montgomery-pulse.git
   git push -u origin main
   ```

2. Go to vercel.com/new

3. Import your GitHub repository

4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Click "Deploy" — Vercel will build and give you a live URL.

### Option C: Netlify

1. Go to app.netlify.com
2. Drag the `frontend/dist/` folder onto the deploy area
3. Your site is live immediately

Or connect via GitHub:
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`

---

## Step 6: Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project → Settings → Domains
2. Add your custom domain (e.g., `montgomerypulse.com`)
3. Follow DNS instructions to point your domain

---

## Step 7: Environment Checklist Before Demo

Before presenting at the hackathon, verify:

- [ ] Site loads without errors (check browser console)
- [ ] Map renders with colored neighborhoods
- [ ] Clicking a neighborhood opens the detail panel
- [ ] Sidebar search and sort tabs work
- [ ] Facility markers toggle on/off correctly
- [ ] Radar chart and score bars display in detail panel
- [ ] AI Context Insights appear in detail panel
- [ ] Score distribution chart shows in sidebar
- [ ] Safety Desert badges pulse red
- [ ] Mobile/tablet responsive (resize browser window)
- [ ] Site loads under 3 seconds on production URL

---

## Architecture Notes for Judges

**Zero-backend design**: The entire app is static files — no server, no database, no API keys. All data processing happens offline in Python and outputs static JSON. The React frontend loads these JSON files and renders everything client-side.

This means:
- Free hosting on any static host (Vercel, Netlify, GitHub Pages)
- No server costs, no cold starts, no rate limits
- Works offline after initial load
- Can scale to millions of users with zero infrastructure

**Data pipeline** (run once):
```
ArcGIS REST APIs → fetch_data.py → raw JSON → process_scores.py → static GeoJSON
```

**Frontend stack**: React + TypeScript + Vite + Tailwind CSS + Leaflet + Recharts

---

## Troubleshooting

**Build fails with TypeScript errors**: Run `npx tsc --noEmit` to see specific errors.

**Map doesn't show**: Check that `public/data/neighborhoods.json` exists and is valid JSON. Also ensure Leaflet CSS is loaded (check `index.html` for the leaflet stylesheet link).

**Data looks wrong**: Re-run `python3 process_scores.py` to regenerate the scored JSON files.

**Vercel deploy fails**: Make sure `Root Directory` is set to `frontend` in project settings.

**Large bundle warning**: The 748KB JS bundle includes Leaflet + Recharts. This is acceptable for a hackathon demo. For production, consider dynamic imports with `React.lazy()`.
