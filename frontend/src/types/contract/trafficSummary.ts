import type { VehicleClass } from "./anprEvent";

export interface TrafficWindow {
  from: string;
  to: string;
}

export interface VehicleTypeBreakdown {
  vehicle_type: VehicleClass;
  count: number;
  percentage: number;
}

export interface TrafficMetrics {
  total_vehicles: number;
  unique_vehicles: number;
  avg_speed_kmh: number;
  congestion_score: number;
  density_per_km?: number;
  total_vehicles_change_pct: number;
  unique_vehicles_change_pct: number;
  avg_speed_change_pct: number;
  congestion_score_change_pct: number;
  vehicle_type_breakdown: VehicleTypeBreakdown[];
}

export interface TrafficSummaryResponse {
  camera_id: string;
  window: TrafficWindow;
  metrics: TrafficMetrics;
  time_series: TimeSeriesPoint[];
  per_camera: PerCameraCount[];
}

export interface TimeSeriesPoint {
  time: string;
  volume: number;
  avg_speed_kmh: number;
}

export interface PerCameraCount {
  camera_id: string;
  name: string;
  vehicle_count: number;
}

export interface SegmentCongestionDatum {
  segment_id: string;
  name: string;
  congestion_score: number;
  lat?: number;
  lon?: number;
}

export interface SegmentSpeedDatum {
  segment_id: string;
  name: string;
  avg_speed_kmh: number;
  lat?: number;
  lon?: number;
}

export interface SegmentResponse {
  from: string;
  to: string;
  congested: SegmentCongestionDatum[];
  speed: SegmentSpeedDatum[];
}

export interface DensityForecastPoint {
  time: string;
  density: number;
}

export interface DensityForecastResponse {
  from: string;
  to: string;
  points: DensityForecastPoint[];
}
