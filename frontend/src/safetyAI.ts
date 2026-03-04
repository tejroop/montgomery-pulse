/**
 * MontgomeryPulse — Explainable AI Safety Assistant Engine
 * Rule-based Natural Language Generation (NLG) for community safety data.
 * Fully deterministic and auditable — every insight traces to real data.
 */

import type { NeighborhoodFeature, NeighborhoodProperties, NeighborhoodCollection } from './types';

/* ──────────────────────────────────────────────
   1. NEIGHBORHOOD-LEVEL EXPLANATIONS
   ────────────────────────────────────────────── */

export function explainSafetyScore(p: NeighborhoodProperties): string {
  const dims = [
    { name: 'complaint density', score: p.complaint_density_score },
    { name: 'environmental risk', score: p.environmental_risk_score },
    { name: 'emergency coverage gap', score: p.emergency_coverage_score },
    { name: 'resource access gap', score: p.resource_access_score },
  ].sort((a, b) => b.score - a.score);

  const parts: string[] = [];
  const top = dims[0];
  const second = dims[1];

  if (top.score >= 60) {
    parts.push(`The primary safety concern here is severe ${top.name} (${top.score.toFixed(0)}/100)`);
  } else if (top.score >= 40) {
    parts.push(`The leading safety factor is elevated ${top.name} (${top.score.toFixed(0)}/100)`);
  } else {
    parts.push(`The highest dimension is ${top.name} at ${top.score.toFixed(0)}/100, which is relatively manageable`);
  }

  if (second.score >= 40) {
    parts.push(`compounded by high ${second.name} (${second.score.toFixed(0)}/100)`);
  }

  // Safety desert context
  if (p.is_safety_desert) {
    parts.push(`This neighborhood is classified as a Safety Desert — it scores high across multiple dimensions while being far from emergency and community resources`);
  }

  // Incident context
  const totalIncidents = p.count_311 + p.count_code_violations + p.count_env_nuisance;
  if (totalIncidents > 5000) {
    parts.push(`With ${totalIncidents.toLocaleString()} total recorded incidents, this is one of the highest-activity areas in Montgomery`);
  } else if (totalIncidents > 1000) {
    parts.push(`There are ${totalIncidents.toLocaleString()} incidents on record`);
  }

  // Trend
  if (p.trend === 'worsening') {
    parts.push(`The trend is worsening, meaning complaint volumes exceed the city median and conditions may be deteriorating`);
  } else if (p.trend === 'improving') {
    parts.push(`Encouragingly, the trend is improving — complaint volumes are below the city median`);
  }

  return parts.join('. ') + '.';
}

export function explainSafetyAction(p: NeighborhoodProperties): string {
  const actions: string[] = [];

  if (p.composite_score >= 65) {
    actions.push('Immediate, multi-dimensional intervention recommended');
    if (p.emergency_coverage_score > 50) {
      actions.push('Expanding emergency service coverage should be the top priority — residents here face dangerously long response times');
    }
    if (p.complaint_density_score > 50) {
      actions.push('Increased 311 response capacity and proactive code enforcement would address the complaint backlog');
    }
    if (p.resource_access_score > 50) {
      actions.push('Investing in a nearby pharmacy, community center, or mobile health unit would reduce the resource access gap');
    }
  } else if (p.composite_score >= 35) {
    actions.push('This neighborhood is at a tipping point — targeted investment now could prevent escalation to critical status');
    if (p.trend === 'worsening') {
      actions.push('The worsening trend makes early intervention especially valuable');
    }
  } else {
    actions.push('This area has a manageable safety profile');
    if (p.composite_score > 15) {
      actions.push('Continued monitoring recommended to catch early warning signs');
    } else {
      actions.push('Current resource levels appear adequate — this neighborhood can serve as a model for equitable service distribution');
    }
  }

  return actions.join('. ') + '.';
}

