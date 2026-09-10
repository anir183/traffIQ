import type {
  GeoJSONSource,
  Map as MapLibreMap,
  ExpressionSpecification,
} from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import type { Alert, AlertSeverity } from "../../types/contract/alert";

export type HeatmapStops = Array<[number, string]>;

export const HEATMAP_SOURCE_ID = "traffic-heatmap-source";
export const HEATMAP_LAYER_ID = "live-traffic-heatmap";
export const HEATMAP_HOVER_LAYER = "traffic-heatmap-hover";

export const HEATMAP_TOMTOM: HeatmapStops = [
  [0, "rgba(0, 0, 255, 0)"],
  [0.2, "rgb(0, 128, 255)"],
  [0.4, "rgb(0, 255, 0)"],
  [0.6, "rgb(255, 255, 0)"],
  [0.8, "rgb(255, 128, 0)"],
  [1.0, "rgb(255, 0, 0)"],
];

export const HEATMAP_CUSTOM: HeatmapStops = [
  [0, "rgba(220, 38, 38, 0)"],
  [0.4, "rgba(220, 38, 38, 0.3)"],
  [1, "rgba(220, 38, 38, 0.85)"],
];

export const HEATMAP_FLOW_SPEED: HeatmapStops = [
  [0, "rgba(220, 38, 38, 0)"],
  [0.2, "rgb(220, 38, 38)"],
  [0.5, "rgb(250, 204, 21)"],
  [1, "rgb(34, 197, 94)"],
];

function heatmapColorExpression(stops: HeatmapStops): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    ...stops.flatMap(([density, color]) => [density, color]),
  ] as unknown as ExpressionSpecification;
}

export function ensureHeatmapSource(
  map: MapLibreMap,
  stops: HeatmapStops,
): void {
  try {
    const sourceReady = map.getSource(HEATMAP_SOURCE_ID) != null;
    const layersReady =
      map.getLayer(HEATMAP_LAYER_ID) != null &&
      map.getLayer(HEATMAP_HOVER_LAYER) != null;
    if (sourceReady && layersReady) return;
    if (map.getLayer(HEATMAP_LAYER_ID)) map.removeLayer(HEATMAP_LAYER_ID);
    if (map.getLayer(HEATMAP_HOVER_LAYER)) {
      map.removeLayer(HEATMAP_HOVER_LAYER);
    }
    if (map.getSource(HEATMAP_SOURCE_ID)) {
      map.removeSource(HEATMAP_SOURCE_ID);
    }
    map.addSource(HEATMAP_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: HEATMAP_LAYER_ID,
      type: "heatmap",
      source: HEATMAP_SOURCE_ID,
      paint: {
        "heatmap-weight": ["get", "severity"],
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1.5,
          15,
          2.2,
        ],
        "heatmap-color": heatmapColorExpression(stops),
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          12,
          12,
          18,
          16,
          22,
          20,
          28,
        ],
        "heatmap-opacity": 0.85,
      },
    });
    map.addLayer({
      id: HEATMAP_HOVER_LAYER,
      type: "circle",
      source: HEATMAP_SOURCE_ID,
      paint: {
        "circle-radius": 9,
        "circle-opacity": 0,
      },
    });
  } catch {
    // removeSource throws if any layer still references the source, so layers
    // are detached first; anything else mid-rebuild must stay silent
  }
}

export function updateHeatmapData(map: MapLibreMap, features: Feature[]): void {
  try {
    const source = map.getSource(HEATMAP_SOURCE_ID) as
      GeoJSONSource | undefined;
    if (!source) return;
    source.setData({ type: "FeatureCollection", features });
  } catch {
    // setData mid-rebuild must not throw
  }
}

export function applyHeatmapStops(map: MapLibreMap, stops: HeatmapStops): void {
  try {
    if (!map.getLayer(HEATMAP_LAYER_ID)) return;
    map.setPaintProperty(
      HEATMAP_LAYER_ID,
      "heatmap-color",
      heatmapColorExpression(stops),
    );
  } catch {
    // setPaintProperty mid-rebuild must not throw
  }
}

const SEVERITY_WEIGHT: Record<AlertSeverity, number> = {
  high: 1,
  medium: 0.6,
  low: 0.35,
};

export interface AlertGeoPoint {
  lng: number;
  lat: number;
  severity: AlertSeverity;
}

export function alertGeoPoints(alerts: Alert[]): AlertGeoPoint[] {
  const points: AlertGeoPoint[] = [];
  for (const alert of alerts) {
    if (alert.status === "resolved") continue;
    const { latitude, longitude } = alert.location;
    if (latitude == null || longitude == null) continue;
    points.push({ lng: longitude, lat: latitude, severity: alert.severity });
  }
  return points;
}

export function geoPointsToFeatures(points: AlertGeoPoint[]): Feature[] {
  return points.map((point) => ({
    type: "Feature" as const,
    properties: { severity: SEVERITY_WEIGHT[point.severity] },
    geometry: {
      type: "Point" as const,
      coordinates: [point.lng, point.lat],
    } as Geometry,
  }));
}

export function geoPointsToCoordinates(
  points: AlertGeoPoint[],
): [number, number][] {
  return points.map((point) => [point.lng, point.lat]);
}
