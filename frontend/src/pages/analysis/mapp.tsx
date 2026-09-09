import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TomTomMap, TrafficFlowModule } from "@tomtom-org/maps-sdk/map";
import { Marker, Popup } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import {
  applyMapTheme,
  applyTomTomTheme,
  baseStyle,
  ensureTomTomConfig,
  fitBoundsToCoordinates,
  KOLKATA_CENTER,
} from "../../components/map/helpers";
import {
  HEATMAP_CUSTOM,
  HEATMAP_TOMTOM,
  alertGeoPoints,
  ensureHeatmapSource,
  geoPointsToCoordinates,
  geoPointsToFeatures,
  updateHeatmapData,
} from "../../components/map/heatmap";
import {
  type TomTomIncident,
  incidentAnchor,
} from "../../components/map/incidentsApi";
import { useViewportIncidents } from "../../components/map/useViewportIncidents";
import { mapRenderMode } from "../../api/sources";
import { useAlerts } from "../../hooks/useAlerts";
import { useTheme } from "../../theme/useTheme";

const MAX_SEVERITY_MARKERS = 12;

export type MapMode = "traffic" | "speed" | "incidents" | "nodes";

const MAP_MODES: { id: MapMode; label: string }[] = [
  { id: "traffic", label: "Traffic" },
  { id: "speed", label: "Avg Speed" },
  { id: "incidents", label: "Incidents" },
  { id: "nodes", label: "Nodes" },
];

function MapModeSwitcher() {
  const [mode, setMode] = useState<MapMode>("traffic");
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95">
      {MAP_MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setMode(item.id)}
          aria-pressed={mode === item.id}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            mode === item.id
              ? "bg-blue-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function getFeatures(incidents: TomTomIncident[]): Feature[] {
  return incidents
    .filter(
      (incident) =>
        incident.geometry && (incident.geometry.coordinates as unknown) != null,
    )
    .map((incident) => ({
      type: "Feature" as const,
      properties: {
        severity: Math.min(
          (incident.properties?.magnitudeOfDelay || 1) / 5,
          1.0,
        ),
      },
      geometry: incident.geometry as Geometry,
    }));
}

function severityRank(incident: TomTomIncident): number {
  const magnitude = incident.properties?.magnitudeOfDelay ?? 0;
  return magnitude === 4 ? 5 : magnitude;
}

const SEVERITY_COLORS: Record<number, string> = {
  0: "#94a3b8",
  1: "#22c55e",
  2: "#eab308",
  3: "#f97316",
  4: "#dc2626",
};

const SEVERITY_LABELS: Record<number, string> = {
  0: "Unknown",
  1: "Minor delay",
  2: "Moderate delay",
  3: "Major delay",
  4: "Road closure",
};

function incidentId(incident: TomTomIncident): string {
  const id = incident.properties?.id;
  if (id) return id;
  const anchor = incidentAnchor(incident);
  return `${anchor[0].toFixed(4)},${anchor[1].toFixed(4)}`;
}

function buildIncidentPopup(incident: TomTomIncident): HTMLElement {
  const container = document.createElement("div");
  container.className = "w-56 px-1.5 py-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-slate-900 dark:text-slate-100";
  title.textContent =
    incident.properties?.events?.[0]?.description ?? "Traffic incident";
  container.appendChild(title);

  const from = incident.properties?.from;
  const to = incident.properties?.to;
  if (from || to) {
    const location = document.createElement("p");
    location.className = "mt-0.5 text-xs text-slate-500 dark:text-slate-400";
    location.textContent = [from, to].filter(Boolean).join(" \u2192 ");
    container.appendChild(location);
  }

  const rank = severityRank(incident);
  const meta = document.createElement("p");
  meta.className =
    "mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300";
  const dot = document.createElement("span");
  dot.className = "inline-block h-2 w-2 rounded-full";
  dot.style.backgroundColor = SEVERITY_COLORS[rank] ?? "#94a3b8";
  const label = document.createElement("span");
  label.textContent = SEVERITY_LABELS[rank] ?? "Unknown";
  meta.appendChild(dot);
  meta.appendChild(label);
  container.appendChild(meta);

  return container;
}

function createSeverityMarker(
  map: MapLibreMap,
  incident: TomTomIncident,
): Marker {
  const rank = severityRank(incident);
  const element = document.createElement("div");
  element.style.cssText =
    `width:12px;height:12px;border-radius:50%;cursor:pointer;` +
    `background:${SEVERITY_COLORS[rank] ?? "#94a3b8"};` +
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);";

  const marker = new Marker({ element })
    .setLngLat(incidentAnchor(incident))
    .setPopup(
      new Popup({ offset: 12, closeButton: false }).setDOMContent(
        buildIncidentPopup(incident),
      ),
    )
    .addTo(map);
  return marker;
}

function syncSeverityMarkers(
  map: MapLibreMap,
  incidents: TomTomIncident[],
  markers: Map<string, Marker>,
): void {
  const top = [...incidents]
    .sort((a, b) => severityRank(b) - severityRank(a))
    .slice(0, MAX_SEVERITY_MARKERS);

  const keep = new Set<string>();
  for (const incident of top) {
    const id = incidentId(incident);
    keep.add(id);
    if (markers.has(id)) continue;
    markers.set(id, createSeverityMarker(map, incident));
  }

  for (const [id, marker] of markers) {
    if (keep.has(id)) continue;
    marker.remove();
    markers.delete(id);
  }
}

