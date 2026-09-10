import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TomTomMap } from "@tomtom-org/maps-sdk/map";
import { Marker, Popup } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import {
  applyMapTheme,
  applyTomTomTheme,
  baseStyle,
  bindMarkerDetails,
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
  ensureTrafficTiles,
  FLOW_LAYER_ABSOLUTE,
  FLOW_LAYER_RELATIVE,
  FLOW_POINTS_LAYER,
  FLOW_ROADS_LAYER,
  INCIDENT_HEATMAP_LAYER,
  setFlowPointsVisibility,
  setFlowSamplesVisibility,
  setLayerVisibility,
  syncFlowSamples,
} from "../../components/map/overlays";
import { bindFeatureHoverPopup } from "../../components/map/interaction";
import {
  type TomTomIncident,
  incidentAnchor,
} from "../../components/map/incidentsApi";
import { fetchRoadFlow, type FlowSample } from "../../api/tomtom/flow";
import { tomtomKeyIsSet } from "../../api/tomtom/keys";
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

interface MapModeSwitcherProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

function MapModeSwitcher({ mode, onChange }: MapModeSwitcherProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95">
      {MAP_MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
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

function popupRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "mt-1 flex justify-between gap-3 text-xs";
  const labelEl = document.createElement("span");
  labelEl.className = "shrink-0 text-slate-600";
  labelEl.textContent = label;
  const valueEl = document.createElement("span");
  valueEl.className = "text-right font-medium text-slate-800";
  valueEl.textContent = value;
  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function buildFlowSamplePopup(props: Record<string, unknown>): HTMLElement {
  const container = document.createElement("div");
  container.className = "w-52 px-1.5 py-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-slate-900";
  title.textContent = String(props.name ?? "Road");
  container.appendChild(title);

  const speed = props.currentSpeed;
  const free = props.freeFlowSpeed;
  if (typeof speed === "number") {
    container.appendChild(popupRow("Avg speed", `${speed} km/h`));
  }
  if (typeof free === "number") {
    container.appendChild(popupRow("Free-flow", `${free} km/h`));
  }
  if (typeof props.congestion === "number") {
    container.appendChild(popupRow("Congestion", `${props.congestion}%`));
  }
  if (typeof props.confidence === "number") {
    container.appendChild(popupRow("Confidence", `${props.confidence}%`));
  }
  if (typeof speed !== "number") {
    const note = document.createElement("p");
    note.className = "mt-1 text-xs text-slate-600";
    note.textContent =
      props.hasFlow === true
        ? "Live flow data pending\u2026"
        : "No live flow data for this road";
    container.appendChild(note);
  }

  return container;
}

function buildIncidentPopup(incident: TomTomIncident): HTMLElement {
  const container = document.createElement("div");
  container.className = "w-56 px-1.5 py-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-slate-900";
  title.textContent =
    incident.properties?.events?.[0]?.description ?? "Traffic incident";
  container.appendChild(title);

  const from = incident.properties?.from;
  const to = incident.properties?.to;
  if (from || to) {
    const location = document.createElement("p");
    location.className = "mt-0.5 text-xs text-slate-600";
    location.textContent = [from, to].filter(Boolean).join(" \u2192 ");
    container.appendChild(location);
  }

  const rank = severityRank(incident);
  const meta = document.createElement("p");
  meta.className =
    "mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700";
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
  const description =
    incident.properties?.events?.[0]?.description ?? "Traffic incident";
  const element = document.createElement("div");
  element.style.cssText =
    `width:12px;height:12px;border-radius:50%;cursor:pointer;` +
    `background:${SEVERITY_COLORS[rank] ?? "#94a3b8"};` +
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);";

  const popup = new Popup({ offset: 12, closeButton: false }).setDOMContent(
    buildIncidentPopup(incident),
  );
  const marker = new Marker({ element })
    .setLngLat(incidentAnchor(incident))
    .setPopup(popup)
    .addTo(map);
  bindMarkerDetails(map, marker, popup, description);
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

function StatusPill({
  statusText,
  loading,
}: {
  statusText: string;
  loading: boolean;
}) {
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300">
      <span className="relative flex h-2 w-2">
        {loading && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            loading ? "bg-blue-500" : "bg-emerald-500"
          }`}
        />
      </span>
      {statusText}
    </div>
  );
}

function TomTomTrafficView() {
  const mapInstance = useRef<TomTomMap | null>(null);
  const severityMarkers = useRef<Map<string, Marker>>(new Map());
  const incidentsRef = useRef<TomTomIncident[]>([]);
  const samplesRef = useRef<FlowSample[] | null>(null);
  const modeRef = useRef<MapMode>("traffic");
  const { resolvedTheme } = useTheme();
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<MapMode>("traffic");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const syncIncidentLayers = useCallback((map: MapLibreMap): void => {
    if (modeRef.current !== "incidents") {
      clearSeverityMarkers(severityMarkers.current);
      return;
    }
    const apply = () => {
      ensureHeatmapSource(map, HEATMAP_TOMTOM);
      updateHeatmapData(map, getFeatures(incidentsRef.current));
      syncSeverityMarkers(map, incidentsRef.current, severityMarkers.current);
    };
    if (map.loaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, []);

  const applyMode = useCallback(
    (map: MapLibreMap, next: MapMode): void => {
      ensureTrafficTiles(map);
      syncFlowSamples(map, samplesRef.current);
      setLayerVisibility(map, FLOW_LAYER_RELATIVE, next === "traffic");
      setLayerVisibility(map, FLOW_LAYER_ABSOLUTE, next === "speed");
      setLayerVisibility(map, INCIDENT_HEATMAP_LAYER, next === "incidents");
      setFlowSamplesVisibility(map, next !== "incidents");
      setFlowPointsVisibility(map, next === "nodes");
      syncIncidentLayers(map);
    },
    [syncIncidentLayers],
  );

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

    const mapLibre = map.mapLibreMap;
    const onLoad = () => {
      ensureTrafficTiles(mapLibre);
      applyMode(mapLibre, modeRef.current);
    };
    mapLibre.on("load", onLoad);

    return () => {
      mapLibre.off("load", onLoad);
      clearSeverityMarkers(markers);
      mapLibre.remove();
      mapInstance.current = null;
    };
  }, [applyMode]);

  useEffect(() => {
    if (!tomtomKeyIsSet()) return;
    let cancelled = false;
    fetchRoadFlow()
      .then((samples) => {
        if (cancelled) return;
        samplesRef.current = samples;
        const map = mapInstance.current;
        if (map?.mapLibreMap.loaded()) {
          applyMode(map.mapLibreMap, modeRef.current);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applyMode]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    return bindFeatureHoverPopup(
      map.mapLibreMap,
      [FLOW_ROADS_LAYER, FLOW_POINTS_LAYER],
      () => modeRef.current !== "incidents",
      buildFlowSamplePopup,
    );
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const mapLibre = map.mapLibreMap;
    if (mapLibre.loaded()) {
      applyMode(mapLibre, mode);
    } else {
      mapLibre.once("load", () => applyMode(mapLibre, mode));
    }
  }, [mode, applyMode]);

  const syncIncidentLayersRef = useRef(syncIncidentLayers);
  useEffect(() => {
    syncIncidentLayersRef.current = syncIncidentLayers;
  }, [syncIncidentLayers]);

  const { state, refresh } = useViewportIncidents({
    getMap: () => mapInstance.current?.mapLibreMap ?? null,
    onUpdate: useCallback((incidents: TomTomIncident[]) => {
      incidentsRef.current = incidents;
      const map = mapInstance.current;
      if (!map) return;
      syncIncidentLayersRef.current(map.mapLibreMap);
    }, []),
  });

  useEffect(() => {
    if (mode === "incidents") {
      const map = mapInstance.current;
      if (!map || map.mapLibreMap.loaded()) refresh();
    }
  }, [mode, refresh]);

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
      <MapModeSwitcher mode={mode} onChange={setMode} />
      <StatusPill
        loading={state.status === "idle" || state.status === "loading"}
        statusText={
          state.status === "idle"
            ? "Loading incidents\u2026"
            : state.status === "loading"
              ? "Updating\u2026"
              : state.status === "error"
                ? "Update failed"
                : `${state.incidentCount} incident${state.incidentCount === 1 ? "" : "s"} \u00b7 updated ${state.lastUpdatedAt ? formatRelativeTime(state.lastUpdatedAt, now) : "just now"}`
        }
      />
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
  const [pillText, setPillText] = useState("Loading incidents\u2026");
  const [mode, setMode] = useState<MapMode>("incidents");
  const modeRef = useRef<MapMode>("incidents");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const applyMode = useCallback((map: MapLibreMap, next: MapMode): void => {
    syncFlowSamples(map, null);
    setLayerVisibility(map, INCIDENT_HEATMAP_LAYER, next === "incidents");
    setFlowSamplesVisibility(map, next === "nodes");
    setFlowPointsVisibility(map, next === "nodes");
  }, []);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: "sdk-map",
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 11,
    });
    mapInstance.current = map;
    lastSync.current = Date.now();

    const onLoad = () => applyMode(map, modeRef.current);
    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      map.remove();
      mapInstance.current = null;
    };
  }, [applyMode]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    return bindFeatureHoverPopup(
      map,
      [FLOW_ROADS_LAYER, FLOW_POINTS_LAYER],
      () => modeRef.current === "nodes",
      buildFlowSamplePopup,
    );
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (map.loaded()) {
      applyMode(map, mode);
    } else {
      map.once("load", () => applyMode(map, mode));
    }
  }, [mode, applyMode]);

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
      <MapModeSwitcher mode={mode} onChange={setMode} />
      <StatusPill loading={loading && empty} statusText={pillText} />
      <div id="sdk-map" className="h-full min-h-[300px] w-full" />
    </div>
  );
}

const Mapp = () =>
  mapRenderMode === "tomtom" ? <TomTomTrafficView /> : <CustomTrafficView />;

export default Mapp;
