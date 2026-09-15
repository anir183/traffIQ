import type { AnprEvent } from "../../../types/contract/anprEvent";
import type { GlobalVehicle } from "../../../types/contract/vehicle";

type DetectionTuple = readonly [
  time: string,
  cameraId: string,
  speedKmh: number,
  confidence: number,
];

function buildDetection(
  plateText: string,
  index: number,
  [time, cameraId, speedKmh, confidence]: DetectionTuple,
  total: number,
): AnprEvent {
  return {
    event_id: `evt_${plateText}_${String(index + 1).padStart(2, "0")}`,
    event_type: "vehicle_anpr",
    camera_id: cameraId,
    timestamp: `2026-09-06T${time}.000Z`,
    local_track_id: 200 + index,
    vehicle: {
      type: "car",
      type_confidence: Number((confidence / 100).toFixed(2)),
      bbox: [120, 200, 380, 460],
    },
    plate: {
      text: plateText,
      confidence,
      format_valid: true,
      state_code: plateText.slice(0, 2),
      state_auto_corrected: false,
    },
    speed: {
      value_kmh: speedKmh,
      estimated: true,
      direction: "north",
    },
    plate_bbox: [400, 260, 520, 310],
    frame_number: 900 - index,
    source_video_timestamp_ms: 40000 - index * 1000 + total,
  };
}

const DETAIL_DETECTIONS: DetectionTuple[] = [
  ["14:47:56", "CAM_004", 34, 91],
  ["14:44:21", "CAM_002", 41, 88],
  ["14:41:08", "CAM_001", 27, 93],
  ["14:38:45", "CAM_006", 39, 90],
  ["14:35:32", "CAM_009", 45, 86],
  ["14:33:19", "CAM_003", 31, 92],
  ["14:30:02", "CAM_007", 38, 89],
  ["14:26:40", "CAM_004", 36, 87],
  ["14:22:15", "CAM_001", 29, 91],
  ["14:18:50", "CAM_002", 43, 85],
  ["14:15:31", "CAM_006", 33, 90],
  ["14:11:58", "CAM_009", 47, 84],
  ["14:07:22", "CAM_003", 35, 88],
  ["14:02:44", "CAM_007", 40, 86],
];

interface MockVehicleRecord {
  vehicle: GlobalVehicle;
  detections: AnprEvent[];
}

export const MOCK_VEHICLES: MockVehicleRecord[] = [
  {
    vehicle: {
      global_vehicle_id: "GV_00017",
      plate_text: "WB02AM7555",
      vehicle_type: "car",
      first_seen: "2026-09-06T14:30:02.000Z",
      last_seen: "2026-09-06T14:47:56.000Z",
      camera_sequence: [
        {
          camera_id: "CAM_001",
          timestamp: "2026-09-06T14:30:02.000Z",
          local_track_id: 17,
        },
        {
          camera_id: "CAM_004",
          timestamp: "2026-09-06T14:38:45.000Z",
          local_track_id: 8,
        },
        {
          camera_id: "CAM_006",
          timestamp: "2026-09-06T14:41:08.000Z",
          local_track_id: 31,
        },
        {
          camera_id: "CAM_009",
          timestamp: "2026-09-06T14:47:56.000Z",
          local_track_id: 12,
        },
      ],
      is_blacklisted: false,
      make: "Maruti",
      model: "Swift",
      detection_count: 14,
    },
    detections: DETAIL_DETECTIONS.map((tuple, index) =>
      buildDetection("WB02AM7555", index, tuple, DETAIL_DETECTIONS.length),
    ),
  },
  {
    vehicle: {
      global_vehicle_id: "GV_00021",
      plate_text: "WB20CD4567",
      vehicle_type: "car",
      first_seen: "2026-09-06T14:32:14.000Z",
      last_seen: "2026-09-06T14:32:14.000Z",
      camera_sequence: [
        {
          camera_id: "CAM_004",
          timestamp: "2026-09-06T14:32:14.000Z",
          local_track_id: 42,
        },
      ],
      is_blacklisted: false,
      detection_count: 1,
    },
    detections: [
      buildDetection("WB20CD4567", 0, ["14:32:14", "CAM_004", 41, 91], 1),
    ],
  },
];

export function getVehicleRecord(
  plateText: string,
): MockVehicleRecord | undefined {
  const query = plateText.toUpperCase();
  return MOCK_VEHICLES.find(
    (record) => record.vehicle.plate_text.toUpperCase() === query,
  );
}

export function findVehicleRecords(query: string): MockVehicleRecord[] {
  const needle = query.trim().toUpperCase();
  if (needle === "") return MOCK_VEHICLES;
  return MOCK_VEHICLES.filter((record) =>
    record.vehicle.plate_text.toUpperCase().includes(needle),
  );
}