function clearSeverityMarkers(markers: Map<string, Marker>): void {
  for (const marker of markers.values()) marker.remove();
  markers.clear();
}

function formatRelativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes === 1) return "1m ago";
  return `${minutes}m ago`;
}

function statusPillText(
  loading: boolean,
  empty: boolean,
  hasError: boolean,
  liveCount: number,
  since: number,
): string {
  if (loading && empty) return "Updating\u2026";
  if (hasError && empty) return "Update failed";
  return `${liveCount} incident${liveCount === 1 ? "" : "s"} \u00b7 updated ${formatRelativeTime(since, Date.now())}`;
}

function TomTomTrafficView() {
  const mapInstance = useRef<TomTomMap | null>(null);
  const severityMarkers = useRef<Map<string, Marker>>(new Map());
  const { resolvedTheme } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    ensureTomTomConfig();

    const markers = severityMarkers.current;

    const map = new TomTomMap({
      mapLibre: {
        container: "sdk-map",
        center: KOLKATA_CENTER,
        zoom: 11,
      },
    });
    mapInstance.current = map;

    TrafficFlowModule.get(map, { visible: true }).then((trafficFlowModule) => {
      trafficFlowModule.filter({
        any: [
          {
            roadCategories: {
              show: "only",
              values: [
                "motorway",
                "motorway_link",
                "trunk",
                "trunk_link",
                "primary",
                "primary_link",
                "secondary",
                "secondary_link",
                "tertiary",
                "tertiary_link",
                "street",
                "service",
                "track",
              ],
            },
          },
        ],
      });
    });

    return () => {
      clearSeverityMarkers(markers);
      map.mapLibreMap.remove();
      mapInstance.current = null;
    };
  }, []);

  const { state } = useViewportIncidents({
    getMap: () => mapInstance.current?.mapLibreMap ?? null,
    onUpdate: (incidents) => {
      const map = mapInstance.current?.mapLibreMap;
      if (!map) return;
      const apply = () => {
        ensureHeatmapSource(map, HEATMAP_TOMTOM);
        updateHeatmapData(map, getFeatures(incidents));
        syncSeverityMarkers(map, incidents, severityMarkers.current);
      };
      if (map.loaded()) {
        apply();
      } else {
        map.once("load", apply);
      }
    },
  });

  useEffect(() => {
    if (mapInstance.current) {
      applyTomTomTheme(mapInstance.current, resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
      <MapModeSwitcher />
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300">
        <span className="relative flex h-2 w-2">
          {state.status === "loading" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              state.status === "error"
                ? "bg-red-500"
                : state.status === "live"
                  ? "bg-emerald-500"
                  : "bg-slate-400"
            }`}
          />
        </span>
        {state.status === "idle"
          ? "Waiting\u2026"
          : state.status === "loading"
            ? "Updating\u2026"
            : state.status === "error"
              ? "Update failed"
              : `${state.incidentCount} incident${state.incidentCount === 1 ? "" : "s"} \u00b7 updated ${state.lastUpdatedAt ? formatRelativeTime(state.lastUpdatedAt, now) : "just now"}`}
      </div>
      <div id="sdk-map" className="h-full min-h-[300px] w-full" />
    </div>
  );
}

function CustomTrafficView() {
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markersFitted = useRef(false);
  const lastSync = useRef(0);
  const { resolvedTheme } = useTheme();
  const { items, loading, error } = useAlerts();
  const [pillText, setPillText] = useState("Updating\u2026");

  useEffect(() => {
    const map = new maplibregl.Map({
      container: "sdk-map",
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 11,
    });
    mapInstance.current = map;
    lastSync.current = Date.now();

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      applyMapTheme(mapInstance.current, resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const points = alertGeoPoints(items);
    const applyMarkers = () => {
      ensureHeatmapSource(map, HEATMAP_CUSTOM);
      updateHeatmapData(map, geoPointsToFeatures(points));
      if (!markersFitted.current && points.length > 0) {
        markersFitted.current = true;
        fitBoundsToCoordinates(map, geoPointsToCoordinates(points), 90);
      }
      lastSync.current = Date.now();
    };

    if (map.loaded()) {
      applyMarkers();
    } else {
      map.once("load", applyMarkers);
    }
  }, [items]);

  const liveCount = alertGeoPoints(items).length;
  const empty = items.length === 0;

  useEffect(() => {
    const update = () =>
      setPillText(
        statusPillText(
          loading,
          empty,
          Boolean(error),
          liveCount,
          lastSync.current,
        ),
      );
    queueMicrotask(update);
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, [loading, empty, error, liveCount]);

  return (
    <div className="relative flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
      <MapModeSwitcher />
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300">
        <span className="relative flex h-2 w-2">
          {loading && empty && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              error && empty
                ? "bg-red-500"
                : loading && empty
                  ? "bg-slate-400"
                  : "bg-emerald-500"
            }`}
          />
        </span>
        {pillText}
      </div>
      <div id="sdk-map" className="h-full min-h-[300px] w-full" />
    </div>
  );
}

const Mapp = () =>
  mapRenderMode === "tomtom" ? <TomTomTrafficView /> : <CustomTrafficView />;

export default Mapp;
