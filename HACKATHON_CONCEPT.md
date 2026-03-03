# MontgomeryPulse — Community Safety Lens

## Challenge Stream
**Stream 4: Public Safety, Emergency Response & City Analytics**

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

### Tech Stack
Vite, React 18, TypeScript, Tailwind CSS, Leaflet, Recharts, Python (geopandas/shapely)

---

## Scoring Alignment

| Criterion | Points | How We Score |
|-----------|--------|-------------|
| **Consistency** | 15 | Uses 19/24 datasets. Every data source connects to a scoring dimension. Unified schema from raw ArcGIS to final GeoJSON. |
| **Quality & Design** | 10 | Dark-theme professional UI. Animated transitions. Radar charts. AI insight cards. Responsive. Custom tooltip styling. |
| **Originality & Impact** | 10 | "Safety Deserts" concept is novel — no existing Montgomery tool surfaces this. Rule-based AI insights without requiring LLM infrastructure. |
| **Commercialisation** | 5 | See below. |

---

## Commercialization Strategy

### Immediate Revenue Path: SaaS for Municipalities

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
- **5-minute deployment** — upload data, get a dashboard
- **Open data native** — designed for public datasets, no PII concerns

### Additional Revenue Streams
- **Consulting**: Custom dimension development ($5K-20K per engagement)
- **Data partnerships**: Real estate platforms (Zillow, Redfin) pay for neighborhood safety scores
- **Insurance**: Provide risk scoring to property insurers for premium calculation
- **Grant support**: Help cities write federal grants (FEMA, HUD) using data-driven safety gap evidence

---

## Demo Video Script (2 minutes)

**[0:00-0:15]** Hook: "What if you could see which Montgomery neighborhoods have the highest civic demand but the worst emergency coverage? MontgomeryPulse reveals these invisible gaps."

**[0:15-0:40]** Overview: Show the full map with the city header stats. Point out the color gradient from green (safe) to red (at-risk).

**[0:40-1:10]** Deep dive: Click a Safety Desert neighborhood. Show the detail panel — composite score, radar chart, AI insights explaining WHY it's at risk. Highlight the "Critical Emergency Coverage Gap" insight.

**[1:10-1:30]** Facilities: Toggle on fire/police stations and tornado shelters. Visually demonstrate the gap — Safety Deserts are far from emergency infrastructure.

**[1:30-1:50]** Sidebar: Show the search, sort by "Safety Deserts", demonstrate the score distribution chart. Quickly click between a safe and at-risk neighborhood to contrast.

**[1:50-2:00]** Close: "MontgomeryPulse turns 19 city datasets into actionable neighborhood intelligence. Built with zero backend — just data, code, and purpose."
