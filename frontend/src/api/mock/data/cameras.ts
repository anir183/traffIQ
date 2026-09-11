import type { CameraMeta } from "../../../types/contract/camera";
import { FEED_SOURCES, LIVE_FEEDS } from "./feedSources";

export const CIRCUITS = [
  "Esplanade Circuit",
  "Joka Circuit",
  "Salt Lake Circuit",
  "Ballygunge Circuit",
  "Park Street Circuit",
  "New Town Circuit",
  "Ballygunge-Lanka Circuit",
  "Howrah Circuit",
];

const LOCATIONS: Record<string, string> = {
  CAM_001: "Esplanade",
  CAM_002: "Joka",
  CAM_003: "Ballygunge",
  CAM_004: "Park Street",
  CAM_006: "Salt Lake",
  CAM_007: "Howrah",
  CAM_009: "New Town",
};

const COORDS: Record<string, [number, number]> = {
  CAM_001: [22.5645, 88.348],
  CAM_002: [22.467, 88.299],
  CAM_003: [22.5266, 88.365],
  CAM_004: [22.55, 88.355],
  CAM_006: [22.5744, 88.427],
  CAM_007: [22.588, 88.324],
  CAM_009: [22.586, 88.434],
};

const SIMULATED_CAMERAS: CameraMeta[] = Array.from(
  { length: 11 },
  (_, i): CameraMeta => {
    const cameraId = `CAM_${String(i + 1).padStart(3, "0")}`;
    const feed = FEED_SOURCES[cameraId];
    const coords = COORDS[cameraId];
    return {
      camera_id: cameraId,
      name: `CAM ${String(i + 1).padStart(3, "0")}`,
      circuit: CIRCUITS[i % CIRCUITS.length],
      location: LOCATIONS[cameraId],
      latitude: coords?.[0],
      longitude: coords?.[1],
      status: feed ? "online" : "offline",
      stream_type: feed?.type,
      stream_url: feed?.url,
    };
  },
);

const EXTERNAL_CAMERAS: CameraMeta[] = LIVE_FEEDS.map((entry): CameraMeta => ({
  camera_id: entry.id,
  name: entry.name,
  circuit: "External Feeds",
  location: entry.location,
  latitude: entry.latitude,
  longitude: entry.longitude,
  status: "online",
  stream_type: entry.type,
  stream_url: entry.url,
}));

export const CAMERAS: CameraMeta[] = [
  ...SIMULATED_CAMERAS,
  ...EXTERNAL_CAMERAS,
];

export function getCameraMeta(cameraId: string): CameraMeta | undefined {
  return CAMERAS.find((camera) => camera.camera_id === cameraId);
}

/**
 * True when at least one real (non-simulated) feed URL is configured.
 */
export function hasConfiguredLiveFeeds(): boolean {
  return LIVE_FEEDS.some((entry) => entry.url.trim().length > 0);
}

/**
 * Browser connectivity (defaults to online outside a browser, e.g. tests).
 */
export function isFrontendOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * The camera set the Live Feed should present right now: when real feeds are
 * configured AND the frontend is online, hide the simulated/offline local
 * cameras and show only the real external feeds; otherwise show the full
 * simulated catalog.
 */
export function getVisibleCameras(): CameraMeta[] {
  if (hasConfiguredLiveFeeds() && isFrontendOnline()) {
    return EXTERNAL_CAMERAS;
  }
  return CAMERAS;
}
