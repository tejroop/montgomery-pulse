import { useEffect, useState, useMemo } from 'react';
import type { NeighborhoodCollection } from '../types';
import SyncStatus from './SyncStatus';

interface CityStats {
  '911_calls': {
    total_emergency: number;
    total_non_emergency: number;
    year: number;
  };
  traffic_kpi: Array<Record<string, any>>;
  daily_population: Array<Record<string, any>>;
}

interface Props {
  data: NeighborhoodCollection | null;
}

export default function CityHeader({ data }: Props) {
  const [cityStats, setCityStats] = useState<CityStats | null>(null);

  useEffect(() => {
    fetch('/data/city_stats.json')
      .then(res => res.json())
      .then(setCityStats)
      .catch(console.error);
  }, []);

  const computed = useMemo(() => {
    if (!data || !cityStats) return null;

    const features = data.features;
    const deserts = features.filter(f => f.properties.is_safety_desert).length;
    const avgScore = features.reduce((s, f) => s + f.properties.composite_score, 0) / features.length;
    const total311 = features.reduce((s, f) => s + f.properties.count_311, 0);
    const totalViolations = features.reduce((s, f) => s + f.properties.count_code_violations, 0);

    // Sum up traffic infrastructure from KPIs
    const trafficKpis = cityStats.traffic_kpi || [];
    const signsReplaced = trafficKpis.reduce((s: number, m: Record<string, any>) => s + (m.Traffic_Signs_Replaced || 0), 0);
    const lightsRepaired = trafficKpis.reduce((s: number, m: Record<string, any>) => s + (m.Street_Light_Fixtures_Repaired || 0), 0);

    return {
      totalEmergency: cityStats['911_calls'].total_emergency,
      totalNonEmergency: cityStats['911_calls'].total_non_emergency,
      neighborhoods: features.length,
      deserts,
      avgScore: avgScore.toFixed(1),
      total311,
      totalViolations,
      signsReplaced,
      lightsRepaired,
    };
  }, [data, cityStats]);

  if (!computed) return null;

  const stats = [
    { label: '911 Emergency', value: `${(computed.totalEmergency / 1000).toFixed(0)}K`, color: 'text-red-400' },
    { label: '311 Requests', value: `${(computed.total311 / 1000).toFixed(0)}K`, color: 'text-blue-400' },
    { label: 'Code Violations', value: `${(computed.totalViolations / 1000).toFixed(0)}K`, color: 'text-amber-400' },
    { label: 'Safety Deserts', value: computed.deserts.toString(), color: 'text-red-500' },
    { label: 'Avg Risk Score', value: computed.avgScore, color: 'text-emerald-400' },
    { label: 'Signs Replaced', value: computed.signsReplaced.toString(), color: 'text-cyan-400' },
    { label: 'Lights Repaired', value: computed.lightsRepaired.toString(), color: 'text-purple-400' },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 py-1.5 flex items-center gap-6 overflow-x-auto z-[1001] city-header">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">City Pulse</span>
        <span className="text-[10px] text-slate-500">Montgomery, AL</span>
      </div>
      <div className="h-4 w-px bg-slate-700 flex-shrink-0" />
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
          <span className="text-[10px] text-slate-500 uppercase">{stat.label}</span>
        </div>
      ))}
      <div className="ml-auto flex-shrink-0">
        <SyncStatus />
      </div>
    </div>
  );
}
