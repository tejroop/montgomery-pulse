import { useMemo, useState } from 'react';
import type { NeighborhoodCollection, NeighborhoodFeature } from '../types';
import { getScoreColor, getTrendIcon, getTrendColor } from '../utils';
import ScoreDistribution from './ScoreDistribution';

interface Props {
  data: NeighborhoodCollection | null;
  onSelect: (feature: NeighborhoodFeature) => void;
  selected: NeighborhoodFeature | null;
}

type SortBy = 'score' | 'deserts' | '311' | 'coverage';

export default function Sidebar({ data, onSelect, selected }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('deserts');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    if (!data) return null;
    const features = data.features;
    const scores = features.map(f => f.properties.composite_score);
    const deserts = features.filter(f => f.properties.is_safety_desert);
    const total311 = features.reduce((s, f) => s + f.properties.count_311, 0);
    return {
      total: features.length,
      avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      deserts: deserts.length,
      total311: total311,
    };
  }, [data]);

  const sortedFeatures = useMemo(() => {
    if (!data) return [];
    let features = [...data.features];

    if (search) {
      features = features.filter(f =>
        f.properties.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'score':
        features.sort((a, b) => b.properties.composite_score - a.properties.composite_score);
        break;
      case 'deserts':
        features.sort((a, b) => {
          if (a.properties.is_safety_desert && !b.properties.is_safety_desert) return -1;
          if (!a.properties.is_safety_desert && b.properties.is_safety_desert) return 1;
          return b.properties.composite_score - a.properties.composite_score;
        });
        break;
      case '311':
        features.sort((a, b) => b.properties.count_311 - a.properties.count_311);
        break;
      case 'coverage':
        features.sort((a, b) => b.properties.emergency_coverage_score - a.properties.emergency_coverage_score);
        break;
    }

    return features;
  }, [data, sortBy, search]);

  return (
    <div className="w-full md:w-[320px] h-full bg-slate-900 md:border-r border-slate-700 flex flex-col z-[1000]">
      {/* Logo & Title */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-black text-white tracking-tight">
          Montgomery<span className="text-emerald-400">Pulse</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Community Safety Lens</p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-slate-400 uppercase">Neighborhoods</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2.5 text-center border border-red-500/20">
            <div className="text-lg font-bold text-red-400">{stats.deserts}</div>
            <div className="text-[10px] text-red-400/70 uppercase">Safety Deserts</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-amber-400">{stats.avgScore}</div>
            <div className="text-[10px] text-slate-400 uppercase">Avg Score</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-blue-400">{(stats.total311 / 1000).toFixed(0)}K</div>
            <div className="text-[10px] text-slate-400 uppercase">311 Requests</div>
          </div>
        </div>
      )}

      {/* Score Distribution */}
      {data && <ScoreDistribution data={data} />}

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <input
          type="text"
          placeholder="Search neighborhoods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Sort Tabs */}
      <div className="flex border-b border-slate-700 text-[10px] uppercase font-semibold">
        {([
          ['deserts', 'Deserts'],
          ['score', 'Risk Score'],
          ['311', '311 Calls'],
          ['coverage', 'Coverage'],
        ] as [SortBy, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex-1 py-2 transition-colors ${
              sortBy === key
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Neighborhood List */}
      <div className="flex-1 overflow-y-auto">
        {sortedFeatures.map(feature => {
          const p = feature.properties;
          const isSelected = selected?.properties.id === p.id;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(feature)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-800 transition-colors hover:bg-slate-800 ${
                isSelected ? 'bg-slate-800 border-l-2 border-l-emerald-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                    {p.is_safety_desert && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">
                      311: {p.count_311} | Code: {p.count_code_violations}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: getTrendColor(p.trend) }}>
                    {getTrendIcon(p.trend)}
                  </span>
                  <div
                    className="text-sm font-bold px-2 py-0.5 rounded"
                    style={{
                      color: getScoreColor(p.composite_score),
                      backgroundColor: getScoreColor(p.composite_score) + '15',
                    }}
                  >
                    {p.composite_score.toFixed(0)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 text-[10px] text-slate-500 text-center">
        Data: City of Montgomery ArcGIS Open Data
      </div>
    </div>
  );
}
