export type CameraStatus = "online" | "offline";

export interface CameraMeta {
  camera_id: string;
  name: string;
  circuit: string;
  group?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: CameraStatus;
}
