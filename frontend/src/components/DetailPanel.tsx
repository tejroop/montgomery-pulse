import { useState } from 'react';
import type { NeighborhoodFeature } from '../types';
import { getScoreColor, getRiskLabel, getTrendIcon, getTrendColor } from '../utils';
import RadarChart from './RadarChart';
import InsightCards from './InsightCard';
import { explainSafetyScore, explainSafetyAction, explainEmergencyAccess } from '../safetyAI';

interface Props {
  feature: NeighborhoodFeature;
  onClose: () => void;
}

function MetricRow({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-slate-200 text-sm font-medium">{value}{unit}</span>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span style={{ color: getScoreColor(score) }} className="font-semibold">{score.toFixed(0)}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}
        />
      </div>
    </div>
  );
}

export default function DetailPanel({ feature, onClose }: Props) {
  const [showAI, setShowAI] = useState(false);
  const p = feature.properties;
  const riskLabel = getRiskLabel(p.composite_score);
  const scoreColor = getScoreColor(p.composite_score);

  return (
    <div className="absolute right-0 top-0 h-full w-[380px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 z-[1000] overflow-y-auto slide-in-right">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white leading-tight">{p.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: scoreColor + '20', color: scoreColor }}
              >
                {riskLabel}
              </span>
              {p.is_safety_desert && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 pulse-desert">
                  SAFETY DESERT
                </span>
              )}
              <span className="text-xs" style={{ color: getTrendColor(p.trend) }}>
                {getTrendIcon(p.trend)} {p.trend}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl ml-2 p-1 -mt-1"
          >
            x
          </button>
        </div>

        {/* Big Score */}
        <div className="flex items-center gap-3 mt-3">
          <div
            className="text-4xl font-black"
            style={{ color: scoreColor }}
          >
            {p.composite_score.toFixed(0)}
          </div>
          <div className="text-xs text-slate-400 leading-tight">
            Safety Context<br/>Score (0-100)
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="px-4 pt-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Risk Dimensions</h3>
        <RadarChart data={p} />
      </div>

      {/* Score Bars */}
      <div className="px-4 pb-3">
        <ScoreBar label="Complaint Density" score={p.complaint_density_score} />
        <ScoreBar label="Environmental Risk" score={p.environmental_risk_score} />
        <ScoreBar label="Emergency Coverage Gap" score={p.emergency_coverage_score} />
        <ScoreBar label="Resource Access Gap" score={p.resource_access_score} />
      </div>

      {/* Raw Metrics */}
      <div className="px-4 py-3 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Incident Counts</h3>
        <MetricRow label="311 Service Requests" value={p.count_311.toLocaleString()} />
        <MetricRow label="Code Violations" value={p.count_code_violations.toLocaleString()} />
        <MetricRow label="Environmental Nuisance" value={p.count_env_nuisance} />
        <MetricRow label="Food Inspections" value={p.count_food_inspections} />
      </div>

      {/* Distance Metrics */}
      <div className="px-4 py-3 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nearest Emergency Resources</h3>
        <MetricRow label="Fire/Police Station" value={p.dist_fire_police_km} unit=" km" />
        <MetricRow label="Tornado Shelter" value={p.dist_tornado_shelter_km} unit=" km" />
        <MetricRow label="Weather Siren" value={p.dist_weather_siren_km} unit=" km" />
      </div>

      <div className="px-4 py-3 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nearest Community Resources</h3>
        <MetricRow label="Community Center" value={p.dist_community_center_km} unit=" km" />
        <MetricRow label="Pharmacy" value={p.dist_pharmacy_km} unit=" km" />
        <MetricRow label="School" value={p.dist_school_km} unit=" km" />
        <MetricRow label="Park" value={p.dist_park_km} unit=" km" />
      </div>

      {/* AI Context Insights */}
      <InsightCards properties={p} />

      {/* AI Deep Explainer */}
      <div className="px-4 py-3 border-t border-slate-700">
        <button
          onClick={() => setShowAI(!showAI)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-sm font-semibold text-emerald-400"
        >
          <span className="text-base">🧠</span>
          {showAI ? 'Hide AI Deep Analysis' : 'AI: Explain This Neighborhood'}
          <svg className={`w-3 h-3 transition-transform ${showAI ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAI && (
          <div className="mt-3 space-y-3 fade-in">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Why This Rating</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{explainSafetyScore(p)}</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Recommended Action</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{explainSafetyAction(p)}</p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Emergency & Resource Access</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{explainEmergencyAccess(p)}</p>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-slate-500 italic">Explainable AI — every insight traces to Montgomery open data</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone info */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
        <div>Zone: {p.dominant_zoning} | Parcels: {p.num_parcels} | Area: {p.area_km2} km&sup2;</div>
      </div>
    </div>
  );
}
