#!/usr/bin/env python3
"""
MontgomeryPulse Scoring Pipeline
=================================
Takes raw ArcGIS GeoJSON files and produces:
  1. neighborhoods.json — scored zoning polygons (simplified) for the frontend map
  2. facilities.json — all point facilities for overlay markers
  3. city_stats.json — aggregate city-wide metrics

Scoring Dimensions (each 0–100):
  - Complaint Density: 311 requests + Environmental Nuisance per zone area
  - Environmental Risk: Code Violations per zone area
  - Emergency Coverage: Proximity to fire/police stations, tornado shelters, weather sirens
  - Resource Access: Proximity to community centers, parks, pharmacies, schools

Composite Safety Context Score = weighted average of dimensions
"""

import json
import os
import math
from collections import defaultdict

import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union
import numpy as np

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# STEP 1: Load and prepare zoning polygons as neighborhoods
# ============================================================
def load_zones():
    """Load zoning polygons, merge small ones into neighborhood clusters."""
    print("Loading zoning polygons...")
    with open(os.path.join(RAW_DIR, "zoning.json")) as f:
        data = json.load(f)

    features = []
    for feat in data["features"]:
        if feat.get("geometry"):
            try:
                geom = shape(feat["geometry"])
                if geom.is_valid and not geom.is_empty:
                    features.append({
                        "geometry": geom,
                        "zoning_code": feat["properties"].get("ZoningCode", "Unknown"),
                        "zoning_desc": feat["properties"].get("ZoningDesc", "Unknown"),
                    })
            except Exception:
                pass

    gdf = gpd.GeoDataFrame(features, geometry="geometry", crs="EPSG:4326")
    print(f"  Loaded {len(gdf)} valid zoning polygons")

    # Group by similar zoning codes to create larger "neighborhood" zones
    # Use a grid-based approach: divide city into ~0.01 degree grid cells (~1km)
    # and merge zoning polygons within each cell
    gdf["grid_x"] = (gdf.geometry.centroid.x * 100).astype(int)
    gdf["grid_y"] = (gdf.geometry.centroid.y * 100).astype(int)
    gdf["grid_id"] = gdf["grid_x"].astype(str) + "_" + gdf["grid_y"].astype(str)

    # Merge zones into grid-based neighborhoods
    neighborhoods = []
    for grid_id, group in gdf.groupby("grid_id"):
        merged_geom = unary_union(group.geometry)
        # Get dominant zoning type
        zoning_counts = group["zoning_code"].value_counts()
        dominant_zone = zoning_counts.index[0] if len(zoning_counts) > 0 else "Mixed"

        centroid = merged_geom.centroid
        neighborhoods.append({
            "geometry": merged_geom,
            "neighborhood_id": grid_id,
            "dominant_zoning": dominant_zone,
            "num_parcels": len(group),
            "area_sq_deg": merged_geom.area,
            "centroid_lat": centroid.y,
            "centroid_lng": centroid.x,
        })

    nhood_gdf = gpd.GeoDataFrame(neighborhoods, geometry="geometry", crs="EPSG:4326")

    # Filter out tiny fragments (less than ~0.2 km² which is ~0.00002 sq degrees)
    nhood_gdf = nhood_gdf[nhood_gdf["area_sq_deg"] > 0.000005].copy()
    nhood_gdf = nhood_gdf.reset_index(drop=True)

    # Create human-readable names using nearest landmarks and directional context
    center_lat = nhood_gdf["centroid_lat"].median()
    center_lng = nhood_gdf["centroid_lng"].median()

    # Load landmarks for contextual naming
    landmarks = []
    for fname in ["most_visited.json", "point_of_interest.json"]:
        lpath = os.path.join(RAW_DIR, fname)
        if os.path.exists(lpath):
            with open(lpath) as f:
                ldata = json.load(f)
            for feat in ldata.get("features", []):
                geom = feat.get("geometry")
                props = feat.get("properties", {})
                name = props.get("PlaceName") or props.get("Name") or props.get("FULLADDR") or ""
                if geom and geom.get("coordinates") and name:
                    coords = geom["coordinates"]
                    # Skip generic names
                    if name.lower() in ["walmart", "sam's club", "hmma"]:
                        continue
                    landmarks.append({"name": name, "lon": coords[0], "lat": coords[1]})

    # Montgomery well-known area names by approximate location
    area_names = [
        (32.390, -86.320, "Chisholm"),
        (32.405, -86.255, "Dalraida"),
        (32.370, -86.310, "Capitol Heights"),
        (32.360, -86.300, "Cloverdale"),
        (32.340, -86.290, "Woodley Park"),
        (32.380, -86.245, "Eastdale"),
        (32.350, -86.260, "Halcyon"),
        (32.360, -86.340, "West Montgomery"),
        (32.400, -86.290, "Norman Bridge"),
        (32.325, -86.310, "South Boulevard"),
        (32.380, -86.170, "Eastchase"),
        (32.420, -86.250, "Bell Road"),
        (32.355, -86.185, "Wynlakes"),
        (32.370, -86.270, "Midtown"),
        (32.385, -86.295, "Downtown"),
        (32.340, -86.340, "Snowdoun"),
        (32.350, -86.200, "Taylor Road"),
        (32.310, -86.280, "South Montgomery"),
        (32.395, -86.200, "Eastern Bypass"),
        (32.430, -86.285, "North Montgomery"),
        (32.340, -86.230, "Carter Hill"),
        (32.375, -86.350, "Westgate"),
        (32.410, -86.320, "Mobile Highway"),
        (32.365, -86.145, "Pike Road"),
        (32.395, -86.350, "West Fairview"),
    ]

    def find_nearest_area(lat, lng):
        """Find nearest well-known area name."""
        best_dist = float("inf")
        best_name = None
        for alat, alng, aname in area_names:
            d = math.sqrt((lat - alat) ** 2 + (lng - alng) ** 2)
            if d < best_dist:
                best_dist = d
                best_name = aname
        return best_name

    def find_nearest_landmark(lat, lng, max_dist_deg=0.015):
        """Find nearest landmark within threshold."""
        best_dist = float("inf")
        best_name = None
        for lm in landmarks:
            d = math.sqrt((lat - lm["lat"]) ** 2 + (lng - lm["lon"]) ** 2)
            if d < best_dist and d < max_dist_deg:
                best_dist = d
                best_name = lm["name"]
        return best_name

    def name_neighborhood(row):
        lat, lng = row["centroid_lat"], row["centroid_lng"]
        # Try nearest well-known area
        area = find_nearest_area(lat, lng)
        # Try nearest landmark for extra context
        landmark = find_nearest_landmark(lat, lng, 0.012)

        # Directional prefix
        ns = "North" if lat > center_lat + 0.025 else ("South" if lat < center_lat - 0.025 else "")
        ew = "West" if lng < center_lng - 0.04 else ("East" if lng > center_lng + 0.04 else "")
        direction = f"{ns}{' ' if ns and ew else ''}{ew}".strip()

        if area:
            base = area
        elif direction:
            base = f"{direction} Montgomery"
        else:
            base = f"Central {row['dominant_zoning']}"

        # Add landmark context for disambiguation
        if landmark and landmark != base:
            # Shorten long landmark names
            short_lm = landmark.split(" Shopping")[0].split(" Center")[0].split(" Plaza")[0]
            if len(short_lm) <= 20:
                return f"{base} ({short_lm})"
        return base

    nhood_gdf["name"] = nhood_gdf.apply(name_neighborhood, axis=1)

    # Make names unique by appending sector number if duplicated
    name_counts_total = defaultdict(int)
    for name in nhood_gdf["name"]:
        name_counts_total[name] += 1

    name_counts = defaultdict(int)
    unique_names = []
    for name in nhood_gdf["name"]:
        name_counts[name] += 1
        if name_counts_total[name] > 1:
            unique_names.append(f"{name} S{name_counts[name]}")
        else:
            unique_names.append(name)
    nhood_gdf["name"] = unique_names

    print(f"  Created {len(nhood_gdf)} neighborhoods from grid clustering")
    return nhood_gdf


