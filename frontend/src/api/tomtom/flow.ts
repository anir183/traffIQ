import { API_KEY } from "../../config";
import type { Bbox } from "../../components/map/incidentsApi";
import type {
  SegmentCongestionDatum,
  SegmentSpeedDatum,
} from "../../types/contract/trafficSummary";
import { tomtomKeyIsSet } from "./keys";

export interface FlowSample {
  roadName: string;
  currentSpeed: number | null;
  freeFlowSpeed: number | null;
  confidence: number | null;
  roadClosure: boolean;
  coordinates: Array<[number, number]> | null;
}

export interface RoadPoint {
  name: string;
  lat: number;
  lon: number;
}

// Static geometry catalog (Kolkata arterial roads). Only the coordinates are
// fixed; live current/free-flow speed comes from TomTom per sample.
export const ROADS: RoadPoint[] = [
  { name: "EM Bypass", lat: 22.5357, lon: 88.404 },
  { name: "VIP Road", lat: 22.611, lon: 88.424 },
  { name: "Salt Lake Sec V", lat: 22.5744, lon: 88.427 },
  { name: "Gariahat", lat: 22.5176, lon: 88.365 },
  { name: "Park Street", lat: 22.55, lon: 88.355 },
  { name: "Chowringhee", lat: 22.5445, lon: 88.3415 },
  { name: "Howrah Bridge", lat: 22.588, lon: 88.324 },
  { name: "Rashbehari Avenue", lat: 22.5266, lon: 88.353 },
  { name: "Ballygunge Circular Road", lat: 22.5335, lon: 88.3665 },
  { name: "Diamond Harbour Road", lat: 22.501, lon: 88.306 },
  { name: "Joka", lat: 22.467, lon: 88.299 },
  { name: "New Town Action Area", lat: 22.586, lon: 88.434 },
  { name: "Rajarhat", lat: 22.599, lon: 88.459 },
  { name: "Ultadanga", lat: 22.595, lon: 88.394 },
  { name: "Sealdah", lat: 22.5685, lon: 88.37 },
  { name: "Esplanade", lat: 22.5645, lon: 88.348 },
  { name: "Bhowanipur", lat: 22.528, lon: 88.342 },
  { name: "N S Bose Road", lat: 22.49, lon: 88.344 },
  { name: "Kalighat", lat: 22.522, lon: 88.352 },
  { name: "Shyambazar", lat: 22.594, lon: 88.354 },
  { name: "Kankurgachi", lat: 22.572, lon: 88.389 },
  { name: "Entally", lat: 22.56, lon: 88.379 },
  { name: "Kidderpore", lat: 22.545, lon: 88.327 },
  { name: "Bagbazar", lat: 22.599, lon: 88.366 },
];

// Deterministic schematic polyline (3 points, ~1.3 km each way through the
// centroid along a road-name-derived bearing). Used whenever a road has no
// live TomTom geometry so lines/heatmap/hover always render.
export function roadFallbackGeometry(road: RoadPoint): Array<[number, number]> {
  let hash = 0;
  for (let i = 0; i < road.name.length; i += 1) {
    hash = (hash * 31 + road.name.charCodeAt(i)) >>> 0;
  }
  const bearing = ((hash % 360) * Math.PI) / 180;
  const dx = Math.sin(bearing) * 0.012;
  const dy = Math.cos(bearing) * 0.012;
  return [
    [road.lon - dx, road.lat - dy],
    [road.lon, road.lat],
    [road.lon + dx, road.lat + dy],
  ];
}

const FLOW_URL =
  "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json";

const REQUEST_TIMEOUT_MS = 8000;
const CONCURRENCY = 5;
const CACHE_TTL_MS = 90_000;

let cache: { at: number; samples: FlowSample[] } | null = null;
let inFlight: Promise<FlowSample[]> | null = null;

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

interface FlowSegmentData {
  currentSpeed?: number;
  freeFlowSpeed?: number;
  confidence?: number;
  roadClosure?: boolean;
  coordinates?: unknown;
}

function parseCoordinates(value: unknown): Array<[number, number]> | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const coordinates: Array<[number, number]> = [];
  for (const point of value) {
    const lat = (point as unknown[])?.[0];
    const lng = (point as unknown[])?.[1];
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    coordinates.push([lng, lat]);
  }
  return coordinates.length >= 2 ? coordinates : null;
}

function parseSample(road: RoadPoint, data: unknown): FlowSample {
  const segment = (data as { flowSegmentData?: FlowSegmentData })
    .flowSegmentData;
  return {
    roadName: road.name,
    currentSpeed: segment ? numberOrNull(segment.currentSpeed) : null,
    freeFlowSpeed: segment ? numberOrNull(segment.freeFlowSpeed) : null,
    confidence: segment ? numberOrNull(segment.confidence) : null,
    roadClosure: segment?.roadClosure === true,
    coordinates: segment ? parseCoordinates(segment.coordinates) : null,
  };
}

