export interface TrajectoryPoint {
  camera_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed_kmh: number;
  direction: string;
}

export interface TrajectoryResponse {
  plate_text: string;
  global_vehicle_id: string;
  query_range: {
    from: string;
    to: string;
  };
  points: TrajectoryPoint[];
}
