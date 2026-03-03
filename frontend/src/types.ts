export interface NeighborhoodProperties {
  id: string;
  name: string;
  dominant_zoning: string;
  num_parcels: number;
  area_km2: number;
  composite_score: number;
  complaint_density_score: number;
  environmental_risk_score: number;
  emergency_coverage_score: number;
  resource_access_score: number;
  is_safety_desert: boolean;
  trend: 'improving' | 'stable' | 'worsening';
  count_311: number;
  count_env_nuisance: number;
  count_code_violations: number;
  count_food_inspections: number;
  dist_fire_police_km: number;
  dist_tornado_shelter_km: number;
  dist_weather_siren_km: number;
  dist_community_center_km: number;
  dist_pharmacy_km: number;
  dist_school_km: number;
  dist_park_km: number;
}

export interface NeighborhoodFeature {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: NeighborhoodProperties;
}

export interface NeighborhoodCollection {
  type: 'FeatureCollection';
  features: NeighborhoodFeature[];
}

export interface FacilityPoint {
  lat: number;
  lng: number;
  name: string;
}

export interface FacilityCategory {
  label: string;
  count: number;
  points: FacilityPoint[];
}

export interface Facilities {
  [key: string]: FacilityCategory;
}
