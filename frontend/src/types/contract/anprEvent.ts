// export type VehicleClass = "car" | "truck" | "bike" | "bus" | "other";

// export interface AnprPlate {
//   text: string;
//   confidence: number;
//   format_valid: boolean;
//   state_code: string;
//   state_auto_corrected: boolean;
// }

// export interface AnprEvent {
//   event_id: string;
//   event_type: string;
//   camera_id: string;
//   timestamp: string;
//   local_track_id: number;
//   vehicle: {
//     type: VehicleClass;
//     type_confidence: number;
//     bbox: [number, number, number, number];
//   };
//   plate: AnprPlate;
//   speed: {
//     value_kmh: number;
//     estimated: boolean;
//     direction: string;
//   };
//   plate_bbox?: [number, number, number, number];
//   frame_number?: number;
//   source_video_timestamp_ms?: number;
// }

export type VehicleClass = "car" | "truck" | "bike" | "bus" | "other";

export interface AnprEvent {
  id: number;
  eventId: string;
  localTrackId: number;
  plateNumber: string;
  
  // Note: The backend sends uppercase (e.g., "CAR", "TRUCK"), 
  // but we convert it in the adapter to match your UI components
  vehicleType: string; 
  
  cameraId: string;
  detectedAt: string;
  firstSeen: string;
  lastSeen: string;
  speedKmh: number;
  direction: string;
  vehicleConfidence: number;
  plateConfidence: number;
}
