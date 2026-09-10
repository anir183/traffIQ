import type { Feature } from "geojson";
import type { FlowSample } from "../../api/tomtom/flow";

const STEP_DEG = 0.0018;
const MAX_HEATMAP_POINTS = 2500;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function densifyPath(
  coordinates: Array<[number, number]>,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const a = coordinates[i];
    const b = coordinates[i + 1];
    points.push(a);
    const dLon = b[0] - a[0];
    const dLat = b[1] - a[1];
    const distance = Math.hypot(dLon, dLat);
    if (distance > STEP_DEG) {
      const steps = Math.ceil(distance / STEP_DEG);
      for (let k = 1; k < steps; k += 1) {
        points.push([a[0] + (dLon * k) / steps, a[1] + (dLat * k) / steps]);
      }
    }
  }
  points.push(coordinates[coordinates.length - 1]);
  return points;
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

export function speedHeatmapFeatures(samples: FlowSample[]): Feature[] {
  const features: Feature[] = [];
  for (const sample of samples) {
    if (!sample.coordinates || sample.coordinates.length < 2) continue;
    const points = densifyPath(sample.coordinates);
    const speed = sample.currentSpeed;
    const base = sample.roadClosure
      ? 0
      : typeof speed === "number"
        ? clamp(speed / 100, 0.2, 0.95)
        : 0.2;
    for (let i = 0; i < points.length; i += 1) {
      const taper = i === 0 || i === points.length - 1 ? 0.65 : 1;
      features.push({
        type: "Feature",
        properties: {
          severity: base * taper,
          name: sample.roadName,
          currentSpeed: sample.currentSpeed,
          freeFlowSpeed: sample.freeFlowSpeed,
          confidence: sample.confidence,
          congestion: congestionPct(sample),
          closed: sample.roadClosure,
        },
        geometry: { type: "Point", coordinates: points[i] },
      } as Feature);
    }
  }
  if (features.length > MAX_HEATMAP_POINTS) {
    const stride = Math.ceil(features.length / MAX_HEATMAP_POINTS);
    return features.filter((_, index) => index % stride === 0);
  }
  return features;
}
