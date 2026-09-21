export type CameraStatus = "online" | "offline";

export type FeedSourceKind = "procedural" | "snapshot" | "hls";

export interface CameraMeta {
  camera_id: string;
  name: string;
  circuit: string;
  group?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: CameraStatus;
  stream_type?: FeedSourceKind;
  stream_url?: string;
}