# ============================================================
# STEP 2: Load point datasets
# ============================================================
def load_geojson_points(filename):
    """Load a GeoJSON file and return list of (lon, lat, properties) tuples."""
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        print(f"  WARNING: {filename} not found")
        return []

    with open(path) as f:
        data = json.load(f)

    points = []
    for feat in data.get("features", []):
        geom = feat.get("geometry")
        if geom and geom.get("type") == "Point" and geom.get("coordinates"):
            coords = geom["coordinates"]
            if coords[0] != 0 and coords[1] != 0:  # Skip null island
                points.append({
                    "lon": coords[0],
                    "lat": coords[1],
                    "props": feat.get("properties", {}),
                })
    return points


# ============================================================
# STEP 3: Spatial join — count points per neighborhood
# ============================================================
def count_points_in_zones(nhood_gdf, points):
    """Count how many points fall within each neighborhood polygon."""
    counts = [0] * len(nhood_gdf)

    if not points:
        return counts

    # Use spatial index for speed
    sindex = nhood_gdf.sindex

    for pt in points:
        point = Point(pt["lon"], pt["lat"])
        # Query spatial index
        possible_matches_idx = list(sindex.intersection(point.bounds))
        for idx in possible_matches_idx:
            if nhood_gdf.geometry.iloc[idx].contains(point):
                counts[idx] += 1
                break  # Point can only be in one zone

    return counts


