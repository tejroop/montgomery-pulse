import { useState, useEffect } from 'react';
import './App.css';
import SafetyMap from './components/SafetyMap';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import Legend from './components/Legend';
import CityHeader from './components/CityHeader';
import { FacilityTogglePanel } from './components/FacilityMarkers';
import type { NeighborhoodCollection, NeighborhoodFeature } from './types';

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
        </div>
      </div>
    </div>
  );
}

export default App;
