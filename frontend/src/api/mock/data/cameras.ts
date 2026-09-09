import type { CameraMeta } from "../../../types/contract/camera";

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

export const CAMERAS: CameraMeta[] = Array.from({ length: 40 }, (_, i) => {
  const cameraId = `CAM_${String(i + 1).padStart(3, "0")}`;
  return {
    camera_id: cameraId,
    name: `CAM ${String(i + 1).padStart(3, "0")}`,
    circuit: CIRCUITS[i % CIRCUITS.length],
    location: LOCATIONS[cameraId],
    status: "offline",
  };
});

export function getCameraMeta(cameraId: string): CameraMeta | undefined {
  return CAMERAS.find((camera) => camera.camera_id === cameraId);
}