def min_distance_to_facilities(nhood_gdf, facility_points):
    """For each neighborhood centroid, compute min distance to nearest facility (in km)."""
    if not facility_points:
        return [float("inf")] * len(nhood_gdf)

    facility_coords = [(p["lon"], p["lat"]) for p in facility_points]
    distances = []

    for _, row in nhood_gdf.iterrows():
        clat, clng = row["centroid_lat"], row["centroid_lng"]
        min_dist = float("inf")
        for flon, flat in facility_coords:
            # Haversine approximation
            dlat = math.radians(flat - clat)
            dlon = math.radians(flon - clng)
            a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(clat)) * math.cos(math.radians(flat)) * math.sin(dlon / 2) ** 2
            c = 2 * math.asin(math.sqrt(a))
            dist_km = 6371 * c
            min_dist = min(min_dist, dist_km)
        distances.append(min_dist)

    return distances


# ============================================================
# STEP 4: Compute dimension scores
# ============================================================
def normalize_score(values, invert=False):
    """Normalize values to 0–100 scale. Higher = worse (more risk).
    If invert=True, higher raw value = lower risk score."""
    arr = np.array(values, dtype=float)
    arr = np.nan_to_num(arr, nan=0.0, posinf=100.0)

    if arr.max() == arr.min():
        return [50.0] * len(values)

    # Use percentile-based normalization (more robust to outliers)
    p5 = np.percentile(arr, 5)
    p95 = np.percentile(arr, 95)

    if p95 == p5:
        normalized = np.full_like(arr, 50.0)
    else:
        normalized = np.clip((arr - p5) / (p95 - p5) * 100, 0, 100)

    if invert:
        normalized = 100 - normalized

    return normalized.tolist()


