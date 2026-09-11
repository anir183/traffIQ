import type {
  Alert,
  AlertSeverity,
  AlertType,
  EventStreamMeta,
} from "../contract/alert";
import type { AnprEvent, VehicleClass } from "../contract/anprEvent";
import type { CameraMeta } from "../contract/camera";
import type {
  SegmentCongestionDatum,
  SegmentSpeedDatum,
  TimeSeriesPoint,
  TrafficMetrics,
  VehicleTypeBreakdown,
} from "../contract/trafficSummary";
import type { TrajectoryPoint } from "../contract/trajectory";
import type { GlobalVehicle } from "../contract/vehicle";
import type {
  AnprEntry,
  DensityPoint,
  Incident,
  IncidentEvent,
  IncidentIcon,
  SegmentDatum,
  VolumeSpeedPoint,
} from "../traffic";
import { alertStatusToUi, vehicleClassToUi } from "./incidentStatus";

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

const TYPE_LABEL: Record<VehicleClass, string> = {
  car: "Car",
  bike: "Bike",
  bus: "Bus",
  truck: "Truck",
  other: "Others",
};

const ALERT_ICON: Record<AlertType, IncidentIcon> = {
  blacklisted_vehicle: "alert",
  accident: "warning",
  speed_violation: "alert",
  wrong_way: "wrongway",
  route_anomaly: "wrongway",
  signal_malfunction: "warning",
  road_construction: "warning",
  suspicious_activity: "alert",
};

export function formatUtcTime(iso: string): string {
  return iso.slice(11, 19);
}

export function formatUtcTimeShort(iso: string): string {
  return iso.slice(11, 16);
}

export function formatUtcDateTime(iso: string): string {
  const datePart = iso.slice(0, 10);
  const [day, monthIndex] = datePart.split("-");
  const month = MONTHS[Number(monthIndex) - 1] ?? "";
  return `${day} ${month} ${datePart.slice(6, 10)}, ${iso.slice(11, 19)}`;
}

export function toLocaleString(value: number): string {
  return value.toLocaleString();
}

// export function anprEventToEntry(event: AnprEvent): AnprEntry {
//   return {
//     id: event.event_id,
//     time: formatUtcTime(event.timestamp),
//     vehicleNumber: event.plate.text,
//     camera: event.camera_id,
//     vehicleType: vehicleClassToUi(event.vehicle.type),
//     confidence: Math.round(event.plate.confidence),
//   };
// }

export function anprEventToEntry(event: AnprEvent): AnprEntry {
  // Convert backend "CAR" to "car" to match your VehicleClass types
  const normalizedType = event.vehicleType.toLowerCase() as VehicleClass;

  return {
    id: event.eventId,
    time: formatUtcTime(event.detectedAt), 
    vehicleNumber: event.plateNumber,
    camera: event.cameraId,
    vehicleType: vehicleClassToUi(normalizedType),
    // Assuming backend sends 0.94, multiply by 100 for the UI percentage
    confidence: Math.round(event.plateConfidence * 100),
  };
}

export function alertToIncident(alert: Alert): Incident {
  return {
    id: alert.alert_id,
    icon: ALERT_ICON[alert.type],
    title: alert.title,
    detail: alert.detail,
    location: alert.location.label,
    time: formatUtcTimeShort(alert.detected_at),
    status: alertStatusToUi(alert.status),
  };
}

export type AlertWithEventStream = Alert & { event_stream: EventStreamMeta };

export function hasEventStream(alert: Alert): alert is AlertWithEventStream {
  return alert.event_stream !== undefined;
}

export function alertToEventStream(alert: AlertWithEventStream): IncidentEvent {
  return {
    id: alert.alert_id,
    status: alert.event_stream.status,
    title: alert.event_stream.title,
    location: alert.event_stream.location,
    timestamp: alert.event_stream.timestamp,
    detailLine: alert.event_stream.detail_line,
    linkText: alert.event_stream.link_text,
  };
}

export function incidentStreamAlerts(alerts: Alert[]): AlertWithEventStream[] {
  return alerts.filter(hasEventStream);
}

export function triageAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter((alert) => !hasEventStream(alert));
}

export interface CriticalIncidentCounts {
  suspicious: number;
  accidents: number;
}

export function criticalIncidentCounts(
  alerts: Alert[],
): CriticalIncidentCounts {
  const streamAlerts = incidentStreamAlerts(alerts);
  return {
    suspicious: streamAlerts.filter(
      (alert) => alert.type === "suspicious_activity",
    ).length,
    accidents: streamAlerts.filter((alert) => alert.type === "accident").length,
  };
}

// export function activeAlerts(alerts: Alert[], max: number): Alert[] {
//   return alerts
//     .filter((alert) => alert.status === "active")
//     .sort((a, b) => b.detected_at.localeCompare(a.detected_at))
//     .slice(0, max);
// }

