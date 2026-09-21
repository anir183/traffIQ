import type { PerCameraCount } from "../../../types/contract/trafficSummary";
import type { TimeSeriesPoint } from "../../../types/contract/trafficSummary";
import type { TrafficMetrics } from "../../../types/contract/trafficSummary";
import type { TrafficSummaryResponse } from "../../../types/contract/trafficSummary";
import type { VehicleTypeBreakdown } from "../../../types/contract/trafficSummary";

export const METRICS: TrafficMetrics = {
  total_vehicles: 125430,
  unique_vehicles: 91245,
  avg_speed_kmh: 32.4,
  congestion_score: 68,
  density_per_km: 45.2,
  total_vehicles_change_pct: 14,
  unique_vehicles_change_pct: 11,
  avg_speed_change_pct: -6,
  congestion_score_change_pct: 6,
  vehicle_type_breakdown: [
    { vehicle_type: "car", count: 58, percentage: 58 },
    { vehicle_type: "bike", count: 26, percentage: 26 },
    { vehicle_type: "bus", count: 8, percentage: 8 },
    { vehicle_type: "truck", count: 6, percentage: 6 },
    { vehicle_type: "other", count: 2, percentage: 2 },
  ] satisfies VehicleTypeBreakdown[],
};

export const TIME_SERIES: TimeSeriesPoint[] = [
  { time: "00:00", volume: 3200, avg_speed_kmh: 34 },
  { time: "02:00", volume: 4100, avg_speed_kmh: 40 },
  { time: "04:00", volume: 5400, avg_speed_kmh: 41 },
  { time: "06:00", volume: 7600, avg_speed_kmh: 33 },
  { time: "08:00", volume: 9800, avg_speed_kmh: 30 },
  { time: "10:00", volume: 11600, avg_speed_kmh: 38 },
  { time: "12:00", volume: 12800, avg_speed_kmh: 27 },
  { time: "14:00", volume: 11400, avg_speed_kmh: 22 },
  { time: "16:00", volume: 10200, avg_speed_kmh: 18 },
  { time: "18:00", volume: 8600, avg_speed_kmh: 24 },
  { time: "20:00", volume: 6800, avg_speed_kmh: 26 },
  { time: "22:00", volume: 5200, avg_speed_kmh: 30 },
];

export const PER_CAMERA: PerCameraCount[] = Array.from(
  { length: 40 },
  (_, i) => ({
    camera_id: `CAM_${String(i + 1).padStart(3, "0")}`,
    name: `CAM ${String(i + 1).padStart(3, "0")}`,
    vehicle_count: 18500 - i * 310 + ((i * 37) % 900),
  }),
);

export const TRAFFIC_SUMMARY: TrafficSummaryResponse = {
  camera_id: "ALL",
  window: {
    from: "2026-09-06T14:00:00.000Z",
    to: "2026-09-06T15:00:00.000Z",
  },
  metrics: METRICS,
  time_series: TIME_SERIES,
  per_camera: PER_CAMERA,
};
