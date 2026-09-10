import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TomTomMap } from "@tomtom-org/maps-sdk/map";
import { Marker, Popup } from "maplibre-gl";
import type { Map as MapLibreMap, MapSourceDataEvent } from "maplibre-gl";
import {
  applyMapTheme,
  applyTomTomTheme,
  addPulseMarker,
  baseStyle,
  bindMarkerDetails,
  ensureTomTomConfig,
  fitBoundsToCoordinates,
  KOLKATA_CENTER,
} from "../../components/map/helpers";
import {
  HEATMAP_FLOW_SPEED,
  HEATMAP_HOVER_LAYER,
  HEATMAP_LAYER_ID,
  HEATMAP_TOMTOM,
  applyHeatmapStops,
  ensureHeatmapSource,
  updateHeatmapData,
} from "../../components/map/heatmap";
import {
  FLOW_NODE_ICONS_LAYER,
  FLOW_POINTS_LAYER,
  FLOW_ROADS_HOVER_LAYER,
  FLOW_ROADS_LAYER,
  INCIDENT_HEATMAP_LAYER,
  flowHeatmapFeatures,
  registerCameraIcon,
  setFlowNodeMarkersVisibility,
  setFlowSamplesVisibility,
  setLayerVisibility,
  syncFlowSamples,
} from "../../components/map/overlays";
import {
  bindFeatureHoverPopup,
  closeHoverPopups,
} from "../../components/map/interaction";
import { speedHeatmapFeatures } from "../../components/map/flowHeatmap";
import { buildAlertPopup } from "../../components/map/alertPopup";
import {
  type TomTomIncident,
  incidentAnchor,
} from "../../components/map/incidentsApi";
import { fetchRoadFlow, type FlowSample } from "../../api/tomtom/flow";
import {
  FLOW_SOURCE_ID,
  harvestFlowSamples,
  isFlowSegmentFeature,
  normalizeFlowFeatureProps,
  startFlowModule,
  type FlowModule,
} from "../../api/tomtom/viewportFlow";
import { tomtomKeyIsSet } from "../../api/tomtom/keys";
import { useViewportIncidents } from "../../components/map/useViewportIncidents";
import { mapRenderMode } from "../../api/sources";
import { useAlerts } from "../../hooks/useAlerts";
import { useTheme } from "../../theme/useTheme";
import {
  mapIncidentPoints,
  type IncidentMarkerPoint,
} from "../../types/ui/adapters";
import type { Bbox } from "../../components/map/incidentsApi";
import type { AlertSeverity } from "../../types/contract/alert";
import { useMapViewport } from "../../contexts/mapViewport";
import { bboxFromMap } from "../../components/map/useViewportIncidents";

const MAX_SEVERITY_MARKERS = 40;

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

interface TrafficStatus {
  label: string;
  color: string;
}

function trafficStatusLabel(props: Record<string, unknown>): TrafficStatus {
  if (props.closed === true) {
    return { label: "Road closed", color: "#dc2626" };
  }
  const congestion = props.congestion;
  if (typeof congestion === "number") {
    if (congestion >= 60) return { label: "Congested", color: "#dc2626" };
    if (congestion >= 30) return { label: "Heavy traffic", color: "#f59e0b" };
    return { label: "Free-flow", color: "#22c55e" };
  }
  return { label: "No live data", color: "#94a3b8" };
}

function buildFlowSamplePopup(props: Record<string, unknown>): HTMLElement {
  const container = document.createElement("div");
  container.className = "w-52 px-1.5 py-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-slate-900";
  title.textContent = String(props.name ?? "Road");
  container.appendChild(title);

  const status = trafficStatusLabel(props);
  const chip = document.createElement("span");
  chip.className =
    "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white";
  chip.style.backgroundColor = status.color;
  chip.textContent = status.label;
  container.appendChild(chip);

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
  const color = SEVERITY_COLORS[rank] ?? "#94a3b8";
  const anchor = incidentAnchor(incident);
  const marker = addPulseMarker(map, [anchor[0], anchor[1]], color, "lg");

  const popup = new Popup({ offset: 12, closeButton: false }).setDOMContent(
    buildIncidentPopup(incident),
  );
  marker.setPopup(popup);
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

const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#22c55e",
};

function createAlertMarker(
  map: MapLibreMap,
  point: IncidentMarkerPoint,
): Marker {
  const marker = addPulseMarker(
    map,
    [point.lng, point.lat],
    ALERT_SEVERITY_COLORS[point.severity],
  );
  const popup = new Popup({ offset: 12, closeButton: false }).setDOMContent(
    buildAlertPopup(point.alert),
  );
  marker.setPopup(popup);
  bindMarkerDetails(map, marker, popup, point.alert.title);
  return marker;
}

function syncAlertMarkers(
  map: MapLibreMap,
  points: IncidentMarkerPoint[],
  markers: Map<string, Marker>,
  fit: (coordinates: [number, number][]) => void,
): void {
  const keep = new Set<string>();
  for (const point of points) {
    keep.add(point.alert.alert_id);
    if (markers.has(point.alert.alert_id)) continue;
    markers.set(point.alert.alert_id, createAlertMarker(map, point));
  }
  for (const [id, marker] of markers) {
    if (keep.has(id)) continue;
    marker.remove();
    markers.delete(id);
  }
  if (points.length > 0) fit(points.map((point) => [point.lng, point.lat]));
}

