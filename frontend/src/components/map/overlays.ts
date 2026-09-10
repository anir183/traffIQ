import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { Feature } from "geojson";
import {
  ROADS,
  roadFallbackGeometry,
  type FlowSample,
} from "../../api/tomtom/flow";
import { Camera } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const INCIDENT_HEATMAP_LAYER = "live-traffic-heatmap";
export const FLOW_ROADS_LAYER = "flow-roads";
export const FLOW_ROADS_HOVER_LAYER = "flow-roads-hover";
export const FLOW_POINTS_LAYER = "flow-sample-points";
export const FLOW_NODE_ICONS_LAYER = "flow-node-icons";
const FLOW_SAMPLES_SOURCE = "flow-samples-source";

let cameraIconReady = false;
let cameraIconPromise: Promise<void> | null = null;

function cameraSvgDataUri(): string {
  const svg = renderToStaticMarkup(
    createElement(Camera, { size: 32, strokeWidth: 2.2, color: "#1e293b" }),
  );
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function registerCameraIcon(map: MapLibreMap): Promise<void> {
  if (cameraIconReady || map.hasImage("camera-icon")) {
    cameraIconReady = true;
    return Promise.resolve();
  }
  if (cameraIconPromise) return cameraIconPromise;
  cameraIconPromise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        if (!map.hasImage("camera-icon")) map.addImage("camera-icon", image);
        cameraIconReady = true;
      } catch {
        // Keep the circle fallback if the icon cannot be registered.
      }
      resolve();
    };
    image.onerror = () => resolve();
    image.src = cameraSvgDataUri();
  });
  return cameraIconPromise;
}

export function setLayerVisibility(
  map: MapLibreMap,
  layerId: string,
  visible: boolean,
): void {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function congestionPct(sample: FlowSample): number | null {
  if (
    sample.currentSpeed === null ||
    sample.freeFlowSpeed === null ||
    sample.freeFlowSpeed <= 0
  ) {
    return null;
  }
  return Math.round(100 * (1 - sample.currentSpeed / sample.freeFlowSpeed));
}

function flowSampleFeatures(samples: FlowSample[] | null): Feature[] {
  return ROADS.map((road) => {
    const sample =
      samples?.find((candidate) => candidate.roadName === road.name) ?? null;
    const liveCoordinates = sample?.coordinates ?? null;
    const geometry = {
      type: "LineString" as const,
      coordinates: liveCoordinates ?? roadFallbackGeometry(road),
    };
    return {
      type: "Feature",
      properties: {
        name: road.name,
        currentSpeed: sample?.currentSpeed ?? null,
        freeFlowSpeed: sample?.freeFlowSpeed ?? null,
        congestion: sample ? congestionPct(sample) : null,
        confidence: sample?.confidence ?? null,
        hasFlow: liveCoordinates !== null && liveCoordinates.length >= 2,
        closed: sample?.roadClosure ?? false,
      },
      geometry,
    } as Feature;
  });
}

export function flowHeatmapFeatures(
  samples: FlowSample[] | null,
  mode: "traffic" | "speed",
): Feature[] {
  const features: Feature[] = [];
  for (const road of ROADS) {
    const sample =
      samples?.find((candidate) => candidate.roadName === road.name) ?? null;
    let weight = 0.15;
    if (mode === "traffic") {
      const congestion = sample ? congestionPct(sample) : null;
      weight = congestion != null ? congestion / 100 : 0.15;
    } else {
      const speed = sample?.currentSpeed;
      weight =
        typeof speed === "number"
          ? Math.min(Math.max(speed / 100, 0.05), 1)
          : 0.15;
    }
    const coordinates = sample?.coordinates ?? roadFallbackGeometry(road);
    for (const point of coordinates) {
      features.push({
        type: "Feature",
        properties: { severity: weight },
        geometry: { type: "Point", coordinates: point },
      } as Feature);
    }
  }
  return features;
}

export function syncFlowSamples(
  map: MapLibreMap,
  samples: FlowSample[] | null,
): void {
  const data = {
    type: "FeatureCollection" as const,
    features: flowSampleFeatures(samples),
  };
  if (map.getSource(FLOW_SAMPLES_SOURCE)) {
    (map.getSource(FLOW_SAMPLES_SOURCE) as GeoJSONSource).setData(data);
    return;
  }
  if (!map.isStyleLoaded()) return;
  try {
    map.addSource(FLOW_SAMPLES_SOURCE, { type: "geojson", data });
    map.addLayer({
      id: FLOW_ROADS_LAYER,
      type: "line",
      source: FLOW_SAMPLES_SOURCE,
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: "none",
      },
      paint: {
        "line-width": 4,
        "line-opacity": 0.9,
        "line-color": [
          "case",
          ["!", ["get", "hasFlow"]],
          "#94a3b8",
          [">=", ["get", "congestion"], 60],
          "#dc2626",
          [">=", ["get", "congestion"], 30],
          "#f59e0b",
          true,
          "#22c55e",
        ],
      },
    });
    map.addLayer({
      id: FLOW_ROADS_HOVER_LAYER,
      type: "line",
      source: FLOW_SAMPLES_SOURCE,
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: "none",
      },
      paint: {
        "line-width": 14,
        "line-opacity": 0,
      },
    });
    map.addLayer({
      id: FLOW_POINTS_LAYER,
      type: "circle",
      source: FLOW_SAMPLES_SOURCE,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 5,
        "circle-color": "#334155",
        "circle-opacity": 1,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
    map.addLayer({
      id: FLOW_NODE_ICONS_LAYER,
      type: "symbol",
      source: FLOW_SAMPLES_SOURCE,
      layout: {
        visibility: "none",
        "icon-image": "camera-icon",
        "icon-size": 1,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
      },
    });
  } catch {
    // no-op if the style is being rebuilt
  }
}

export function setFlowSamplesVisibility(
  map: MapLibreMap,
  visible: boolean,
): void {
  setLayerVisibility(map, FLOW_ROADS_HOVER_LAYER, visible);
  setLayerVisibility(map, FLOW_ROADS_LAYER, visible);
}

export function setFlowNodeMarkersVisibility(
  map: MapLibreMap,
  visible: boolean,
): void {
  if (visible && cameraIconReady) {
    setLayerVisibility(map, FLOW_NODE_ICONS_LAYER, true);
    setLayerVisibility(map, FLOW_POINTS_LAYER, false);
  } else {
    setLayerVisibility(map, FLOW_NODE_ICONS_LAYER, false);
    setLayerVisibility(map, FLOW_POINTS_LAYER, visible);
  }
}