export function activeAlerts(alerts: Alert[], max: number): Alert[] {
  return alerts
    .filter((alert) => alert.status === "active")
    // Safe sort: fall back to empty string if detected_at is undefined
    .sort((a, b) => (b.detected_at || "").localeCompare(a.detected_at || ""))
    .slice(0, max);
}

export function activeAlertCount(alerts: Alert[]): number {
  return alerts.filter((alert) => alert.status === "active").length;
}

export interface IncidentMarkerPoint {
  lng: number;
  lat: number;
  severity: AlertSeverity;
  alert: Alert;
}

export function mapIncidentPoints(alerts: Alert[]): IncidentMarkerPoint[] {
  return alerts
    .filter(
      (alert) =>
        alert.status === "active" &&
        alert.location.latitude != null &&
        alert.location.longitude != null,
    )
    .map((alert) => ({
      lng: alert.location.longitude as number,
      lat: alert.location.latitude as number,
      severity: alert.severity,
      alert,
    }));
}

const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  blacklisted_vehicle: "Blacklisted vehicle",
  accident: "Accident",
  speed_violation: "Speed violation",
  wrong_way: "Wrong-way driving",
  route_anomaly: "Route anomaly",
  signal_malfunction: "Signal malfunction",
  road_construction: "Road construction",
  suspicious_activity: "Suspicious activity",
};

export function alertTypeLabel(type: AlertType): string {
  return ALERT_TYPE_LABEL[type];
}

export function metricsToStatCards(metrics: TrafficMetrics): {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  invertTrendColor?: boolean;
}[] {
  return [
    {
      label: "Total Vehicles",
      value: toLocaleString(metrics.total_vehicles),
      change: `${Math.abs(metrics.total_vehicles_change_pct)}%`,
      trend: directionOf(metrics.total_vehicles_change_pct),
    },
    {
      label: "Unique Vehicles",
      value: toLocaleString(metrics.unique_vehicles),
      change: `${Math.abs(metrics.unique_vehicles_change_pct)}%`,
      trend: directionOf(metrics.unique_vehicles_change_pct),
    },
    {
      label: "Average Speed",
      value: `${metrics.avg_speed_kmh} km/h`,
      change: `${Math.abs(metrics.avg_speed_change_pct)}%`,
      trend: directionOf(metrics.avg_speed_change_pct),
    },
    {
      label: "Congestion Score",
      value: `${metrics.congestion_score}/100`,
      change: `${Math.abs(metrics.congestion_score_change_pct)}%`,
      trend: directionOf(metrics.congestion_score_change_pct),
      invertTrendColor: true,
    },
  ];
}

export function directionOf(value: number): "up" | "down" {
  return value >= 0 ? "up" : "down";
}

export function timeSeriesToVolumeSpeed(
  points: TimeSeriesPoint[],
): VolumeSpeedPoint[] {
  return points.map((point) => ({
    time: point.time,
    volume: point.volume,
    speed: point.avg_speed_kmh,
  }));
}

export function vehicleTypeLabel(type: VehicleClass): string {
  return TYPE_LABEL[type];
}

export function typeBreakdownToPercentages(
  breakdown: VehicleTypeBreakdown[],
): { label: string; percent: number }[] {
  return breakdown.map((item) => ({
    label: vehicleTypeLabel(item.vehicle_type),
    percent: item.percentage,
  }));
}

export function segmentCongestionData(
  segments: SegmentCongestionDatum[],
): SegmentDatum[] {
  return segments.map((segment) => ({
    name: segment.name,
    value: segment.congestion_score,
  }));
}

export function segmentSpeedData(
  segments: SegmentSpeedDatum[],
): SegmentDatum[] {
  return segments.map((segment) => ({
    name: segment.name,
    value: segment.avg_speed_kmh,
  }));
}

export function forecastToDensityPoints(
  points: Array<{ time: string; density: number }>,
): DensityPoint[] {
  return points.map((point) => ({ time: point.time, density: point.density }));
}

export interface VehicleDetailRow {
  label: string;
  value: string;
}

export function vehicleToDetails(
  vehicle: GlobalVehicle,
  fallbackDetections = 0,
): VehicleDetailRow[] {
  const detections = vehicle.detection_count ?? fallbackDetections;
  return [
    { label: "Plate Number", value: vehicle.plate_text },
    { label: "Vehicle Type", value: vehicleTypeLabel(vehicle.vehicle_type) },
    {
      label: "Make / Model",
      value:
        [vehicle.make, vehicle.model].filter(Boolean).join(" ") || "\u2014",
    },
    { label: "First Seen", value: formatUtcDateTime(vehicle.first_seen) },
    { label: "Last Seen", value: formatUtcDateTime(vehicle.last_seen) },
    { label: "Total Detections", value: String(detections) },
  ];
}

