export type AlertStatus = "active" | "investigating" | "resolved";

export type AlertSeverity = "high" | "medium" | "low";

export type AlertType =
  | "blacklisted_vehicle"
  | "accident"
  | "speed_violation"
  | "wrong_way"
  | "route_anomaly"
  | "signal_malfunction"
  | "road_construction"
  | "suspicious_activity";

export interface AlertLocation {
  label: string;
  latitude?: number;
  longitude?: number;
}

export interface EventStreamMeta {
  status: "error" | "success" | "neutral" | "warning";
  title: string;
  location: string;
  timestamp: string;
  detail_line: string;
  link_text: string;
}

export interface Alert {
  alert_id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  detail: string;
  location: AlertLocation;
  detected_at: string;
  involved_plate?: string;
  event_stream?: EventStreamMeta;
}
