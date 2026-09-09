import type { Alert } from "../../types/contract/alert";
import type { AnprEvent } from "../../types/contract/anprEvent";
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from "../../types/contract/auth";
import type { CameraMeta } from "../../types/contract/camera";
import type { Paginated } from "../../types/contract/pagination";
import type { SearchResult } from "../../types/contract/search";
import type {
  DensityForecastResponse,
  SegmentResponse,
  TrafficSummaryResponse,
} from "../../types/contract/trafficSummary";
import type { TrajectoryResponse } from "../../types/contract/trajectory";
import type { User } from "../../types/contract/user";
import type {
  GlobalVehicle,
  VehicleDetailResponse,
} from "../../types/contract/vehicle";
import { ApiError } from "../http";
import { ALERTS } from "./data/alerts";
import { ANPR_EVENTS } from "./data/anprEvents";
import { CAMERAS } from "./data/cameras";
import { DENSITY_FORECAST } from "./data/densityForecast";
import { SEGMENTS } from "./data/segments";
import { TRAFFIC_SUMMARY } from "./data/traffic";
import { MOCK_USER } from "./data/users";
import { findVehicleRecords, getVehicleRecord } from "./data/vehicles";
import { mockDelay, paginate } from "./middleware";

export interface AnprQuery {
  camera_id?: string;
  plate_text?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface VehicleQuery {
  plate_text?: string;
  limit?: number;
  offset?: number;
}

export interface CameraQuery {
  circuit?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface AlertQuery {
  status?: string;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface SearchQuery {
  q: string;
  types?: string;
  limit?: number;
}

export async function getAnprEvents(
  query: AnprQuery = {},
): Promise<Paginated<AnprEvent>> {
  const { camera_id, plate_text, limit, offset } = query;
  const filtered = ANPR_EVENTS.filter((event) => {
    if (camera_id && event.camera_id !== camera_id) return false;
    if (plate_text && !event.plate.text.includes(plate_text.toUpperCase())) {
      return false;
    }
    return true;
  });
  return mockDelay(paginate(filtered, limit, offset));
}

export async function getVehicles(
  query: VehicleQuery = {},
): Promise<Paginated<GlobalVehicle>> {
  const { plate_text, limit, offset } = query;
  const records = findVehicleRecords(plate_text ?? "");
  return mockDelay(
    paginate(
      records.map((record) => record.vehicle),
      limit,
      offset,
    ),
  );
}

export async function getVehicleByPlate(
  plateText: string,
): Promise<VehicleDetailResponse> {
  const record = getVehicleRecord(plateText);
  if (!record) {
    throw new ApiError(`Plate ${plateText} not found`, "PLATE_NOT_FOUND", 404);
  }
  return mockDelay({
    vehicle: record.vehicle,
    detections: record.detections,
  });
}

const DEFAULT_TRAJECTORY: TrajectoryResponse = {
  plate_text: "WB02AM7555",
  global_vehicle_id: "GV_00017",
  query_range: {
    from: "2026-09-06T00:00:00.000Z",
    to: "2026-09-06T23:59:59.000Z",
  },
  points: [
    {
      camera_id: "CAM_001",
      latitude: 22.5958,
      longitude: 88.271,
      timestamp: "2026-09-06T14:30:02.000Z",
      speed_kmh: 27,
      direction: "north",
    },
    {
      camera_id: "CAM_004",
      latitude: 22.5893,
      longitude: 88.3105,
      timestamp: "2026-09-06T14:38:45.000Z",
      speed_kmh: 39,
      direction: "east",
    },
    {
      camera_id: "CAM_006",
      latitude: 22.5726,
      longitude: 88.3639,
      timestamp: "2026-09-06T14:41:08.000Z",
      speed_kmh: 45,
      direction: "southeast",
    },
    {
      camera_id: "CAM_009",
      latitude: 22.5697,
      longitude: 88.4103,
      timestamp: "2026-09-06T14:47:56.000Z",
      speed_kmh: 34,
      direction: "south",
    },
  ],
};

export async function getTrajectory(
  plateText: string,
): Promise<TrajectoryResponse> {
  const record = getVehicleRecord(plateText);
  if (!record) {
    throw new ApiError(`Plate ${plateText} not found`, "PLATE_NOT_FOUND", 404);
  }
  const response: TrajectoryResponse = {
    ...DEFAULT_TRAJECTORY,
    plate_text: record.vehicle.plate_text,
    global_vehicle_id: record.vehicle.global_vehicle_id,
  };
  return mockDelay(response);
}

export async function getCameras(
  query: CameraQuery = {},
): Promise<Paginated<CameraMeta>> {
  const { circuit, status, limit, offset } = query;
  const filtered = CAMERAS.filter((camera) => {
    if (circuit && camera.circuit !== circuit) return false;
    if (status && camera.status !== status) return false;
    return true;
  });
  return mockDelay(paginate(filtered, limit, offset));
}

export async function getCameraById(cameraId: string): Promise<CameraMeta> {
  const camera = CAMERAS.find((entry) => entry.camera_id === cameraId);
  if (!camera) {
    throw new ApiError(`Camera ${cameraId} not found`, "CAMERA_NOT_FOUND", 404);
  }
  return mockDelay(camera);
}

export async function getTrafficSummary(): Promise<TrafficSummaryResponse> {
  return mockDelay(TRAFFIC_SUMMARY);
}

export async function getSegments(): Promise<SegmentResponse> {
  return mockDelay(SEGMENTS);
}

export async function getDensityForecast(): Promise<DensityForecastResponse> {
  return mockDelay(DENSITY_FORECAST);
}

export async function getAlerts(
  query: AlertQuery = {},
): Promise<Paginated<Alert>> {
  const { status, type, severity, limit, offset } = query;
  const filtered = ALERTS.filter((alert) => {
    if (status && alert.status !== status) return false;
    if (type && alert.type !== type) return false;
    if (severity && alert.severity !== severity) return false;
    return true;
  });
  return mockDelay(paginate(filtered, limit, offset));
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const validEmail = req.email.trim().toLowerCase() === MOCK_USER.email;
  const validPassword = req.password === "admin123";
  if (!validEmail || !validPassword) {
    throw new ApiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
  }
  return mockDelay(
    {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
      user: MOCK_USER,
    },
    { failure: false },
  );
}

export async function refresh(): Promise<RefreshResponse> {
  return mockDelay(
    {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
    },
    { failure: false },
  );
}

export async function logout(): Promise<void> {
  await mockDelay(void 0, { failure: false });
}

export async function getMe(): Promise<User> {
  return mockDelay(MOCK_USER, { failure: false });
}

export async function search(
  query: SearchQuery,
): Promise<Paginated<SearchResult>> {
  const { q, types, limit } = query;
  const needle = q.trim().toUpperCase();
  const typeFilter = new Set(
    (types ?? "plate,camera,alert").split(",").map((type) => type.trim()),
  );
  const results: SearchResult[] = [];

  if (needle === "") {
    return mockDelay(paginate(results, limit ?? 8, 0));
  }

  if (typeFilter.has("plate")) {
    const seen = new Set<string>();
    for (const event of ANPR_EVENTS) {
      const plate = event.plate.text;
      if (seen.has(plate) || !plate.includes(needle)) continue;
      seen.add(plate);
      results.push({
        type: "plate",
        label: plate,
        subtitle: `${event.vehicle.type} detected`,
        href: `/anpr?plate=${encodeURIComponent(plate)}`,
      });
    }
  }

  if (typeFilter.has("camera")) {
    for (const camera of CAMERAS) {
      if (!camera.camera_id.includes(needle) && !camera.name.includes(needle)) {
        continue;
      }
      results.push({
        type: "camera",
        label: camera.name,
        subtitle: camera.circuit,
        href: `/feed/cam/${camera.camera_id}`,
      });
    }
  }

  if (typeFilter.has("alert")) {
    for (const alert of ALERTS) {
      if (
        !alert.title.toUpperCase().includes(needle) &&
        !alert.detail.toUpperCase().includes(needle) &&
        !alert.location.label.toUpperCase().includes(needle)
      ) {
        continue;
      }
      results.push({
        type: "alert",
        label: alert.title,
        subtitle: alert.location.label || alert.type,
        href: "/incident",
      });
    }
  }

  return mockDelay(paginate(results, limit ?? 8, 0));
}
