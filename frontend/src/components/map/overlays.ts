import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { Feature } from "geojson";
import { ROADS, type FlowSample } from "../../api/tomtom/flow";
import { tomtomApiKey, tomtomKeyIsSet } from "../../api/tomtom/keys";

const FLOW_TILE_URL = "https://api.tomtom.com/traffic/map/4/tile/flow";

export const FLOW_LAYER_RELATIVE = "flow-layer-relative";
export const FLOW_LAYER_ABSOLUTE = "flow-layer-absolute";
export const INCIDENT_HEATMAP_LAYER = "live-traffic-heatmap";
export const FLOW_ROADS_CASING_LAYER = "flow-roads-casing";
export const FLOW_ROADS_LAYER = "flow-roads";
export const FLOW_POINTS_LAYER = "flow-sample-points";
const FLOW_SAMPLES_SOURCE = "flow-samples-source";

function flowTileUrl(type: "relative" | "absolute"): string {
  const key = tomtomApiKey();
  return `${FLOW_TILE_URL}/${type}/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}&tileSize=256`;
}

function ensureRasterOverlay(
  map: MapLibreMap,
  layerId: string,
  sourceId: string,
  url: string,
): void {
  if (map.getSource(sourceId)) return;
  map.addSource(sourceId, {
    type: "raster",
    tiles: [url],
    tileSize: 256,
    attribution: "TomTom",
  });
  map.addLayer({
    id: layerId,
    type: "raster",
    source: sourceId,
    layout: { visibility: "none" },
    paint: { "raster-opacity": 1, "raster-fade-duration": 0 },
  });
}

export function ensureTrafficTiles(map: MapLibreMap): void {
  if (!tomtomKeyIsSet()) return;
  ensureRasterOverlay(
    map,
    FLOW_LAYER_RELATIVE,
    "tomtom-flow-relative",
    flowTileUrl("relative"),
  );
  ensureRasterOverlay(
    map,
    FLOW_LAYER_ABSOLUTE,
    "tomtom-flow-absolute",
    flowTileUrl("absolute"),
  );
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
    const coordinates = sample?.coordinates ?? null;
    const geometry =
      coordinates && coordinates.length >= 2
        ? { type: "LineString" as const, coordinates }
        : { type: "Point" as const, coordinates: [road.lon, road.lat] };
    return {
      type: "Feature",
      properties: {
        name: road.name,
        currentSpeed: sample?.currentSpeed ?? null,
        freeFlowSpeed: sample?.freeFlowSpeed ?? null,
        congestion: sample ? congestionPct(sample) : null,
        confidence: sample?.confidence ?? null,
        hasFlow: coordinates !== null && coordinates.length >= 2,
      },
      geometry,
    } as Feature;
  });
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
  map.addSource(FLOW_SAMPLES_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: FLOW_ROADS_CASING_LAYER,
    type: "line",
    source: FLOW_SAMPLES_SOURCE,
    layout: {
      "line-cap": "round",
      "line-join": "round",
      visibility: "none",
    },
    paint: {
      "line-width": 7,
      "line-color": "#ffffff",
      "line-opacity": 0.9,
    },
  });
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
    id: FLOW_POINTS_LAYER,
    type: "circle",
    source: FLOW_SAMPLES_SOURCE,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 4,
      "circle-color": "#64748b",
      "circle-opacity": 0.9,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
    },
  });
}

export function setFlowSamplesVisibility(
  map: MapLibreMap,
  visible: boolean,
): void {
  setLayerVisibility(map, FLOW_ROADS_CASING_LAYER, visible);
  setLayerVisibility(map, FLOW_ROADS_LAYER, visible);
}

export function setFlowPointsVisibility(
  map: MapLibreMap,
  visible: boolean,
): void {
  setLayerVisibility(map, FLOW_POINTS_LAYER, visible);
}
