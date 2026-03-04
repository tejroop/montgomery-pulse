# MontgomeryPulse — Community Safety Lens with Explainable AI

## Challenge Stream
**Stream 4: Public Safety, Emergency Response & City Analytics**

### Core Differentiator: Explainable AI Safety Assistant
MontgomeryPulse includes a **3-layer Explainable AI Safety Assistant** that translates complex safety data into plain-language insights for citizens, city planners, and emergency management. Every score, rating, and recommendation can be questioned and answered transparently — no black boxes.

---

## Problem Statement

Montgomery residents and city officials lack a unified view of how safety resources, civic complaints, and emergency infrastructure overlap across neighborhoods. When 311 requests spike in one area while the nearest fire station is 5+ km away, that gap is invisible — until an emergency exposes it.

**Key insight**: The most vulnerable neighborhoods aren't just those with high crime or complaints. They're the ones where high civic demand meets poor emergency coverage — what we call **Safety Deserts**.

---

## Solution: MontgomeryPulse

A data-driven web application that transforms 19 City of Montgomery datasets into a **Neighborhood Safety Context Score** — a composite index across 4 dimensions that reveals where safety resources are most needed.

### The Four Dimensions (each scored 0-100)

1. **Complaint Density (30%)** — 311 requests + environmental nuisance per km2
2. **Environmental Risk (25%)** — Code violations density as a leading indicator
3. **Emergency Coverage (25%)** — Distance to fire/police, tornado shelters, weather sirens
4. **Resource Access (20%)** — Distance to pharmacies, community centers, schools, parks

### Safety Deserts

Neighborhoods that score high on complaint density AND have poor emergency coverage are flagged as **Safety Deserts** — the critical intersection of high demand and low infrastructure.

---

## Datasets Used (19 of 24)

| Dataset | Records | Role |
|---------|---------|------|
| 311 Service Requests | 207,127 | Primary complaint signal |
| Code Violations | 78,716 | Environmental risk indicator |
| Food Inspection Scores | 1,337 | Health infrastructure |
| Environmental Nuisance | 330 | Environmental risk |
| Fire & Police Stations | 33 | Emergency coverage |
| Tornado Shelters | 6 | Emergency coverage |
| Weather Sirens | 76 | Emergency coverage |
| Community Centers | 21 | Resource access |
| Education Facilities | 114 | Resource access |
| Pharmacy Locator | 33 | Resource access |
| Parks & Trails | 97 | Resource access |
| Zoning | 2,036 | Neighborhood boundaries |
| City Limit | 1 | Boundary |
| 911 Calls | 156 | City-wide emergency stats |
| Traffic KPI | 12 | Infrastructure metrics |
| Daily Population | 1,000 | Population context |
| Point of Interest | 53 | Landmark naming |
| Most Visited | 100 | Landmark naming |
| Traffic Engineering | 360 | Infrastructure context |

---

## Architecture

**Zero-backend design** — no server, no database, no API keys.

```
ArcGIS REST APIs → Python Pipeline → Static JSON → React Frontend
```

### Data Pipeline (Python)
- Fetches 19 datasets from public ArcGIS endpoints with pagination
- Creates 403 neighborhoods by grid-clustering 2,036 zoning polygons
- Runs spatial joins (290K+ points) using shapely spatial index
- Computes 4-dimension scores with percentile normalization
- Outputs 3 static JSON files (<600KB total)

### Frontend (React + TypeScript)
- Leaflet dark-theme map with color-coded neighborhood polygons
- Interactive sidebar with search, sort, and score distribution chart
- Detail panel with radar chart, score bars, distance metrics
- AI-style context insights (rule-based, no LLM needed)
- Facility overlay with 7 toggleable categories (379 points)
- City-wide stats header bar with 911, 311, and infrastructure KPIs

### Explainable AI Safety Assistant (3 Layers)

**Layer 1: Deep Analysis in Detail Panel** — When you click any neighborhood, an "AI: Explain This Neighborhood" button reveals three contextual cards: Why This Rating (traces the score to specific dimensions), Recommended Action (prioritized interventions based on risk level), and Emergency & Resource Access (equity analysis of distances to essential services). Works alongside the existing AI Context Insight cards.

**Layer 2: Chat Panel Overlay** — A floating emerald-themed chat assistant on the map page. Users ask natural-language questions like "Why is this area rated high-risk?" or "Which neighborhoods are Safety Deserts?" and receive data-backed explanations. Context-aware: selecting a neighborhood on the map updates the assistant's context automatically.

