#!/usr/bin/env python3
"""
MontgomeryPulse Data Pipeline - Step 1: Fetch all datasets from ArcGIS REST APIs
Outputs GeoJSON files to data/raw/
"""

import json
import os
import urllib.request
import urllib.parse
import ssl
import time

# Disable SSL verification for government servers that may have cert issues
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(RAW_DIR, exist_ok=True)

# All datasets with their correct layer URLs
DATASETS = {
    # --- CRITICAL: Point data for scoring ---
    "environmental_nuisance": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Environmental_Nuisance/FeatureServer/0",
        "has_geometry": True,
    },
    "code_violations": {
        "url": "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Code_Violations/FeatureServer/0",
        "has_geometry": True,
    },
    "311_service_requests": {
        "url": "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/MapServer/0",
        "has_geometry": True,
    },
    "fire_police_station": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Story_Map___Live__1__WFL1/FeatureServer/3",
        "has_geometry": True,
    },
    "tornado_shelter": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Tornado_Shelter/FeatureServer/0",
        "has_geometry": True,
    },
    "weather_sirens": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Weather_Sirens/FeatureServer/3",
        "has_geometry": True,
    },
    "community_centers": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Community_Center/FeatureServer/1",
        "has_geometry": True,
    },
    "food_scores": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Food_Scoring/FeatureServer/0",
        "has_geometry": True,
    },
    "education_facility": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Education_Facility/FeatureServer/0",
        "has_geometry": True,
    },
    "pharmacy_locator": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Pharmacy_Locator/FeatureServer/0",
        "has_geometry": True,
    },
    "parks_trails": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Park_and_Trail/FeatureServer/0",
        "has_geometry": True,
    },
    "traffic_engineering_requests": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Traffic_Engineering_Requests/FeatureServer/0",
        "has_geometry": True,
    },
    "point_of_interest": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Point_of_Interest/FeatureServer/0",
        "has_geometry": True,
    },
    "most_visited": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Most_Visited_Locations/FeatureServer/0",
        "has_geometry": True,
    },

    # --- CRITICAL: Polygon boundaries ---
    "zoning": {
        "url": "https://gis.montgomeryal.gov/server/rest/services/Zoning/MapServer/0",
        "has_geometry": True,
    },
    "city_limit": {
        "url": "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/City_Limit/MapServer/0",
        "has_geometry": True,
    },

    # --- Tables (no geometry) ---
    "911_calls": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/911_Calls_Data/FeatureServer/0",
        "has_geometry": False,
    },
    "traffic_kpi": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Traffic_Engineering_Key_Performance_Indicators/FeatureServer/0",
        "has_geometry": False,
    },
    "daily_population": {
        "url": "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/Daily_Population_Trends/FeatureServer/0",
        "has_geometry": False,
    },
}


def fetch_arcgis_layer(name, url, has_geometry, max_records=2000):
    """Fetch all records from an ArcGIS Feature/Map Server layer with pagination."""
    all_features = []
    offset = 0
    out_sr = "4326"  # WGS84

    print(f"  Fetching {name}...")

    while True:
        params = {
            "where": "1=1",
            "outFields": "*",
            "resultOffset": str(offset),
            "resultRecordCount": str(max_records),
            "f": "geojson" if has_geometry else "json",
        }
        if has_geometry:
            params["outSR"] = out_sr

        query_url = f"{url}/query?{urllib.parse.urlencode(params)}"

        try:
            req = urllib.request.Request(query_url)
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"    ERROR fetching {name} (offset={offset}): {e}")
            # Try without pagination
            if offset == 0:
                params.pop("resultOffset", None)
                params.pop("resultRecordCount", None)
                query_url = f"{url}/query?{urllib.parse.urlencode(params)}"
                try:
                    req = urllib.request.Request(query_url)
                    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                        data = json.loads(resp.read())
                except Exception as e2:
                    print(f"    FATAL ERROR: {e2}")
                    return None
            else:
                break

        if has_geometry:
            features = data.get("features", [])
        else:
            features = data.get("features", [])

        if not features:
            break

        all_features.extend(features)
        print(f"    Got {len(features)} records (total: {len(all_features)})")

        # Check if we got fewer than max, meaning no more pages
        if len(features) < max_records:
            break

        offset += max_records
        time.sleep(0.3)  # Be nice to the server

    print(f"    Total: {len(all_features)} records")

    if has_geometry:
        return {
            "type": "FeatureCollection",
            "features": all_features,
        }
    else:
        return {"features": all_features}


def main():
    print("=" * 60)
    print("MontgomeryPulse Data Fetcher")
    print("=" * 60)

    results = {}

    for name, config in DATASETS.items():
        print(f"\n[{name}]")
        data = fetch_arcgis_layer(name, config["url"], config["has_geometry"])

        if data:
            output_path = os.path.join(RAW_DIR, f"{name}.json")
            with open(output_path, "w") as f:
                json.dump(data, f)

            count = len(data.get("features", []))
            results[name] = {"status": "OK", "count": count, "path": output_path}
            print(f"    Saved to {output_path}")
        else:
            results[name] = {"status": "FAILED", "count": 0}
            print(f"    FAILED to fetch")

    # Summary
    print("\n" + "=" * 60)
    print("FETCH SUMMARY")
    print("=" * 60)
    for name, info in results.items():
        status = "✓" if info["status"] == "OK" else "✗"
        print(f"  {status} {name}: {info['count']} records")

    # Save summary
    with open(os.path.join(RAW_DIR, "_fetch_summary.json"), "w") as f:
        json.dump(results, f, indent=2)


if __name__ == "__main__":
    main()
