import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import type { NeighborhoodCollection, NeighborhoodFeature } from '../types';
import { getScoreColor } from '../utils';
import FacilityMarkers from './FacilityMarkers';

interface SafetyMapProps {
  data: NeighborhoodCollection | null;
  selected: NeighborhoodFeature | null;
  onSelect: (feature: NeighborhoodFeature | null) => void;
  showFacilities: boolean;
  activeCategories: Set<string>;
}

function FlyToSelected({ selected }: { selected: NeighborhoodFeature | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      const bounds = L.geoJSON(selected.geometry as any).getBounds();
      map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 14, duration: 0.8 });
    }
  }, [selected, map]);
  return null;
}

export default function SafetyMap({ data, selected, onSelect, showFacilities, activeCategories }: SafetyMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  const style = (feature: any) => {
    const score = feature.properties.composite_score;
    const isSelected = selected?.properties.id === feature.properties.id;
    const isDesert = feature.properties.is_safety_desert;

    return {
      fillColor: getScoreColor(score),
      fillOpacity: isSelected ? 0.85 : 0.55,
      weight: isSelected ? 3 : isDesert ? 2 : 1,
      color: isSelected ? '#ffffff' : isDesert ? '#ef4444' : '#334155',
      opacity: isSelected ? 1 : 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => onSelect(feature as NeighborhoodFeature),
      mouseover: (e: L.LeafletMouseEvent) => {
        const l = e.target;
        l.setStyle({ weight: 2, fillOpacity: 0.75 });
        l.bringToFront();

        const props = feature.properties;
        l.bindTooltip(
          `<div style="font-size:13px;font-weight:600;color:#f1f5f9">${props.name}</div>
           <div style="font-size:12px;color:#94a3b8;margin-top:2px">
             Score: <strong style="color:${getScoreColor(props.composite_score)}">${props.composite_score}</strong>
             ${props.is_safety_desert ? ' <span style="color:#ef4444;font-weight:700">SAFETY DESERT</span>' : ''}
           </div>
           <div style="font-size:11px;color:#64748b;margin-top:1px">
             311: ${props.count_311.toLocaleString()} | Violations: ${props.count_code_violations.toLocaleString()}
           </div>`,
          { sticky: true, className: 'custom-tooltip', direction: 'top', offset: [0, -10] }
        ).openTooltip();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
        e.target.unbindTooltip();
      },
    });
  };

  return (
    <MapContainer
      center={[32.377, -86.300]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {data && (
        <GeoJSON
          key={selected?.properties.id || 'all'}
          ref={geoJsonRef as any}
          data={data as any}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      <FacilityMarkers visible={showFacilities} activeCategories={activeCategories} />
      <FlyToSelected selected={selected} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
