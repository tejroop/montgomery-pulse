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
import InstallPrompt from './components/InstallPrompt';
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
  const [mobilePanel, setMobilePanel] = useState<'map' | 'list'>('map');

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
    setMobilePanel('map');
  };

  const handleSelectMobile = (feature: NeighborhoodFeature) => {
    setSelected(feature);
    setMobilePanel('map');
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

  if (page === 'assistant') {
    return (
      <SafetyAssistantPage
        data={data}
        onNavigateToMap={handleNavigateToMap}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header - hidden on mobile to save space */}
      <div className="hidden md:block">
        <CityHeader data={data} />
      </div>

      {/* === DESKTOP LAYOUT === */}
      <div className="hidden md:flex flex-1 overflow-hidden">
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
          <SafetyChatPanel data={data} selectedNeighborhood={selected} />
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

      {/* === MOBILE LAYOUT === */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="bg-slate-900 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white">Montgomery<span className="text-emerald-400">Pulse</span></h1>
            <p className="text-[10px] text-slate-500">Community Safety Lens</p>
          </div>
          {data && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm font-bold text-red-400">{data.features.filter(f => f.properties.is_safety_desert).length}</div>
                <div className="text-[8px] text-slate-500">DESERTS</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">{data.features.length}</div>
                <div className="text-[8px] text-slate-500">AREAS</div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile content area */}
        {mobilePanel === 'map' ? (
          <div className="flex-1 relative">
            <SafetyMap
              data={data}
              selected={selected}
              onSelect={setSelected}
              showFacilities={showFacilities}
              activeCategories={activeCategories}
            />

            {/* Mobile bottom sheet for selected neighborhood */}
            {selected && (
              <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
                {/* Drag handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>
                <div className="flex items-center justify-between px-4 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selected.properties.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black" style={{ color: `hsl(${Math.max(0, 120 - selected.properties.composite_score * 1.2)}, 70%, 45%)` }}>
                        {selected.properties.composite_score.toFixed(0)}
                      </span>
                      {selected.properties.is_safety_desert && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">SAFETY DESERT</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white p-2 -mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400">311 Calls</div>
                    <div className="text-sm text-white font-bold">{selected.properties.count_311.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400">Code Violations</div>
                    <div className="text-sm text-white font-bold">{selected.properties.count_code_violations.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400">Nearest Fire/Police</div>
                    <div className="text-sm text-white font-bold">{selected.properties.dist_fire_police_km} km</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400">Tornado Shelter</div>
                    <div className="text-sm text-white font-bold">{selected.properties.dist_tornado_shelter_km} km</div>
                  </div>
                </div>
              </div>
            )}

            <SafetyChatPanel data={data} selectedNeighborhood={selected} />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Sidebar data={data} onSelect={handleSelectMobile} selected={selected} />
          </div>
        )}

        {/* Mobile bottom tab bar */}
        <div className="flex bg-slate-900 border-t border-slate-700 z-[1002] flex-shrink-0">
          <button
            onClick={() => setMobilePanel('map')}
            className={`flex-1 py-2.5 text-center text-[10px] font-semibold transition-colors ${mobilePanel === 'map' ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            <div className="text-base mb-0.5">🗺️</div>
            Map
          </button>
          <button
            onClick={() => setMobilePanel('list')}
            className={`flex-1 py-2.5 text-center text-[10px] font-semibold transition-colors ${mobilePanel === 'list' ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            <div className="text-base mb-0.5">📋</div>
            List
          </button>
          <button
            onClick={() => setPage('assistant')}
            className="flex-1 py-2.5 text-center text-[10px] font-semibold text-slate-500"
          >
            <div className="text-base mb-0.5">🧠</div>
            AI
          </button>
        </div>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
