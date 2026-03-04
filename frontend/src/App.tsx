import { useState, useEffect } from 'react';
import './App.css';
import SafetyMap from './components/SafetyMap';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import Legend from './components/Legend';
import CityHeader from './components/CityHeader';
import { FacilityTogglePanel } from './components/FacilityMarkers';
import SafetyChatPanel from './components/SafetyChatPanel';
import SafetyAssistantPage from './components/SafetyAssistantPage';
import type { NeighborhoodCollection, NeighborhoodFeature } from './types';

type Page = 'map' | 'assistant';

const ALL_CATEGORIES = new Set([
  'fire_police',
  'tornado_shelters',
  'weather_sirens',
  'community_centers',
  'pharmacies',
  'schools',
  'parks',
]);

function App() {
  const [data, setData] = useState<NeighborhoodCollection | null>(null);
  const [selected, setSelected] = useState<NeighborhoodFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFacilities, setShowFacilities] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES));
  const [page, setPage] = useState<Page>('map');

  useEffect(() => {
    fetch('/data/neighborhoods.json')
      .then(res => res.json())
      .then((geojson: NeighborhoodCollection) => {
        setData(geojson);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  const toggleCategory = (key: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNavigateToMap = (feature?: NeighborhoodFeature) => {
    if (feature) setSelected(feature);
    setPage('map');
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🏙️</div>
          <h1 className="text-xl font-bold text-white mb-2">
            Montgomery<span className="text-emerald-400">Pulse</span>
          </h1>
          <p className="text-sm text-slate-400">Loading community safety data...</p>
        </div>
      </div>
    );
  }

  // Full-page assistant view
  if (page === 'assistant') {
    return (
      <SafetyAssistantPage
        data={data}
        onNavigateToMap={handleNavigateToMap}
      />
    );
  }

  // Map view (default)
  return (
    <div className="flex flex-col w-full h-full">
      <CityHeader data={data} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar data={data} onSelect={setSelected} selected={selected} />
        <div className="flex-1 relative">
          <SafetyMap
            data={data}
            selected={selected}
            onSelect={setSelected}
            showFacilities={showFacilities}
            activeCategories={activeCategories}
          />
          <Legend />
          <FacilityTogglePanel
            visible={showFacilities}
            onToggleVisible={() => setShowFacilities(v => !v)}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
          />
          {selected && (
            <DetailPanel feature={selected} onClose={() => setSelected(null)} />
          )}

          {/* AI Chat Panel Overlay */}
          <SafetyChatPanel
            data={data}
            selectedNeighborhood={selected}
          />

          {/* Safety Assistant Button — Top Right */}
          <button
            onClick={() => setPage('assistant')}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-700 hover:border-emerald-500/50 hover:shadow-xl transition-all group"
            style={{ zIndex: 1000 }}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-sm">🧠</span>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Safety Assistant</div>
              <div className="text-[10px] text-slate-400">Full AI Explorer</div>
            </div>
            <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
