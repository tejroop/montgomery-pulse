import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import type { NeighborhoodCollection, NeighborhoodFeature } from '../types';
import { getScoreColor } from '../utils';
import FacilityMarkers from './FacilityMarkers';

/** Validate that a coordinate pair [lng, lat] contains finite numbers */
function isValidCoord(coord: unknown): boolean {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  return Number.isFinite(coord[0]) && Number.isFinite(coord[1]);
}

/** Validate that an entire coordinate ring (array of [lng, lat]) is valid */
function isValidRing(ring: unknown): boolean {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  return ring.every(isValidCoord);
}

/** Check if a GeoJSON feature has valid geometry coordinates */
function hasValidGeometry(feature: any): boolean {
  try {
    const geom = feature?.geometry;
    if (!geom?.type || !geom?.coordinates) return false;

    if (geom.type === 'Polygon') {
      return Array.isArray(geom.coordinates) && geom.coordinates.every(isValidRing);
    }
    if (geom.type === 'MultiPolygon') {
      return Array.isArray(geom.coordinates) &&
        geom.coordinates.every((poly: any) => Array.isArray(poly) && poly.every(isValidRing));
    }
    if (geom.type === 'Point') {
      return isValidCoord(geom.coordinates);
    }
    if (geom.type === 'LineString') {
      return Array.isArray(geom.coordinates) && geom.coordinates.every(isValidCoord);
    }
    // For other geometry types, try optimistically
    return true;
  } catch {
    return false;
  }
}

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
    if (!selected) return;
    try {
      if (!hasValidGeometry(selected)) {
        console.warn('FlyToSelected: skipping feature with invalid geometry', selected.properties?.id);
        return;
      }
      const layer = L.geoJSON(selected.geometry as any);
      const bounds = layer.getBounds();
      if (!bounds.isValid()) {
        console.warn('FlyToSelected: computed bounds are invalid', selected.properties?.id);
        return;
      }
      map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 14, duration: 0.8 });
    } catch (err) {
      console.warn('FlyToSelected: error flying to feature', selected.properties?.id, err);
    }
  }, [selected, map]);
  return null;
}

export default function SafetyMap({ data, selected, onSelect, showFacilities, activeCategories }: SafetyMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Filter out features with invalid coordinates to prevent Leaflet NaN crashes
  const safeData = useMemo(() => {
    if (!data) return null;
    const validFeatures = data.features.filter(f => {
      const valid = hasValidGeometry(f);
      if (!valid) console.warn('Filtered out feature with invalid geometry:', f.properties?.id, f.properties?.name);
      return valid;
    });
    if (validFeatures.length !== data.features.length) {
      console.warn(`Filtered ${data.features.length - validFeatures.length} features with invalid geometry`);
    }
    return { ...data, features: validFeatures } as NeighborhoodCollection;
  }, [data]);

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
      {safeData && (
        <GeoJSON
          key={selected?.properties.id || 'all'}
          ref={geoJsonRef as any}
          data={safeData as any}
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
