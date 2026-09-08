export interface SegmentDatum {
  name: string;
  value: number;
}

export interface DensityPoint {
  day: string;
  density: number;
}

export interface TrafficData {
  congestedSegments: SegmentDatum[];
  avgSpeed: SegmentDatum[];
  densityForecast: DensityPoint[];
}

export type IncidentStatus = "Active" | "Investigating" | "Resolved";

export type IncidentIcon = "alert" | "warning" | "wrongway";

export interface Incident {
  id: string;
  icon: IncidentIcon;
  title: string;
  detail: string;
  location: string;
  time: string;
  status: IncidentStatus;
}

export type VehicleType = "Car" | "Truck" | "Bike" | "Bus";

export interface AnprEntry {
  id: string;
  time: string;
  vehicleNumber: string;
  camera: string;
  vehicleType: VehicleType;
  confidence: number;
}

export type IncidentEventStatus = "error" | "success" | "neutral" | "warning";

export interface IncidentEvent {
  id: string;
  status: IncidentEventStatus;
  title: string;
  location: string;
  timestamp: string;
  detailLine: string;
  linkText: string;
}
