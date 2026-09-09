import type { AnprEvent, VehicleClass } from "./anprEvent";

export interface CameraSequenceEntry {
  camera_id: string;
  timestamp: string;
  local_track_id: number;
}

export interface GlobalVehicle {
  global_vehicle_id: string;
  plate_text: string;
  vehicle_type: VehicleClass;
  first_seen: string;
  last_seen: string;
  camera_sequence: CameraSequenceEntry[];
  is_blacklisted: boolean;
  make?: string;
  model?: string;
  detection_count?: number;
}

export interface VehicleDetailResponse {
  vehicle: GlobalVehicle;
  detections: AnprEvent[];
}