function clearAlertMarkers(markers: Map<string, Marker>): void {
  for (const marker of markers.values()) marker.remove();
  markers.clear();
}

function bindViewportBroadcast(
  map: MapLibreMap,
  setBbox: (bbox: Bbox | null) => void,
): () => void {
  let timer: number | undefined;
  const onMoveEnd = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = undefined;
      setBbox(bboxFromMap(map));
    }, 300);
  };
  map.on("moveend", onMoveEnd);
  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    map.off("moveend", onMoveEnd);
  };
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
  const flowModuleRef = useRef<FlowModule | null>(null);
  const heatmapTimerRef = useRef<number | null>(null);
  const lastSpeedRefreshRef = useRef(0);
  const watchdogTimerRef = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();
  const { setBbox } = useMapViewport();
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<MapMode>("traffic");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const syncIncidentMarkers = useCallback((map: MapLibreMap): void => {
    if (modeRef.current !== "incidents") {
      clearSeverityMarkers(severityMarkers.current);
      return;
    }
    const apply = () => {
      syncSeverityMarkers(map, incidentsRef.current, severityMarkers.current);
    };
    if (map.loaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, []);

  const setFlowModuleVisibility = useCallback((visible: boolean): void => {
    const module = flowModuleRef.current;
    if (module && module.isVisible() !== visible) {
      module.setVisible(visible);
    }
  }, []);

  const refreshSpeedHeatmap = useCallback((map: MapLibreMap): void => {
    if (modeRef.current !== "speed") return;
    if (!map.getSource(FLOW_SOURCE_ID)) return;
    if (!map.isStyleLoaded()) return;
    ensureHeatmapSource(map, HEATMAP_FLOW_SPEED);
    updateHeatmapData(map, speedHeatmapFeatures(harvestFlowSamples(map)));
    lastSpeedRefreshRef.current = Date.now();
  }, []);

  const applyMode = useCallback(
    (map: MapLibreMap, next: MapMode): void => {
      closeHoverPopups(map);
      syncFlowSamples(map, samplesRef.current);
      if (next === "speed") {
        ensureHeatmapSource(map, HEATMAP_FLOW_SPEED);
        applyHeatmapStops(map, HEATMAP_FLOW_SPEED);
        refreshSpeedHeatmap(map);
      } else {
        setLayerVisibility(map, HEATMAP_LAYER_ID, false);
      }
      setFlowSamplesVisibility(map, next === "nodes");
      setFlowNodeMarkersVisibility(map, next === "nodes");
      setFlowModuleVisibility(next === "traffic");
      syncIncidentMarkers(map);
    },
    [refreshSpeedHeatmap, setFlowModuleVisibility, syncIncidentMarkers],
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
      applyMode(mapLibre, modeRef.current);
      void registerCameraIcon(mapLibre).then(() =>
        applyMode(mapLibre, modeRef.current),
      );
    };
    mapLibre.on("load", onLoad);
    const unbindViewport = bindViewportBroadcast(mapLibre, setBbox);

    return () => {
      mapLibre.off("load", onLoad);
      unbindViewport();
      clearSeverityMarkers(markers);
      mapLibre.remove();
      mapInstance.current = null;
    };
  }, [applyMode, setBbox]);

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
    let cancelled = false;
    startFlowModule(map)
      .then((module) => {
        if (cancelled || !module) return;
        flowModuleRef.current = module;
        const mapLibre = mapInstance.current?.mapLibreMap;
        if (mapLibre?.loaded()) {
          applyMode(mapLibre, modeRef.current);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      flowModuleRef.current = null;
    };
  }, [applyMode]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const mapLibre = map.mapLibreMap;
    const schedule = () => {
      if (modeRef.current !== "speed" || heatmapTimerRef.current != null) {
        return;
      }
      heatmapTimerRef.current = window.setTimeout(() => {
        heatmapTimerRef.current = null;
        const current = mapInstance.current?.mapLibreMap;
        if (current?.isStyleLoaded()) refreshSpeedHeatmap(current);
      }, 350);
    };
    const onSourceData = (event: MapSourceDataEvent) => {
      if (event.sourceId === FLOW_SOURCE_ID && event.isSourceLoaded) {
        schedule();
      }
    };
    const onMoveEnd = () => {
      schedule();
    };
    const onContextRestored = () => {
      const current = mapInstance.current?.mapLibreMap;
      if (current?.isStyleLoaded()) {
        applyMode(current, modeRef.current);
      }
    };
    const onZoomEnd = () => {
      schedule();
    };
    mapLibre.on("sourcedata", onSourceData);
    mapLibre.on("moveend", onMoveEnd);
    mapLibre.on("zoomend", onZoomEnd);
    mapLibre.on("webglcontextrestored", onContextRestored);
    watchdogTimerRef.current = window.setInterval(() => {
      const current = mapInstance.current?.mapLibreMap;
      if (!current?.isStyleLoaded()) return;
      if (modeRef.current !== "speed") return;
      if (Date.now() - lastSpeedRefreshRef.current < 6000) return;
      refreshSpeedHeatmap(current);
    }, 2000);
    return () => {
      mapLibre.off("sourcedata", onSourceData);
      mapLibre.off("moveend", onMoveEnd);
      mapLibre.off("zoomend", onZoomEnd);
      mapLibre.off("webglcontextrestored", onContextRestored);
      if (watchdogTimerRef.current != null) {
        window.clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      if (heatmapTimerRef.current != null) {
        window.clearTimeout(heatmapTimerRef.current);
        heatmapTimerRef.current = null;
      }
    };
  }, [applyMode, refreshSpeedHeatmap]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const mapLibre = map.mapLibreMap;
    return bindFeatureHoverPopup(
      mapLibre,
      [
        FLOW_ROADS_LAYER,
        FLOW_ROADS_HOVER_LAYER,
        FLOW_POINTS_LAYER,
        FLOW_NODE_ICONS_LAYER,
        HEATMAP_LAYER_ID,
        HEATMAP_HOVER_LAYER,
      ],
      () => modeRef.current !== "incidents",
      buildFlowSamplePopup,
      (features) => {
        for (const feature of features) {
          if (isFlowSegmentFeature(feature.properties)) {
            return {
              properties: normalizeFlowFeatureProps(feature.properties) ?? {},
            };
          }
        }
        return null;
      },
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

  const syncIncidentMarkersRef = useRef(syncIncidentMarkers);
  useEffect(() => {
    syncIncidentMarkersRef.current = syncIncidentMarkers;
  }, [syncIncidentMarkers]);

  const { state, refresh } = useViewportIncidents({
    getMap: () => mapInstance.current?.mapLibreMap ?? null,
    onUpdate: useCallback((incidents: TomTomIncident[]) => {
      incidentsRef.current = incidents;
      const map = mapInstance.current;
      if (!map) return;
      syncIncidentMarkersRef.current(map.mapLibreMap);
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
  const { setBbox } = useMapViewport();
  const { items, loading, error } = useAlerts();
  const itemsRef = useRef(items);
  const [pillText, setPillText] = useState("Loading incidents\u2026");
  const [mode, setMode] = useState<MapMode>("incidents");
  const modeRef = useRef<MapMode>("incidents");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const alertMarkers = useRef<Map<string, Marker>>(new Map());

  const syncIncidentMarkers = useCallback((map: MapLibreMap): void => {
    const apply = () => {
      syncAlertMarkers(
        map,
        mapIncidentPoints(itemsRef.current),
        alertMarkers.current,
        (coordinates) => {
          if (!markersFitted.current) {
            markersFitted.current = true;
            fitBoundsToCoordinates(map, coordinates, 90);
          }
        },
      );
      lastSync.current = Date.now();
    };
    if (modeRef.current !== "incidents") {
      clearAlertMarkers(alertMarkers.current);
      return;
    }
    if (map.loaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, []);

  const applyMode = useCallback(
    (map: MapLibreMap, next: MapMode): void => {
      closeHoverPopups(map);
      syncFlowSamples(map, null);
      const heatmapActive = next === "traffic" || next === "speed";
      if (heatmapActive) {
        const stops = next === "speed" ? HEATMAP_FLOW_SPEED : HEATMAP_TOMTOM;
        ensureHeatmapSource(map, stops);
        applyHeatmapStops(map, stops);
        updateHeatmapData(map, flowHeatmapFeatures(null, next));
      }
      setLayerVisibility(map, INCIDENT_HEATMAP_LAYER, heatmapActive);
      setFlowSamplesVisibility(map, next === "nodes");
      setFlowNodeMarkersVisibility(map, next === "nodes");
      syncIncidentMarkers(map);
    },
    [syncIncidentMarkers],
  );

  useEffect(() => {
    const map = new maplibregl.Map({
      container: "sdk-map",
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 11,
    });
    mapInstance.current = map;
    lastSync.current = Date.now();

    const onLoad = () => {
      applyMode(map, modeRef.current);
      void registerCameraIcon(map).then(() => applyMode(map, modeRef.current));
    };
    map.on("load", onLoad);
    const unbindViewport = bindViewportBroadcast(map, setBbox);

    const alertSnapshot = alertMarkers.current;
    return () => {
      map.off("load", onLoad);
      unbindViewport();
      clearAlertMarkers(alertSnapshot);
      map.remove();
      mapInstance.current = null;
    };
  }, [applyMode, setBbox]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    return bindFeatureHoverPopup(
      map,
      [
        FLOW_ROADS_LAYER,
        FLOW_ROADS_HOVER_LAYER,
        FLOW_POINTS_LAYER,
        FLOW_NODE_ICONS_LAYER,
      ],
      () => modeRef.current !== "incidents",
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
    if (map.loaded()) {
      syncIncidentMarkers(map);
    } else {
      map.once("load", () => syncIncidentMarkers(map));
    }
  }, [items, syncIncidentMarkers]);

  const liveCount = items.length;
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
