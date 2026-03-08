import { useEffect, useState } from 'react';
import { CircleMarker, LayerGroup, Popup } from 'react-leaflet';
import type { Facilities } from '../types';

interface Props {
  visible: boolean;
  activeCategories: Set<string>;
}

const FACILITY_STYLES: Record<string, { color: string; icon: string }> = {
  fire_police: { color: '#f97316', icon: '🚒' },
  tornado_shelters: { color: '#a855f7', icon: '🏠' },
  weather_sirens: { color: '#06b6d4', icon: '📡' },
  community_centers: { color: '#22c55e', icon: '🏛️' },
  pharmacies: { color: '#3b82f6', icon: '💊' },
  schools: { color: '#eab308', icon: '🏫' },
  parks: { color: '#10b981', icon: '🌳' },
};

export default function FacilityMarkers({ visible, activeCategories }: Props) {
  const [facilities, setFacilities] = useState<Facilities | null>(null);

  useEffect(() => {
    fetch('/data/facilities.json')
      .then(res => res.json())
      .then(setFacilities)
      .catch(console.error);
  }, []);

  if (!visible || !facilities) return null;

  return (
    <>
      {Object.entries(facilities).map(([key, category]) => {
        if (!activeCategories.has(key)) return null;
        const style = FACILITY_STYLES[key] || { color: '#94a3b8', icon: '📍' };

        return (
          <LayerGroup key={key}>
            {category.points.filter(pt => Number.isFinite(pt.lat) && Number.isFinite(pt.lng)).map((pt, i) => (
              <CircleMarker
                key={`${key}-${i}`}
                center={[pt.lat, pt.lng]}
                radius={5}
                pathOptions={{
                  fillColor: style.color,
                  fillOpacity: 0.9,
                  weight: 1,
                  color: '#0f172a',
                  opacity: 0.8,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                    <strong>{style.icon} {category.label}</strong>
                    {pt.name && <div style={{ color: '#64748b' }}>{pt.name}</div>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        );
      })}
    </>
  );
}

// Facility toggle panel component
export function FacilityTogglePanel({
  visible,
  onToggleVisible,
  activeCategories,
  onToggleCategory,
}: {
  visible: boolean;
  onToggleVisible: () => void;
  activeCategories: Set<string>;
  onToggleCategory: (key: string) => void;
}) {
  const categories = [
    { key: 'fire_police', label: 'Fire & Police', icon: '🚒' },
    { key: 'tornado_shelters', label: 'Tornado Shelters', icon: '🏠' },
    { key: 'weather_sirens', label: 'Weather Sirens', icon: '📡' },
    { key: 'community_centers', label: 'Community Centers', icon: '🏛️' },
    { key: 'pharmacies', label: 'Pharmacies', icon: '💊' },
    { key: 'schools', label: 'Schools', icon: '🏫' },
    { key: 'parks', label: 'Parks', icon: '🌳' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl">
      <button
        onClick={onToggleVisible}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider w-full transition-colors rounded-t-lg ${
          visible ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span>{visible ? '●' : '○'}</span>
        Facilities
      </button>
      {visible && (
        <div className="px-2 pb-2 space-y-0.5">
          {categories.map(cat => {
            const active = activeCategories.has(cat.key);
            const style = FACILITY_STYLES[cat.key];
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
                  active ? 'text-slate-200 bg-slate-800' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: active ? style.color : '#475569' }}
                />
                <span>{cat.icon} {cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
