import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map, Marker } from "maplibre-gl";
import {
  baseStyle,
  applyMapTheme,
  fitBoundsToCoordinates,
  KOLKATA_CENTER,
} from "../../components/map/helpers";
import { useTheme } from "../../theme/useTheme";

const HISTORY_API_URL =
  import.meta.env.VITE_HISTORY_API_URL ??
  "https://traffiq-backend-k1tw.onrender.com/api/vehicles/trajectory";

// Helper to add numbered markers to show flow
function addNumberedMarker(map: Map, lngLat: [number, number], num: number): Marker {
  const el = document.createElement("div");
  const isStart = num === 1;
  const bg = isStart ? "#2563eb" : "#dc2626"; // Start is blue, rest are red
  el.style.cssText =
    `width:24px;height:24px;border-radius:50%;background:${bg};` +
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);" + 
    "color:#fff;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;";
  el.innerText = num.toString();
  return new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
}

function updateOrAddLineLayer(map: Map, id: string, coordinates: [number, number][], color: string, width = 4) {
  const existingSource = map.getSource(id) as maplibregl.GeoJSONSource;
  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
    properties: {},
  };

  if (existingSource) {
    existingSource.setData(data);
  } else {
    map.addLayer({
      id,
      type: "line",
      source: {
        type: "geojson",
        data,
      },
      paint: {
        "line-color": color,
        "line-width": width,
      },
    });
  }
}

export default function VehicleTrajectoryMap({ plate }: { plate: string }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const { resolvedTheme } = useTheme();
  
  const [points, setPoints] = useState<[number, number][]>([]);

  // 1. Fetch trajectory data directly from the history API
  useEffect(() => {
    if (!plate) {
      setPoints([]);
      return;
    }
    let active = true;

    const url = new URL(HISTORY_API_URL);
    // Backend expects "plateNumber"
    url.searchParams.append("plateNumber", plate);

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trajectory");
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const trajectory = json?.trajectory || [];
        
        // Extract coordinates robustly and sort by time (oldest to newest)
        const parsed = trajectory
          .map((item: any) => {
            const loc = item.location || {};
            // Aggressive fallback to catch coordinates in different formats
            const lat = Number(
              item.latitude ?? item.Latitude ?? item.lat ?? item.Lat ?? 
              loc.latitude ?? loc.lat ?? 
              (loc.coordinates ? loc.coordinates[1] : undefined)
            );
            const lng = Number(
              item.longitude ?? item.Longitude ?? item.lng ?? item.Lng ?? item.long ?? item.Long ??
              loc.longitude ?? loc.lng ?? 
              (loc.coordinates ? loc.coordinates[0] : undefined)
            );
            const time = item.timestamp ?? item.Timestamp ?? item.time ?? item.Time ?? item.detectedAt ?? "";
            return { lat, lng, time };
          })
          .filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0)
          .sort((a: any, b: any) => a.time.localeCompare(b.time));

        setPoints(parsed.map((p: any) => [p.lng, p.lat]));
      })
      .catch((err) => {
        console.error("Map trajectory error:", err);
        if (active) setPoints([]);
      });

    return () => {
      active = false;
    };
  }, [plate]);

  // 2. Initialize the Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 11,
    });
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 3. Draw the points and flow
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const draw = () => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (points.length === 0) {
        // Clear lines if we have no points
        if (map.getSource("vehicle-path")) {
           (map.getSource("vehicle-path") as maplibregl.GeoJSONSource).setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
        }
        if (map.getSource("bbox-layer")) {
           (map.getSource("bbox-layer") as maplibregl.GeoJSONSource).setData({ type: "Feature", geometry: { type: "Polygon", coordinates: [] }, properties: {} });
        }
        return;
      }

      // Draw the path line connecting the points
      updateOrAddLineLayer(map, "vehicle-path", points, "#dc2626", 4);
      
      // Add numbered markers to show the flow
      points.forEach((lngLat, i) => {
        const marker = addNumberedMarker(map, lngLat, i + 1);
        markersRef.current.push(marker);
      });

      // Fit map to show all points and draw bounding box
      requestAnimationFrame(() => {
        map.resize(); // Fix map zero-dimensions before centering
        
        if (points.length === 1) {
           map.jumpTo({ center: points[0], zoom: 14 });
           
           if (map.getSource("bbox-layer")) {
              (map.getSource("bbox-layer") as maplibregl.GeoJSONSource).setData({ type: "Feature", geometry: { type: "Polygon", coordinates: [] }, properties: {} });
           }
        } else if (points.length > 1) {
           fitBoundsToCoordinates(map, points, 70);
           
           // Create a visible box containing all the nodes
           const bounds = new maplibregl.LngLatBounds();
           points.forEach(p => bounds.extend(p as [number, number]));
           const sw = bounds.getSouthWest();
           const ne = bounds.getNorthEast();
           
           // Coordinates for a rectangle: SW, SE, NE, NW, SW
           const bboxCoords = [
             [sw.lng, sw.lat],
             [ne.lng, sw.lat],
             [ne.lng, ne.lat],
             [sw.lng, ne.lat],
             [sw.lng, sw.lat]
           ];
           
           const bboxSource = map.getSource("bbox-layer") as maplibregl.GeoJSONSource;
           const bboxData: GeoJSON.Feature<GeoJSON.Polygon> = {
             type: "Feature",
             geometry: { type: "Polygon", coordinates: [bboxCoords] },
             properties: {}
           };
           
           if (bboxSource) {
             bboxSource.setData(bboxData);
           } else {
             map.addLayer({
               id: "bbox-layer-fill",
               type: "fill",
               source: { type: "geojson", data: bboxData },
               paint: {
                 "fill-color": "#94a3b8", // slate-400
                 "fill-opacity": 0.15
               }
             });
             map.addLayer({
               id: "bbox-layer",
               type: "line",
               source: "bbox-layer-fill", // reuse source
               paint: {
                 "line-color": "#475569", // slate-600
                 "line-width": 2,
                 "line-dasharray": [4, 4]
               }
             });
           }
        }
      });
    };

    if (map.loaded()) {
      draw();
    } else {
      map.once("load", draw);
    }
  }, [points]);

  // 4. Update map theme (Dark/Light mode)
  useEffect(() => {
    if (mapInstance.current) {
      applyMapTheme(mapInstance.current, resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Vehicle Trajectory
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">1</span>
            Oldest Node
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">2</span>
            Newer Nodes
          </span>
        </div>
      </div>

      <div
        ref={mapRef}
        className="min-h-72 w-full flex-1 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700"
      />
    </div>
  );
}