**Layer 3: Full-Page Safety Explorer** — A dedicated assistant page with a Safety Desert browser sidebar, city statistics dashboard, and full conversational interface. Click any at-risk neighborhood to auto-generate an explanation, then navigate directly to the map for spatial context.

**How it works**: Rule-based Natural Language Generation (NLG) — no external LLM API required. Every explanation is deterministic, auditable, and traces to specific data points. Topics covered: safety score analysis, recommended actions, emergency access equity, city-wide overview, Safety Desert identification, scoring methodology, resident guidance, and data sources.

### Tech Stack
Vite, React 18, TypeScript, Tailwind CSS, Leaflet, Recharts, Python (geopandas/shapely)

---

## Scoring Alignment (35 total points)

### 1. Relevance to Challenge (10 pts)

MontgomeryPulse directly targets **Stream 4: Public Safety, Emergency Response & City Analytics**. Every feature maps to this challenge:

- **Public Safety**: Composite Safety Context Score ranks 403 neighborhoods by risk level, using 311 complaints, code violations, and environmental nuisance as primary signals.
- **Emergency Response**: Emergency Coverage dimension measures actual distance gaps to fire/police stations, tornado shelters, and weather sirens. The "Safety Desert" concept identifies the 20 neighborhoods where emergencies are most likely AND response times are longest.
- **City Analytics**: City-wide header bar aggregates 312K+ 911 calls, traffic infrastructure KPIs, and daily population data. Score distribution chart gives planners an at-a-glance city health snapshot.

**Data coverage**: Uses 19 of 24 available Montgomery datasets — every dataset is connected to a specific scoring dimension, not just displayed for show.

### 2. Quality & Design (10 pts)

- Professional dark-theme UI designed for data-heavy civic applications
- Smooth animated transitions (slide-in detail panel, fly-to map zoom)
- Radar chart visualizing all 4 dimensions simultaneously
- AI-powered context insight cards that explain WHY a neighborhood is at risk in plain language
- Color-coded score gradient (green → yellow → orange → red) consistent across map, sidebar, and detail panel
- Interactive facility overlay with 7 toggleable categories and 379 map markers
- Score distribution bar chart in sidebar for city-wide pattern recognition
- Custom-styled Leaflet tooltips matching the dark theme
- Responsive layout for tablet and desktop viewing
- Loading states with branded animation

### 3. Originality (5 pts)

- **"Safety Deserts" concept** — No existing Montgomery tool reveals neighborhoods where high civic demand intersects with poor emergency infrastructure. This is an original analytical framework.
- **Explainable AI Safety Assistant** — A 3-layer AI system (deep analysis cards + chat overlay + full-page explorer) that translates raw safety data into plain-language insights. Unlike opaque AI dashboards, every explanation is deterministic and auditable — true explainability. Citizens can ask "Why is my neighborhood rated this way?" and get an answer that traces to specific data.
- **Neighborhood-level scoring from zoning data** — Montgomery doesn't publish neighborhood boundaries. We created 403 neighborhoods by grid-clustering 2,036 zoning polygons, then named them using 25 known Montgomery area names and 100+ landmarks from the Most Visited and POI datasets.
- **Zero-backend architecture** — The entire app is static files. No server, no database, no cold starts. Deployable for free on any static host.

### 4. Social Impact (5 pts)

MontgomeryPulse addresses **equity in public safety** — one of the most pressing challenges facing American cities.

**The problem it exposes**: Safety resources in Montgomery are not distributed equally. Our analysis reveals that 20 neighborhoods — home to thousands of residents — qualify as Safety Deserts: areas where civic complaints are 30%+ above the median while the nearest fire or police station is significantly farther than average.

**Who benefits**:
- **Residents in underserved neighborhoods** gain a data-backed tool to advocate for better emergency coverage. Instead of anecdotal complaints, they can point to composite scores and distance metrics that quantify their vulnerability.
- **City council members** can use neighborhood-level scores to prioritize budget allocation for new fire stations, tornado shelters, or community centers where the need is objectively greatest.
- **Community organizers** can identify which Safety Deserts also lack pharmacies, parks, and schools — revealing compounding resource gaps that affect daily quality of life, not just emergencies.
- **Emergency planners** can visualize response distance gaps and plan new infrastructure to reduce them.

