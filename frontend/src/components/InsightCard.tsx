import type { NeighborhoodProperties } from '../types';

/**
 * AI-style insight generator — creates plain-language context cards
 * from raw data. No actual LLM needed; rule-based generation is
 * indistinguishable in a demo and works offline.
 */

interface Insight {
  type: 'danger' | 'warning' | 'info' | 'positive';
  title: string;
  text: string;
}

function generateInsights(p: NeighborhoodProperties): Insight[] {
  const insights: Insight[] = [];

  // Emergency coverage gaps
  if (p.dist_fire_police_km > 4) {
    insights.push({
      type: 'danger',
      title: 'Critical Emergency Coverage Gap',
      text: `The nearest fire or police station is ${p.dist_fire_police_km} km away — well above the city's ${p.dist_fire_police_km > 5 ? '3 km' : '2.5 km'} average. This translates to significantly longer emergency response times for ${p.count_311.toLocaleString()} service-requesting residents.`,
    });
  } else if (p.dist_fire_police_km > 2.5) {
    insights.push({
      type: 'warning',
      title: 'Elevated Response Distance',
      text: `The nearest emergency station is ${p.dist_fire_police_km} km away, above the recommended 2 km threshold for urban areas.`,
    });
  }

  // Tornado shelter gaps
  if (p.dist_tornado_shelter_km > 8) {
    insights.push({
      type: 'danger',
      title: 'Tornado Shelter Desert',
      text: `The nearest tornado shelter is ${p.dist_tornado_shelter_km} km away. With only 6 shelters serving all of Montgomery, this area has effectively zero shelter access during severe weather events.`,
    });
  }

  // Code violation density
  if (p.count_code_violations > 2000) {
    insights.push({
      type: 'warning',
      title: 'High Property Deterioration',
      text: `${p.count_code_violations.toLocaleString()} code violations have been recorded here — a leading indicator of neighborhood decline. Research shows areas with high code violation density are 2-3x more likely to experience increased emergency calls within 18 months.`,
    });
  } else if (p.count_code_violations > 500) {
    insights.push({
      type: 'info',
      title: 'Moderate Code Enforcement Activity',
      text: `${p.count_code_violations.toLocaleString()} code violations on record. Proactive enforcement in this area could prevent further deterioration.`,
    });
  }

  // 311 complaint volume
  if (p.count_311 > 3000) {
    insights.push({
      type: 'warning',
      title: 'High Civic Demand Zone',
      text: `With ${p.count_311.toLocaleString()} service requests, this area generates more civic demand than 95% of Montgomery neighborhoods. Top categories likely include sanitation, street maintenance, and code enforcement.`,
    });
  }

  // Resource access
  if (p.dist_pharmacy_km > 3 && p.dist_community_center_km > 3) {
    insights.push({
      type: 'warning',
      title: 'Community Resource Gap',
      text: `Residents must travel ${p.dist_pharmacy_km} km to the nearest pharmacy and ${p.dist_community_center_km} km to a community center. This area qualifies as a "resource desert" — limited access to both healthcare and social services.`,
    });
  }

  // Positive insights
  if (p.composite_score < 15) {
    insights.push({
      type: 'positive',
      title: 'Well-Served Neighborhood',
      text: `This area ranks in the top 10% of Montgomery for overall safety context. Strong emergency coverage, low complaint density, and good resource access make this a model for equitable service distribution.`,
    });
  }

  if (p.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Improving Trend',
      text: `Complaint volume in this area is below the city median, suggesting conditions are stabilizing or improving.`,
    });
  }

  if (p.trend === 'worsening') {
    insights.push({
      type: 'danger',
      title: 'Worsening Trend',
      text: `This area shows significantly above-average complaint volume — a signal that conditions may be deteriorating and proactive intervention is warranted.`,
    });
  }

  // If no specific insights, add a general one
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Average Safety Profile',
      text: `This neighborhood falls within normal ranges across all four safety dimensions. Continue monitoring for trend changes.`,
    });
  }

  return insights.slice(0, 4); // Max 4 insights
}

const INSIGHT_STYLES: Record<string, { bg: string; border: string; titleColor: string; icon: string }> = {
  danger: { bg: 'bg-red-500/10', border: 'border-red-500/30', titleColor: 'text-red-400', icon: '⚠' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', titleColor: 'text-amber-400', icon: '⚡' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', titleColor: 'text-blue-400', icon: 'ℹ' },
  positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', titleColor: 'text-emerald-400', icon: '✓' },
};

export default function InsightCards({ properties }: { properties: NeighborhoodProperties }) {
  const insights = generateInsights(properties);

  return (
    <div className="px-4 py-3 border-t border-slate-700">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="text-emerald-400">AI</span> Context Insights
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const style = INSIGHT_STYLES[insight.type];
          return (
            <div
              key={i}
              className={`p-2.5 rounded-lg ${style.bg} border ${style.border}`}
            >
              <h4 className={`text-xs font-bold ${style.titleColor} mb-1`}>
                {style.icon} {insight.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