export interface DetectionRow {
  id: string;
  time: string;
  camera: string;
  location: string;
  speed: number;
  confidence: number;
}

// export function vehicleToDetections(
//   detections: AnprEvent[],
//   locationOf: (cameraId: string) => string = () => "",
// ): DetectionRow[] {
//   return [...detections]
//     .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
//     .map((event) => ({
//       id: event.event_id,
//       time: formatUtcTime(event.timestamp),
//       camera: event.camera_id,
//       location: locationOf(event.camera_id),
//       speed: Math.round(event.speed.value_kmh),
//       confidence: Math.round(event.plate.confidence),
//     }));
// }

// export function vehicleToDetections(
//   detections: AnprEvent[],
//   locationOf: (cameraId: string) => string = () => "",
// ): DetectionRow[] {
//   return [...detections]
//     // Sort using the new detectedAt field
//     .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)) 
//     .map((event) => ({
//       id: event.eventId,
//       time: formatUtcTime(event.detectedAt),
//       camera: event.cameraId,
//       location: locationOf(event.cameraId),
//       speed: Math.round(event.speedKmh), 
//       // Assuming backend sends 0.94, multiply by 100 for the UI percentage
//       confidence: Math.round(event.plateConfidence * 100),
//     }));
// }

export function vehicleToDetections(
  detections: AnprEvent[],
  locationOf: (cameraId: string) => string = () => "",
): DetectionRow[] {
  return [...detections]
    // Safe sort: fall back to empty string if detectedAt is undefined
    .sort((a, b) => (b.detectedAt || "").localeCompare(a.detectedAt || "")) 
    .map((event) => ({
      id: event.eventId,
      time: formatUtcTime(event.detectedAt || ""),
      camera: event.cameraId,
      location: locationOf(event.cameraId),
      speed: Math.round(event.speedKmh || 0), 
      confidence: Math.round((event.plateConfidence || 0) * 100),
    }));
}

// export function trajectoryPath(points: TrajectoryPoint[]): [number, number][] {
//   return [...points]
//     .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
//     .map((point) => [point.longitude, point.latitude]);
// }

export function trajectoryPath(points: TrajectoryPoint[]): [number, number][] {
  return [...points]
    // Safe sort: fall back to empty string if timestamp is undefined
    .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""))
    .map((point) => [point.longitude, point.latitude]);
}

export interface OverviewInsights {
  peakTime: string;
  peakVolume: number;
  slowestTime: string;
  slowestSpeed: number;
  fastestTime: string;
  fastestSpeed: number;
  dominantLabel: string;
  weekOverWeek: string;
}

export function overviewInsights(
  timeSeries: TimeSeriesPoint[],
  breakdown: VehicleTypeBreakdown[],
  weekChange: number,
): OverviewInsights {
  const peak = timeSeries.reduce((top, point) =>
    point.volume > top.volume ? point : top,
  );
  const slowest = timeSeries.reduce((low, point) =>
    point.avg_speed_kmh < low.avg_speed_kmh ? point : low,
  );
  const fastest = timeSeries.reduce((high, point) =>
    point.avg_speed_kmh > high.avg_speed_kmh ? point : high,
  );
  const dominant = breakdown.reduce((top, item) =>
    item.percentage > top.percentage ? item : top,
  );
  const sign = weekChange >= 0 ? "+" : "";
  return {
    peakTime: peak.time,
    peakVolume: peak.volume,
    slowestTime: slowest.time,
    slowestSpeed: slowest.avg_speed_kmh,
    fastestTime: fastest.time,
    fastestSpeed: fastest.avg_speed_kmh,
    dominantLabel: vehicleTypeLabel(dominant.vehicle_type),
    weekOverWeek: `${sign}${Math.abs(weekChange)}%`,
  };
}

export function cameraById(
  cameras: CameraMeta[],
  cameraId: string,
): CameraMeta | undefined {
  return cameras.find((camera) => camera.camera_id === cameraId);
}

export function cameraLocationOf(
  cameras: CameraMeta[],
  cameraId: string,
): string {
  return cameraById(cameras, cameraId)?.location ?? "";
}

export function cameraNeighbors(
  cameras: CameraMeta[],
  cameraId: string,
): { prev: CameraMeta; next: CameraMeta } | null {
  const index = cameras.findIndex((camera) => camera.camera_id === cameraId);
  if (index < 0 || cameras.length === 0) return null;
  return {
    prev: cameras[(index - 1 + cameras.length) % cameras.length],
    next: cameras[(index + 1) % cameras.length],
  };
}

export function cameraPosition(
  cameras: CameraMeta[],
  cameraId: string,
): number | null {
  const index = cameras.findIndex((camera) => camera.camera_id === cameraId);
  return index >= 0 ? index + 1 : null;
}

export function cameraCircuits(cameras: CameraMeta[]): string[] {
  return [...new Set(cameras.map((camera) => camera.circuit))];
}