async function loadFlow(): Promise<FlowSample[]> {
  const samples: FlowSample[] = [];
  for (let i = 0; i < ROADS.length; i += CONCURRENCY) {
    const batch = ROADS.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map((road) =>
        fetchWithTimeout(
          `${FLOW_URL}?point=${road.lat},${road.lon}&unit=KMPH&key=${encodeURIComponent(API_KEY)}`,
          REQUEST_TIMEOUT_MS,
        )
          .then(async (res) =>
            res.ok ? parseSample(road, await res.json()) : null,
          )
          .catch(() => null),
      ),
    );
    for (const sample of settled) if (sample) samples.push(sample);
  }
  cache = { at: Date.now(), samples };
  return samples;
}

export async function fetchRoadFlow(): Promise<FlowSample[]> {
  if (!tomtomKeyIsSet()) return [];
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.samples;
  if (inFlight) return inFlight;
  inFlight = loadFlow().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function flowUsableCount(samples: FlowSample[]): number {
  return samples.filter(
    (sample) =>
      sample.currentSpeed !== null &&
      sample.freeFlowSpeed !== null &&
      sample.freeFlowSpeed > 0,
  ).length;
}

export interface FlowTrafficSummary {
  avgSpeedKmh: number;
  congestionScore: number;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[rank];
}

export function summarizeFlow(samples: FlowSample[]): FlowTrafficSummary {
  const usable = samples.filter(
    (sample) =>
      sample.currentSpeed !== null &&
      sample.freeFlowSpeed !== null &&
      sample.freeFlowSpeed > 0,
  ) as Array<FlowSample & { currentSpeed: number; freeFlowSpeed: number }>;
  const freeSum = usable.reduce((sum, sample) => sum + sample.freeFlowSpeed, 0);

  let speedWeighted = 0;
  const perRoadCongestion: number[] = [];
  for (const sample of usable) {
    speedWeighted += sample.currentSpeed * sample.freeFlowSpeed;
    const ratio = Math.min(sample.currentSpeed / sample.freeFlowSpeed, 1);
    perRoadCongestion.push(Math.max(0, 1 - ratio) * 100);
  }

  if (freeSum <= 0) return { avgSpeedKmh: 0, congestionScore: 0 };
  const meanCongestion =
    perRoadCongestion.reduce((sum, value) => sum + value, 0) /
    perRoadCongestion.length;
  const congestionScore = Math.round(
    0.5 * meanCongestion + 0.5 * percentile(perRoadCongestion, 90),
  );
  return {
    avgSpeedKmh: Math.round((speedWeighted / freeSum) * 10) / 10,
    congestionScore,
  };
}

function congestionScore(sample: FlowSample): number {
  if (
    sample.currentSpeed === null ||
    sample.freeFlowSpeed === null ||
    sample.freeFlowSpeed <= 0
  ) {
    return 0;
  }
  const ratio = Math.min(sample.currentSpeed / sample.freeFlowSpeed, 1);
  return Math.round(Math.max(0, 1 - ratio) * 100);
}

export function pointInBbox(lat: number, lon: number, bbox: Bbox): boolean {
  return (
    lon >= bbox.west &&
    lon <= bbox.east &&
    lat >= bbox.south &&
    lat <= bbox.north
  );
}

export function filterByBbox(samples: FlowSample[], bbox: Bbox): FlowSample[] {
  return samples.filter((sample) => {
    const road = ROADS.find((r) => r.name === sample.roadName);
    return road && pointInBbox(road.lat, road.lon, bbox);
  });
}

export function roadsInBbox(bbox: Bbox): RoadPoint[] {
  return ROADS.filter((road) => pointInBbox(road.lat, road.lon, bbox));
}

export function roadFractionInBbox(bbox: Bbox): number {
  if (ROADS.length === 0) return 0;
  return roadsInBbox(bbox).length / ROADS.length;
}

function segmentId(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `SEG_${slug}` : name;
}

export function congestedSegments(
  samples: FlowSample[],
  limit = 6,
): SegmentCongestionDatum[] {
  return samples
    .filter(
      (sample) => sample.freeFlowSpeed !== null && sample.freeFlowSpeed > 0,
    )
    .map((sample) => {
      const road = ROADS.find((r) => r.name === sample.roadName);
      return {
        segment_id: segmentId(sample.roadName),
        name: sample.roadName,
        congestion_score: congestionScore(sample),
        lat: road?.lat,
        lon: road?.lon,
      };
    })
    .sort((a, b) => b.congestion_score - a.congestion_score)
    .slice(0, limit);
}

export function speedSegments(
  samples: FlowSample[],
  limit = 6,
): SegmentSpeedDatum[] {
  return samples
    .filter((sample) => sample.currentSpeed !== null)
    .map((sample) => {
      const road = ROADS.find((r) => r.name === sample.roadName);
      return {
        segment_id: segmentId(sample.roadName),
        name: sample.roadName,
        avg_speed_kmh: sample.currentSpeed as number,
        lat: road?.lat,
        lon: road?.lon,
      };
    })
    .sort((a, b) => a.avg_speed_kmh - b.avg_speed_kmh)
    .slice(0, limit);
}
