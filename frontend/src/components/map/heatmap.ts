import type {
  GeoJSONSource,
  Map as MapLibreMap,
  ExpressionSpecification,
} from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import type { Alert, AlertSeverity } from "../../types/contract/alert";

export type HeatmapStops = Array<[number, string]>;

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
  if (map.getSource("traffic-heatmap-source")) return;
  if (map.getLayer("live-traffic-heatmap")) {
    map.removeLayer("live-traffic-heatmap");
  }

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
      "heatmap-color": heatmapColorExpression(stops),
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 15, 18, 40],
      "heatmap-opacity": 0.85,
    },
  });
}

export function updateHeatmapData(map: MapLibreMap, features: Feature[]): void {
  const source = map.getSource("traffic-heatmap-source") as
    GeoJSONSource | undefined;
  if (!source) return;
  source.setData({ type: "FeatureCollection", features });
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
