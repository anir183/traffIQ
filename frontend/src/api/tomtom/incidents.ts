import {
  type Bbox,
  type TomTomIncident,
  fetchIncidents,
  incidentAnchor,
} from "../../components/map/incidentsApi";
import type {
  Alert,
  AlertSeverity,
  AlertType,
  EventStreamMeta,
} from "../../types/contract/alert";
import { tomtomKeyIsSet } from "./keys";

const CITY_BOUNDS: Bbox = {
  west: 88.24,
  south: 22.44,
  east: 88.52,
  north: 22.66,
};

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 90_000;
const MAX_ALERTS = 80;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DETAIL_BY_SEVERITY: Record<AlertSeverity, string> = {
  high: "High-severity incident \u2014 major delays expected",
  medium: "Moderate delays reported on this stretch",
  low: "Low-impact incident \u2014 watch for slower traffic",
};

let cache: { at: number; alerts: Alert[] } | null = null;
let inFlight: Promise<Alert[]> | null = null;

function formatEventTimestamp(iso: string): string {
  const date = new Date(iso);
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hours < 12 ? "AM" : "PM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")}, ${twelveHour}:${minutes} ${period}`;
}

export function severityOf(magnitudeOfDelay?: number): AlertSeverity {
  const magnitude = magnitudeOfDelay ?? 0;
  if (magnitude >= 3) return "high";
  if (magnitude >= 1) return "medium";
  return "low";
}

function typeOf(incident: TomTomIncident): AlertType {
  const category =
    incident.properties?.events?.[0]?.iconCategory ??
    incident.properties?.iconCategory;
  switch (category) {
    case 1:
    case 2:
      return "accident";
    case 7:
    case 13:
    case 14:
      return "route_anomaly";
    case 8:
    case 9:
    case 10:
      return "road_construction";
    default:
      return "suspicious_activity";
  }
}

function buildAlert(incident: TomTomIncident): Alert | null {
  if (!incident.geometry) return null;
  const properties = incident.properties ?? {};
  const description = properties.events?.[0]?.description ?? "Traffic incident";
  const from = properties.from ?? "";
  const to = properties.to ?? "";
  const label = [from, to].filter(Boolean).join(" \u2192 ") || "Kolkata";
  const [longitude, latitude] = incidentAnchor(incident);
  const startTime = properties.startTime ?? new Date().toISOString();
  const severity = severityOf(properties.magnitudeOfDelay);

  const base: Alert = {
    alert_id: properties.id
      ? `tt_${properties.id}`
      : `tt_${longitude.toFixed(5)},${latitude.toFixed(5)}`,
    type: typeOf(incident),
    severity,
    status: "active",
    title: description,
    detail: DETAIL_BY_SEVERITY[severity],
    location: { label, latitude, longitude },
    detected_at: startTime,
  };

  if (severity !== "low") return base;

  const stream: EventStreamMeta = {
    status: (properties.magnitudeOfDelay ?? 0) >= 2 ? "warning" : "neutral",
    title: description,
    location: label,
    timestamp: formatEventTimestamp(startTime),
    detail_line:
      (properties.magnitudeOfDelay ?? 0) >= 2
        ? "Expect delays \u2014 monitor the route"
        : "Live traffic update \u2014 monitor the route",
    link_text: "Open incident",
  };
  return { ...base, event_stream: stream };
}

async function loadIncidents(): Promise<Alert[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let incidents: TomTomIncident[];
  try {
    incidents = await fetchIncidents(CITY_BOUNDS, controller.signal);
  } finally {
    clearTimeout(timer);
  }

  const alerts = incidents
    .map(buildAlert)
    .filter((alert): alert is Alert => alert !== null)
    .sort((a, b) => b.detected_at.localeCompare(a.detected_at))
    .slice(0, MAX_ALERTS);

  cache = { at: Date.now(), alerts };
  return alerts;
}

export async function fetchCityIncidentAlerts(): Promise<Alert[]> {
  if (!tomtomKeyIsSet()) throw new Error("VITE_TOMTOM_API_KEY not set");
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.alerts;
  if (inFlight) return inFlight;
  inFlight = loadIncidents().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