**Equity lens**: By combining complaint density with coverage gaps, MontgomeryPulse ensures that neighborhoods aren't just ranked by "how many problems they have" — it highlights where people are reporting problems AND where the city's safety net has the biggest holes. This reframes public safety from a policing question to an infrastructure equity question.

**Transparency and access**: The tool uses 100% public data, requires no login, and costs nothing to access. Any Montgomery resident can see their neighborhood's score and understand why it was calculated that way.

**Explainable AI & Equity**: The AI Safety Assistant democratizes data access. A resident with no technical background can ask "Why is my neighborhood a Safety Desert?" and get the same quality analysis a city planner would. This levels the information playing field for civic advocacy.

### 5. Commercial Potential (5 pts)

#### Immediate Revenue Path: SaaS for Municipalities

**MontgomeryPulse as a Service** — a white-label civic safety analytics platform that any city can deploy with their own ArcGIS data.

#### Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Community** (Free) | $0 | Public dashboard, 4 dimensions, basic map |
| **City Pro** | $2,500/mo | Custom dimensions, priority alerts, API access, branded deployment |
| **Enterprise** | $8,000/mo | Multi-department dashboards, historical trends, predictive scoring, SSO, dedicated support |

#### Market Size
- 19,502 incorporated municipalities in the US
- 274 cities with population 100K+ (primary target)
- $672M estimated TAM (274 cities x $200K annual average contract)

#### Go-to-Market
1. **Phase 1 (Months 1-3)**: Deploy for Montgomery as a case study. Partner with GenAI Academy for distribution.
2. **Phase 2 (Months 4-6)**: Target Alabama League of Municipalities (463 members). Offer pilot pricing.
3. **Phase 3 (Months 7-12)**: Expand to regional markets. Integrate with Esri marketplace as an ArcGIS add-on.

#### Revenue Projections
- Year 1: 5 city contracts x $30K avg = **$150K ARR**
- Year 2: 25 cities x $50K avg = **$1.25M ARR**
- Year 3: 75 cities x $60K avg = **$4.5M ARR**

#### Competitive Advantage
- **Zero infrastructure cost** — static files, no servers to maintain
- **Works with existing ArcGIS investments** — cities don't need new data infrastructure
- **Explainable AI** — cities can justify resource allocation decisions because every recommendation is auditable and traceable to source data
- **Consumer-grade AI assistant** makes government-grade safety data accessible to every resident
- **5-minute deployment** — upload data, get a dashboard
- **Open data native** — designed for public datasets, no PII concerns

#### Additional Revenue Streams
- **Consulting**: Custom dimension development ($5K-20K per engagement)
- **Data partnerships**: Real estate platforms (Zillow, Redfin) pay for neighborhood safety scores
- **Insurance**: Provide risk scoring to property insurers for premium calculation
- **Grant support**: Help cities write federal grants (FEMA, HUD) using data-driven safety gap evidence

---

## Demo Video Script (2 minutes)

**[0:00-0:10]** Hook: "What if an AI could explain exactly why your neighborhood is underserved — and what to do about it? MontgomeryPulse combines safety analytics with an Explainable AI assistant."

**[0:10-0:25]** Overview: Show the full map with city header stats. "We processed 19 city datasets — over 290,000 data points — into a safety score for every neighborhood."

**[0:25-0:45]** Safety Desert: Click a red Safety Desert neighborhood. Show the detail panel with radar chart and AI insights. "This neighborhood has 3,000+ service requests but the nearest fire station is 5 km away. That's a Safety Desert."

**[0:45-1:05]** AI Deep Analysis: Click "AI: Explain This Neighborhood" in the detail panel. Show three insight cards: Why This Rating, Recommended Action, Emergency Access. "The AI traces every rating back to real data — no black boxes."

**[1:05-1:25]** Chat Panel: Click the AI chat bubble. Ask "Which neighborhoods are Safety Deserts?" Show the response listing the most vulnerable areas with explanations. "Citizens can ask natural-language questions and get data-backed answers."

**[1:25-1:45]** Full Assistant: Click "Safety Assistant" in top-right. Show the full-page explorer with neighborhood browser and conversational interface. Click a critical area to auto-generate an explanation. "A dedicated AI page makes all 403 neighborhoods explorable through conversation."

**[1:45-2:00]** Close: "MontgomeryPulse — Explainable AI for community safety. Every score traceable, every recommendation auditable, every citizen empowered. Thank you."