export function explainEmergencyAccess(p: NeighborhoodProperties): string {
  const insights: string[] = [];

  if (p.dist_fire_police_km > 4) {
    insights.push(`Fire/police stations are ${p.dist_fire_police_km.toFixed(1)} km away — in an emergency, this could mean 8-12 minute response times instead of the recommended 4-6 minutes`);
  } else if (p.dist_fire_police_km > 2) {
    insights.push(`Emergency services are ${p.dist_fire_police_km.toFixed(1)} km away, which is above the optimal 2 km threshold`);
  } else {
    insights.push(`Emergency services are within ${p.dist_fire_police_km.toFixed(1)} km — good coverage`);
  }

  if (p.dist_tornado_shelter_km > 8) {
    insights.push(`The nearest tornado shelter is ${p.dist_tornado_shelter_km.toFixed(1)} km away — effectively no shelter access during severe weather`);
  }

  if (p.dist_weather_siren_km > 3) {
    insights.push(`Weather sirens are ${p.dist_weather_siren_km.toFixed(1)} km away, meaning residents may not hear severe weather warnings`);
  }

  if (p.dist_pharmacy_km > 3) {
    insights.push(`Pharmacy access requires traveling ${p.dist_pharmacy_km.toFixed(1)} km — a significant healthcare barrier`);
  }

  if (p.dist_park_km > 1.5) {
    insights.push(`Parks are ${p.dist_park_km.toFixed(1)} km away, limiting recreational and community gathering options`);
  }

  if (p.dist_school_km > 2) {
    insights.push(`Schools are ${p.dist_school_km.toFixed(1)} km away, creating transportation challenges for families`);
  }

  if (insights.length === 0) {
    insights.push('This neighborhood has good proximity to emergency and community resources across all categories');
  }

  return insights.join('. ') + '.';
}

/* ──────────────────────────────────────────────
   2. CITY-WIDE EXPLANATIONS
   ────────────────────────────────────────────── */

