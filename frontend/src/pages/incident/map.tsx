import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map } from "maplibre-gl";
import {
  baseStyle,
  applyMapTheme,
  addPulseMarker,
  KOLKATA_CENTER,
  fitBoundsToCoordinates,
} from "../../components/map/helpers";
import { useTheme } from "../../theme/useTheme";
import { useAlerts } from "../../hooks/useAlerts";
import { mapAlertMarkers } from "../../types/ui/adapters";

const LEGEND = [
  { label: "Normal", color: "#22c55e" },
  { label: "Moderate", color: "#eab308" },
  { label: "Heavy", color: "#f97316" },
  { label: "Incident", color: "#dc2626" },
];

function drawMarkers(map: Map, markers: [number, number][]): void {
  if (markers.length === 0) return;
  markers.forEach(([lng, lat]) => addPulseMarker(map, [lng, lat]));
  if (markers.length > 1) {
    fitBoundsToCoordinates(map, markers, 90);
  }
}

export default function IncidentMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const drawnKey = useRef("");
  const { resolvedTheme } = useTheme();
  const { items } = useAlerts();
  const markers = mapAlertMarkers(items);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 12,
    });
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || markers.length === 0) return;
    const key = JSON.stringify(markers);
    if (drawnKey.current === key) return;
    drawnKey.current = key;
    if (map.loaded()) {
      drawMarkers(map, markers);
    } else {
      map.once("load", () => drawMarkers(map, markers));
    }
  }, [markers]);

  useEffect(() => {
    if (mapInstance.current) {
      applyMapTheme(mapInstance.current, resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Incident Map
        </h3>
      </div>

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div
        ref={mapRef}
        className="min-h-72 w-full flex-1 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700"
      />
    </div>
  );
}
