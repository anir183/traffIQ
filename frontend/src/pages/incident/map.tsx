import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Popup } from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import {
  baseStyle,
  applyMapTheme,
  addPulseMarker,
  bindMarkerDetails,
  KOLKATA_CENTER,
  fitBoundsToCoordinates,
} from "../../components/map/helpers";
import { buildAlertPopup } from "../../components/map/alertPopup";
import { useTheme } from "../../theme/useTheme";
import { useStoredAlerts } from "../../hooks/useAlerts";
import {
  mapIncidentPoints,
  type IncidentMarkerPoint,
} from "../../types/ui/adapters";
import type { AlertSeverity } from "../../types/contract/alert";

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#22c55e",
};

const RESOLVED_COLOR = "#94a3b8";

const LEGEND: { label: string; color: string }[] = [
  { label: "High", color: SEVERITY_COLORS.high },
  { label: "Medium", color: SEVERITY_COLORS.medium },
  { label: "Low", color: SEVERITY_COLORS.low },
  { label: "Resolved", color: RESOLVED_COLOR },
];

function clearMarkers(markers: Marker[]): void {
  for (const marker of markers) marker.remove();
  markers.length = 0;
}

function drawMarkers(map: MapLibreMap, points: IncidentMarkerPoint[]): void {
  for (const point of points) {
    const active = point.alert.status === "active";
    const color =
      point.alert.status === "resolved"
        ? RESOLVED_COLOR
        : SEVERITY_COLORS[point.severity];
    const marker = addPulseMarker(
      map,
      [point.lng, point.lat],
      color,
      "sm",
      active,
    );
    const popup = new Popup({
      offset: 12,
      closeButton: false,
      maxWidth: "15rem",
    }).setDOMContent(buildAlertPopup(point.alert));
    marker.setPopup(popup);
    bindMarkerDetails(map, marker, popup, point.alert.title);
  }
  fitBoundsToCoordinates(
    map,
    points.map((point) => [point.lng, point.lat]),
    90,
  );
}

export default function IncidentMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const mapMarkers = useRef<Marker[]>([]);
  const pointsRef = useRef<IncidentMarkerPoint[]>([]);
  const { resolvedTheme } = useTheme();
  const { items, loading, error } = useStoredAlerts();
  const points = useMemo(() => mapIncidentPoints(items, true), [items]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!mapRef.current) return;
    const markers = mapMarkers.current;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 12,
    });
    mapInstance.current = map;
    return () => {
      clearMarkers(markers);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const markers = mapMarkers.current;
    const apply = () => {
      clearMarkers(markers);
      drawMarkers(map, pointsRef.current);
    };
    if (map.loaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [points]);

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
        className="relative min-h-72 w-full flex-1 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700"
      >
        {loading && points.length === 0 && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Loading incidents…
          </div>
        )}
        {!loading && points.length === 0 && !error && (
          <div className="absolute left-3 top-3 z-10 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-400">
            No incidents to display
          </div>
        )}
      </div>
    </div>
  );
}