def compute_scores(nhood_gdf):
    """Compute all four dimension scores for each neighborhood."""
    print("\nComputing scores...")

    # --- Load point data ---
    print("  Loading 311 service requests...")
    requests_311 = load_geojson_points("311_service_requests.json")
    print(f"    {len(requests_311)} points")

    print("  Loading environmental nuisance...")
    env_nuisance = load_geojson_points("environmental_nuisance.json")
    print(f"    {len(env_nuisance)} points")

    print("  Loading code violations...")
    code_violations = load_geojson_points("code_violations.json")
    print(f"    {len(code_violations)} points")

    print("  Loading fire & police stations...")
    fire_police = load_geojson_points("fire_police_station.json")
    print(f"    {len(fire_police)} points")

    print("  Loading tornado shelters...")
    tornado = load_geojson_points("tornado_shelter.json")
    print(f"    {len(tornado)} points")

    print("  Loading weather sirens...")
    sirens = load_geojson_points("weather_sirens.json")
    print(f"    {len(sirens)} points")

    print("  Loading community centers...")
    community = load_geojson_points("community_centers.json")
    print(f"    {len(community)} points")

    print("  Loading pharmacies...")
    pharmacies = load_geojson_points("pharmacy_locator.json")
    print(f"    {len(pharmacies)} points")

    print("  Loading education facilities...")
    education = load_geojson_points("education_facility.json")
    print(f"    {len(education)} points")

    print("  Loading parks & trails...")
    parks = load_geojson_points("parks_trails.json")
    print(f"    {len(parks)} points")

    print("  Loading food scores...")
    food = load_geojson_points("food_scores.json")
    print(f"    {len(food)} points")

    # --- Spatial joins (counts per zone) ---
    print("\n  Spatial joining 311 requests...")
    counts_311 = count_points_in_zones(nhood_gdf, requests_311)
    print(f"    Assigned {sum(counts_311)} / {len(requests_311)} to zones")

    print("  Spatial joining environmental nuisance...")
    counts_env = count_points_in_zones(nhood_gdf, env_nuisance)
    print(f"    Assigned {sum(counts_env)} / {len(env_nuisance)} to zones")

    print("  Spatial joining code violations...")
    counts_code = count_points_in_zones(nhood_gdf, code_violations)
    print(f"    Assigned {sum(counts_code)} / {len(code_violations)} to zones")

    print("  Spatial joining food scores...")
    counts_food = count_points_in_zones(nhood_gdf, food)

    # --- Distance calculations ---
    print("  Computing distances to emergency facilities...")
    dist_fire_police = min_distance_to_facilities(nhood_gdf, fire_police)
    dist_tornado = min_distance_to_facilities(nhood_gdf, tornado)
    dist_sirens = min_distance_to_facilities(nhood_gdf, sirens)

    print("  Computing distances to community resources...")
    dist_community = min_distance_to_facilities(nhood_gdf, community)
    dist_pharmacy = min_distance_to_facilities(nhood_gdf, pharmacies)
    dist_education = min_distance_to_facilities(nhood_gdf, education)
    dist_parks = min_distance_to_facilities(nhood_gdf, parks)

    # --- Normalize per area (density) ---
    areas = nhood_gdf["area_sq_deg"].values
    # Convert area to approximate km² (1 deg ≈ 111km at this latitude)
    areas_km2 = areas * (111 * 111 * math.cos(math.radians(32.37)))
    areas_km2 = np.maximum(areas_km2, 0.01)  # Avoid division by zero

    density_311 = [c / a for c, a in zip(counts_311, areas_km2)]
    density_env = [c / a for c, a in zip(counts_env, areas_km2)]
    density_code = [c / a for c, a in zip(counts_code, areas_km2)]

    # --- DIMENSION 1: Complaint Density (311 + Environmental) ---
    # Higher density = higher risk score
    combined_complaint_density = [a + b for a, b in zip(density_311, density_env)]
    complaint_score = normalize_score(combined_complaint_density)

    # --- DIMENSION 2: Environmental Risk (Code Violations density) ---
    environmental_score = normalize_score(density_code)

    # --- DIMENSION 3: Emergency Coverage (distance to emergency facilities) ---
    # Higher distance = worse coverage = higher risk score
    # Weighted: fire/police most important, then sirens, then shelters
    emergency_composite = [
        0.5 * fp + 0.3 * s + 0.2 * t
        for fp, s, t in zip(dist_fire_police, dist_sirens, dist_tornado)
    ]
    emergency_score = normalize_score(emergency_composite)  # Higher distance = higher score = worse

    # --- DIMENSION 4: Resource Access (distance to community resources) ---
    # Higher distance = fewer resources = higher risk score
    resource_composite = [
        0.3 * cc + 0.25 * ph + 0.25 * ed + 0.2 * pk
        for cc, ph, ed, pk in zip(dist_community, dist_pharmacy, dist_education, dist_parks)
    ]
    resource_score = normalize_score(resource_composite)

    # --- COMPOSITE SAFETY CONTEXT SCORE ---
    # Weighted average: higher = more at risk
    weights = {
        "complaint_density": 0.30,
        "environmental_risk": 0.25,
        "emergency_coverage": 0.25,
        "resource_access": 0.20,
    }

    composite_scores = []
    for i in range(len(nhood_gdf)):
        score = (
            weights["complaint_density"] * complaint_score[i]
            + weights["environmental_risk"] * environmental_score[i]
            + weights["emergency_coverage"] * emergency_score[i]
            + weights["resource_access"] * resource_score[i]
        )
        composite_scores.append(round(score, 1))

    # --- Determine Safety Desert status ---
    # Safety Desert = high complaint density AND poor emergency coverage
    median_complaint = np.median(complaint_score)
    median_emergency = np.median(emergency_score)
    safety_deserts = [
        complaint_score[i] > median_complaint * 1.3 and emergency_score[i] > median_emergency * 1.3
        for i in range(len(nhood_gdf))
    ]

    # --- Determine trend (simplified: based on whether 311 complaints are above average) ---
    median_311 = np.median(counts_311)
    trends = []
    for c in counts_311:
        if c > median_311 * 1.5:
            trends.append("worsening")
        elif c < median_311 * 0.5:
            trends.append("improving")
        else:
            trends.append("stable")

    # Store all scores
    nhood_gdf["complaint_density_score"] = [round(s, 1) for s in complaint_score]
    nhood_gdf["environmental_risk_score"] = [round(s, 1) for s in environmental_score]
    nhood_gdf["emergency_coverage_score"] = [round(s, 1) for s in emergency_score]
    nhood_gdf["resource_access_score"] = [round(s, 1) for s in resource_score]
    nhood_gdf["composite_score"] = composite_scores
    nhood_gdf["is_safety_desert"] = safety_deserts
    nhood_gdf["trend"] = trends

    # Raw counts for detail panel
    nhood_gdf["count_311"] = counts_311
    nhood_gdf["count_env_nuisance"] = counts_env
    nhood_gdf["count_code_violations"] = counts_code
    nhood_gdf["count_food_inspections"] = counts_food
    nhood_gdf["dist_fire_police_km"] = [round(d, 2) for d in dist_fire_police]
    nhood_gdf["dist_tornado_shelter_km"] = [round(d, 2) for d in dist_tornado]
    nhood_gdf["dist_weather_siren_km"] = [round(d, 2) for d in dist_sirens]
    nhood_gdf["dist_community_center_km"] = [round(d, 2) for d in dist_community]
    nhood_gdf["dist_pharmacy_km"] = [round(d, 2) for d in dist_pharmacy]
    nhood_gdf["dist_school_km"] = [round(d, 2) for d in dist_education]
    nhood_gdf["dist_park_km"] = [round(d, 2) for d in dist_parks]
    nhood_gdf["area_km2"] = [round(a, 2) for a in areas_km2]

    return nhood_gdf


