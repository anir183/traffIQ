import type {
  AnprEvent,
  VehicleClass,
} from "../../../types/contract/anprEvent";

type FeedEntry = readonly [
  time: string,
  plateText: string,
  cameraId: string,
  vehicleType: VehicleClass,
  confidence: number,
];

const FEED_ENTRIES: FeedEntry[] = [
  ["14:32:18", "WB02AM7555", "CAM_001", "car", 92],
  ["14:32:17", "DL8CAX1234", "CAM_003", "truck", 88],
  ["14:32:15", "MH01AB9876", "CAM_002", "bike", 85],
  ["14:32:14", "WB20CD4567", "CAM_004", "car", 91],
  ["14:32:12", "KA05MN4321", "CAM_001", "bus", 87],
  ["14:32:10", "AS012X7788", "CAM_002", "car", 90],
  ["14:32:08", "BR06PQ1122", "CAM_003", "bike", 83],
  ["14:32:06", "WB12XY9999", "CAM_004", "truck", 86],
  ["14:32:04", "OD02KL3344", "CAM_001", "car", 89],
  ["14:32:02", "RJ14AB2211", "CAM_002", "bike", 84],
  ["14:31:58", "TN09CV6677", "CAM_003", "truck", 90],
  ["14:31:55", "GJ01DR8899", "CAM_004", "car", 87],
  ["14:31:52", "WB05ES2233", "CAM_001", "bus", 88],
  ["14:31:49", "PB10FT4455", "CAM_002", "car", 91],
  ["14:31:47", "UP32GU6677", "CAM_003", "bike", 82],
  ["14:31:44", "HR26HV8899", "CAM_004", "truck", 85],
  ["14:31:40", "TS09JD1122", "CAM_001", "car", 93],
  ["14:31:37", "KL07KG3344", "CAM_002", "bus", 86],
  ["14:31:34", "WB18LH5566", "CAM_003", "car", 89],
  ["14:31:31", "AP09MJ7788", "CAM_004", "bike", 84],
  ["14:31:27", "MP04NK9900", "CAM_001", "truck", 88],
  ["14:31:24", "DL3CPN1122", "CAM_002", "car", 90],
  ["14:31:21", "CG04PR3344", "CAM_003", "car", 86],
  ["14:31:18", "WB22QS5566", "CAM_004", "bus", 87],
  ["14:31:14", "JH05RT7788", "CAM_001", "bike", 83],
  ["14:31:11", "UK08SU9900", "CAM_002", "car", 92],
  ["14:31:08", "WB06TV1122", "CAM_003", "truck", 85],
  ["14:31:05", "DL5CV3344", "CAM_004", "car", 88],
];

export const ANPR_EVENTS: AnprEvent[] = FEED_ENTRIES.map(
  ([time, plateText, cameraId, vehicleType, confidence], i) => ({
    event_id: `evt_feed_${String(i + 1).padStart(3, "0")}`,
    event_type: "vehicle_anpr",
    camera_id: cameraId,
    timestamp: `2026-09-06T${time}.000Z`,
    local_track_id: 100 + i,
    vehicle: {
      type: vehicleType,
      type_confidence: Number((confidence / 100).toFixed(2)),
      bbox: [100 + i, 200 + i, 300 + i, 350 + i],
    },
    plate: {
      text: plateText,
      confidence,
      format_valid: true,
      state_code: plateText.slice(0, 2),
      state_auto_corrected: false,
    },
    speed: {
      value_kmh: 20 + ((i * 7) % 30),
      estimated: true,
      direction: "north",
    },
    plate_bbox: [400 + i, 250 + i, 500 + i, 300 + i],
    frame_number: 1000 + i,
    source_video_timestamp_ms: 40000 + i * 100,
  }),
);

export function getAnprEventByPlate(plateText: string): AnprEvent[] {
  return ANPR_EVENTS.filter(
    (event) => event.plate.text.toUpperCase() === plateText.toUpperCase(),
  );
}
