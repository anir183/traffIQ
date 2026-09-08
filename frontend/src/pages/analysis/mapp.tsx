import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { TomTomMap, TrafficFlowModule } from "@tomtom-org/maps-sdk/map";
import { Marker, Popup } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import {
  ensureTomTomConfig,
  applyTomTomTheme,
  KOLKATA_CENTER,
} from "../../components/map/helpers";
import {
  type TomTomIncident,
  incidentAnchor,
} from "../../components/map/incidentsApi";
import { useViewportIncidents } from "../../components/map/useViewportIncidents";
import { useTheme } from "../../theme/useTheme";

const MAX_SEVERITY_MARKERS = 12;

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

function setupHeatmap(map: MapLibreMap): void {
  map.addSource("traffic-heatmap-source", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  map.addLayer({
    id: "live-traffic-heatmap",
    type: "heatmap",
    source: "traffic-heatmap-source",
    paint: {
      "heatmap-weight": ["get", "severity"],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0, 0, 255, 0)",
        0.2,
        "rgb(0, 128, 255)",
        0.4,
        "rgb(0, 255, 0)",
        0.6,
        "rgb(255, 255, 0)",
        0.8,
        "rgb(255, 128, 0)",
        1.0,
        "rgb(255, 0, 0)",
      ],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 15, 18, 40],
      "heatmap-opacity": 0.85,
    },
  });
}

function ensureHeatmapSource(map: MapLibreMap): void {
  if (map.getSource("traffic-heatmap-source")) return;
  if (map.getLayer("live-traffic-heatmap")) {
    map.removeLayer("live-traffic-heatmap");
  }
  setupHeatmap(map);
}

function updateHeatmapData(
  map: MapLibreMap,
  incidents: TomTomIncident[],
): void {
  const source = map.getSource("traffic-heatmap-source") as
    GeoJSONSource | undefined;
  if (!source) return;
  source.setData({
    type: "FeatureCollection",
    features: getFeatures(incidents),
  });
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

const Mapp = () => {
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
      ensureHeatmapSource(map);
      updateHeatmapData(map, incidents);
      syncSeverityMarkers(map, incidents, severityMarkers.current);
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
};

export default Mapp;