# ============================================================
# STEP 5: Export for frontend
# ============================================================
def simplify_geometry(geom, tolerance=0.0005):
    """Simplify geometry for smaller JSON output."""
    simplified = geom.simplify(tolerance, preserve_topology=True)
    return simplified


def export_neighborhoods(nhood_gdf):
    """Export scored neighborhoods as GeoJSON for the frontend."""
    print("\nExporting neighborhoods.json...")

    features = []
    for _, row in nhood_gdf.iterrows():
        simplified_geom = simplify_geometry(row.geometry)
        geojson_geom = mapping(simplified_geom)

        # Round coordinates to 5 decimal places (~1m precision)
        def round_coords(coords):
            if isinstance(coords[0], (list, tuple)):
                return [round_coords(c) for c in coords]
            return [round(c, 5) for c in coords]

        if geojson_geom["type"] == "Polygon":
            geojson_geom["coordinates"] = [round_coords(ring) for ring in geojson_geom["coordinates"]]
        elif geojson_geom["type"] == "MultiPolygon":
            geojson_geom["coordinates"] = [[round_coords(ring) for ring in poly] for poly in geojson_geom["coordinates"]]

        feature = {
            "type": "Feature",
            "geometry": geojson_geom,
            "properties": {
                "id": row["neighborhood_id"],
                "name": row["name"],
                "dominant_zoning": row["dominant_zoning"],
                "num_parcels": int(row["num_parcels"]),
                "area_km2": row["area_km2"],
                # Scores (0-100, higher = more risk)
                "composite_score": row["composite_score"],
                "complaint_density_score": row["complaint_density_score"],
                "environmental_risk_score": row["environmental_risk_score"],
                "emergency_coverage_score": row["emergency_coverage_score"],
                "resource_access_score": row["resource_access_score"],
                # Status
                "is_safety_desert": bool(row["is_safety_desert"]),
                "trend": row["trend"],
                # Raw metrics
                "count_311": int(row["count_311"]),
                "count_env_nuisance": int(row["count_env_nuisance"]),
                "count_code_violations": int(row["count_code_violations"]),
                "count_food_inspections": int(row["count_food_inspections"]),
                "dist_fire_police_km": row["dist_fire_police_km"],
                "dist_tornado_shelter_km": row["dist_tornado_shelter_km"],
                "dist_weather_siren_km": row["dist_weather_siren_km"],
                "dist_community_center_km": row["dist_community_center_km"],
                "dist_pharmacy_km": row["dist_pharmacy_km"],
                "dist_school_km": row["dist_school_km"],
                "dist_park_km": row["dist_park_km"],
            },
        }
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}

    output_path = os.path.join(OUTPUT_DIR, "neighborhoods.json")
    with open(output_path, "w") as f:
        json.dump(geojson, f)

    file_size = os.path.getsize(output_path) / 1024
    print(f"  Saved {len(features)} neighborhoods ({file_size:.0f} KB)")
    return geojson