export function explainCityOverview(data: NeighborhoodCollection): string {
  const features = data.features;
  const total = features.length;
  const deserts = features.filter(f => f.properties.is_safety_desert).length;
  const scores = features.map(f => f.properties.composite_score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const critical = features.filter(f => f.properties.composite_score >= 65).length;
  const high = features.filter(f => f.properties.composite_score >= 50 && f.properties.composite_score < 65).length;
  const stable = features.filter(f => f.properties.composite_score < 20).length;
  const worsening = features.filter(f => f.properties.trend === 'worsening').length;
  const total311 = features.reduce((s, f) => s + f.properties.count_311, 0);

  const parts: string[] = [];
  parts.push(`MontgomeryPulse analyzes ${total} neighborhoods across the city with ${total311.toLocaleString()} total 311 service requests`);
  parts.push(`The city-wide average safety score is ${avg.toFixed(1)}/100`);

  if (deserts > 0) {
    parts.push(`${deserts} neighborhoods are classified as Safety Deserts — areas with high risk scores and limited access to emergency and community resources`);
  }

  parts.push(`${critical} neighborhoods are in critical condition (65+), ${high} are high-risk (50-65), and ${stable} are stable (under 20)`);

  if (worsening > 0) {
    parts.push(`${worsening} neighborhoods show a worsening trend, indicating increasing complaint volumes`);
  }

  return parts.join('. ') + '.';
}

/* ──────────────────────────────────────────────
   3. CHAT Q&A ENGINE
   ────────────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface SafetyChatContext {
  data: NeighborhoodCollection | null;
  selectedNeighborhood: NeighborhoodFeature | null;
}

export function getSuggestedQuestions(ctx: SafetyChatContext): string[] {
  const base = [
    "What's the overall safety of Montgomery?",
    "Which neighborhoods are Safety Deserts?",
    "Where are the safest areas?",
    "Which areas need the most urgent help?",
    "How does the scoring work?",
    "What can residents do to improve safety?",
    "Tell me about emergency coverage gaps",
    "What are the data sources?",
  ];

  if (ctx.selectedNeighborhood) {
    const name = ctx.selectedNeighborhood.properties.name;
    return [
      `Why is ${name} rated this way?`,
      `What should be done about ${name}?`,
      ...base.slice(0, 4),
    ];
  }
  return base.slice(0, 6);
}

export function answerSafetyQuestion(query: string, ctx: SafetyChatContext): string {
  const q = query.toLowerCase().trim();

  // Selected neighborhood questions
  if (ctx.selectedNeighborhood) {
    const p = ctx.selectedNeighborhood.properties;
    if (q.includes('why') && (q.includes('rated') || q.includes('risk') || q.includes('score') || q.includes(p.name.toLowerCase()))) {
      return explainSafetyScore(p);
    }
    if (q.includes('what') && (q.includes('do') || q.includes('action') || q.includes('done') || q.includes('fix') || q.includes('help') || q.includes('should'))) {
      return explainSafetyAction(p);
    }
    if (q.includes('emergency') || q.includes('coverage') || q.includes('access') || q.includes('resource') || q.includes('distance')) {
      return explainEmergencyAccess(p);
    }
  }

  // City overview
  if (q.includes('overall') || q.includes('health') || q.includes('montgomery') || q.includes('city') || q.includes('summary') || q.includes('safety of')) {
    if (ctx.data) return explainCityOverview(ctx.data);
    return "City data is still loading.";
  }

  // Safety deserts
  if (q.includes('desert') || q.includes('worst') || q.includes('danger')) {
    if (!ctx.data) return "Data is still loading.";
    const deserts = ctx.data.features
      .filter(f => f.properties.is_safety_desert)
      .sort((a, b) => b.properties.composite_score - a.properties.composite_score)
      .slice(0, 6);
    if (deserts.length === 0) return "No Safety Deserts currently identified.";
    const list = deserts.map((f, i) =>
      `${i + 1}. ${f.properties.name} — score ${f.properties.composite_score.toFixed(0)}, ${f.properties.trend} trend`
    ).join('\n');
    return `Safety Deserts are neighborhoods with high risk scores AND limited access to emergency/community resources. These are Montgomery's most underserved areas:\n\n${list}\n\nThese neighborhoods need multi-dimensional intervention: expanded emergency coverage, increased 311 capacity, and investment in community anchor institutions.`;
  }

  // Safest areas
  if (q.includes('safe') || q.includes('stable') || q.includes('best') || q.includes('good')) {
    if (!ctx.data) return "Data is still loading.";
    const safe = ctx.data.features
      .filter(f => f.properties.composite_score < 20)
      .sort((a, b) => a.properties.composite_score - b.properties.composite_score)
      .slice(0, 6);
    if (safe.length === 0) return "No neighborhoods currently meet the stable threshold.";
    const list = safe.map((f, i) =>
      `${i + 1}. ${f.properties.name} — score ${f.properties.composite_score.toFixed(0)}`
    ).join('\n');
    return `The safest neighborhoods in Montgomery have strong emergency coverage, low complaint volumes, and good access to community resources:\n\n${list}\n\nThese areas demonstrate what equitable service distribution looks like — they can serve as models for improvement elsewhere.`;
  }

  // Urgent areas
  if (q.includes('urgent') || q.includes('critical') || q.includes('priority') || q.includes('attention')) {
    if (!ctx.data) return "Data is still loading.";
    const urgent = ctx.data.features
      .filter(f => f.properties.composite_score >= 50)
      .sort((a, b) => b.properties.composite_score - a.properties.composite_score)
      .slice(0, 6);
    if (urgent.length === 0) return "No neighborhoods currently meet the urgent threshold.";
    const list = urgent.map((f, i) =>
      `${i + 1}. ${f.properties.name} — score ${f.properties.composite_score.toFixed(0)}, ${f.properties.trend}${f.properties.is_safety_desert ? ' [SAFETY DESERT]' : ''}`
    ).join('\n');
    return `The most urgent neighborhoods requiring intervention:\n\n${list}\n\nPrioritize neighborhoods marked as Safety Deserts — they have the highest risk AND the fewest resources.`;
  }

  // How scoring works
  if (q.includes('scoring') || q.includes('how') && (q.includes('work') || q.includes('calculate') || q.includes('measure'))) {
    return `MontgomeryPulse uses a composite safety scoring model with four dimensions:\n\n1. Complaint Density (25%) — Volume of 311 service requests and code violations per square kilometer. Higher density signals more active community concerns.\n\n2. Environmental Risk (25%) — Environmental nuisance reports, food safety violations, and physical deterioration indicators.\n\n3. Emergency Coverage Gap (25%) — Distance to fire/police stations, tornado shelters, and weather sirens. Farther = higher risk score.\n\n4. Resource Access Gap (25%) — Distance to community centers, pharmacies, schools, and parks. Measures how far residents must travel for essential services.\n\nEach dimension scores 0-100. The composite score is a weighted average. Neighborhoods with scores above 50 across multiple dimensions AND far from resources are flagged as Safety Deserts.\n\nEvery score is traceable — ask about any neighborhood and I'll break down exactly which factors drive its rating.`;
  }

  // Emergency coverage
  if (q.includes('emergency') || q.includes('coverage') || q.includes('fire') || q.includes('police') || q.includes('tornado') || q.includes('siren')) {
    return `Emergency coverage in Montgomery varies dramatically by location. The city has:\n\n• 33 fire & police stations\n• 6 tornado shelters (severely limited)\n• 76 weather sirens\n\nKey gaps: With only 6 tornado shelters serving the entire city, some neighborhoods are 10+ km from the nearest shelter — effectively zero access during severe weather. Fire/police coverage is better but still uneven: some blocks are within 1 km of a station while others are 5+ km away.\n\nThe Emergency Coverage Gap dimension captures these disparities. Neighborhoods scoring high on this dimension face longer response times and less severe weather protection.\n\nClick any neighborhood on the map to see its specific distances to emergency resources.`;
  }

  // Resident action
  if (q.includes('resident') || q.includes('citizen') || q.includes('can i') || q.includes('can we') || q.includes('community') || q.includes('improve safety')) {
    return `Residents can make a real difference in neighborhood safety:\n\n1. Report issues through 311 — Every service request feeds into the data that helps the city prioritize resources. Underreporting makes your neighborhood invisible to planners.\n\n2. Attend community safety meetings — Advocate for resources in your area. Use MontgomeryPulse data to show exactly where gaps exist.\n\n3. Organize neighborhood watch programs — Community-level organization reduces environmental risk and complaint density.\n\n4. Support local anchor institutions — Schools, community centers, and local businesses are what keeps neighborhoods stable. Advocate for their protection.\n\n5. Know your emergency resources — Use this tool to learn how far you are from fire stations, tornado shelters, and weather sirens. Plan accordingly.\n\n6. Share the data — Show this dashboard to your city council representative. Data-backed advocacy is more effective than anecdotes.`;
  }

  // Data sources
  if (q.includes('data') || q.includes('source') || q.includes('where') && q.includes('from')) {
    return `MontgomeryPulse is built on 19 open datasets from Montgomery, Alabama's ArcGIS REST APIs:\n\n• 311 Service Requests (207,127 records)\n• Code Enforcement Violations (78,716 records)\n• Environmental Nuisance Reports\n• Food Inspection Scores\n• Fire & Police Stations\n• Tornado Shelters\n• Weather Sirens\n• Community Centers\n• Pharmacies\n• Schools & Education Facilities\n• Parks & Trails\n• Points of Interest\n• Most Visited Places\n• Zoning Parcels\n• 911 Calls, Traffic KPIs, and more\n\nAll data is public, sourced from the City of Montgomery's open data portal. Scores are computed algorithmically with no manual overrides.`;
  }

  // Fallback
  return `I can help you understand Montgomery's community safety data. Try asking about:\n\n• Why a specific neighborhood has its current safety rating\n• Which areas are Safety Deserts and why\n• How the scoring model works\n• Emergency coverage gaps across the city\n• What residents or the city can do to improve safety\n• The safest vs. most at-risk neighborhoods\n\nClick on any neighborhood on the map first, then ask me "Why is this area rated this way?" for a detailed explanation.`;
}