def export_facilities(nhood_gdf):
    """Export facility locations as simple JSON for map markers."""
    print("Exporting facilities.json...")

    facilities = {}

    facility_datasets = {
        "fire_police": ("fire_police_station.json", "Fire & Police Stations"),
        "tornado_shelters": ("tornado_shelter.json", "Tornado Shelters"),
        "weather_sirens": ("weather_sirens.json", "Weather Sirens"),
        "community_centers": ("community_centers.json", "Community Centers"),
        "pharmacies": ("pharmacy_locator.json", "Pharmacies"),
        "schools": ("education_facility.json", "Schools"),
        "parks": ("parks_trails.json", "Parks & Trails"),
    }

    for key, (filename, label) in facility_datasets.items():
        points = load_geojson_points(filename)
        facilities[key] = {
            "label": label,
            "count": len(points),
            "points": [
                {
                    "lat": p["lat"],
                    "lng": p["lon"],
                    "name": p["props"].get("FULLADDR") or p["props"].get("SHELTER") or p["props"].get("Establishment") or p["props"].get("Name") or p["props"].get("PlaceName") or p["props"].get("name") or "",
                }
                for p in points
            ],
        }

    output_path = os.path.join(OUTPUT_DIR, "facilities.json")
    with open(output_path, "w") as f:
        json.dump(facilities, f)

    print(f"  Saved {sum(v['count'] for v in facilities.values())} facilities across {len(facilities)} categories")


def export_city_stats():
    """Export aggregate city-wide statistics."""
    print("Exporting city_stats.json...")

    stats = {}

    # 911 Calls
    with open(os.path.join(RAW_DIR, "911_calls.json")) as f:
        calls = json.load(f)
    total_emergency = sum(
        feat["attributes"]["Call_Count_by_Phone_Service_Pro"]
        for feat in calls["features"]
        if feat["attributes"].get("Call_Category") == "Emergency"
    )
    total_non_emergency = sum(
        feat["attributes"]["Call_Count_by_Phone_Service_Pro"]
        for feat in calls["features"]
        if feat["attributes"].get("Call_Category") == "Non-Emergency"
    )
    stats["911_calls"] = {
        "total_emergency": total_emergency,
        "total_non_emergency": total_non_emergency,
        "year": 2025,
    }

    # Traffic KPIs
    with open(os.path.join(RAW_DIR, "traffic_kpi.json")) as f:
        traffic = json.load(f)
    stats["traffic_kpi"] = [feat["attributes"] for feat in traffic["features"]]

    # Daily Population
    with open(os.path.join(RAW_DIR, "daily_population.json")) as f:
        pop = json.load(f)
    pop_data = [feat["attributes"] for feat in pop["features"]]
    stats["daily_population_sample"] = pop_data[:30]  # Last 30 entries

    output_path = os.path.join(OUTPUT_DIR, "city_stats.json")
    with open(output_path, "w") as f:
        json.dump(stats, f)

    print(f"  Saved city-wide statistics")


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("MontgomeryPulse Scoring Pipeline")
    print("=" * 60)

    # Step 1: Build neighborhoods
    nhood_gdf = load_zones()

    # Step 2–4: Compute scores
    scored_gdf = compute_scores(nhood_gdf)

    # Print summary
    print("\n" + "=" * 60)
    print("SCORING SUMMARY")
    print("=" * 60)
    print(f"  Total neighborhoods: {len(scored_gdf)}")
    print(f"  Safety Deserts: {scored_gdf['is_safety_desert'].sum()}")
    print(f"  Avg composite score: {scored_gdf['composite_score'].mean():.1f}")
    print(f"  Min composite score: {scored_gdf['composite_score'].min():.1f} (safest)")
    print(f"  Max composite score: {scored_gdf['composite_score'].max():.1f} (highest risk)")

    # Top 5 highest risk
    top5 = scored_gdf.nlargest(5, "composite_score")
    print(f"\n  TOP 5 HIGHEST RISK NEIGHBORHOODS:")
    for _, row in top5.iterrows():
        desert = " [SAFETY DESERT]" if row["is_safety_desert"] else ""
        print(f"    {row['name']}: {row['composite_score']}{desert}")
        print(f"      311: {row['count_311']} | Code: {row['count_code_violations']} | Fire/Police: {row['dist_fire_police_km']}km")

    # Top 5 safest
    bot5 = scored_gdf.nsmallest(5, "composite_score")
    print(f"\n  TOP 5 SAFEST NEIGHBORHOODS:")
    for _, row in bot5.iterrows():
        print(f"    {row['name']}: {row['composite_score']}")

    # Step 5: Export
    export_neighborhoods(scored_gdf)
    export_facilities(scored_gdf)
    export_city_stats()

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
