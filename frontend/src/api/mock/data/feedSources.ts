import type { FeedSourceKind } from "../../../types/contract/camera";

export interface FeedSource {
  type: FeedSourceKind;
  url?: string;
}

// Pluggable real camera feeds for the Live Feed PoC.
//
// "procedural"   -> a simulated traffic-corridor canvas (always renders).
// "snapshot"     -> public JPEG/MJPEG webcam endpoint shown via <img>,
//                   auto-refreshed every ~12 s (no CORS needed for images).
// "hls"          -> HLS .m3u8 manifest (e.g. Caltrans wzmedia). Playback is
//                   not wired up yet in this pass (no hls.js dependency);
//                   leave these as a planned slot list.
//
// Public webcam endpoints are hotlink-sensitive and URLs change often, so
// only the cameras below are seeded (to "procedural"), and any live URLs you
// want to try can be dropped in here. Examples:
//   CAM_004: { type: "snapshot", url: "https://example.org/cam/parkstreet.jpg" },
//   CAM_006: { type: "hls", url: "https://example.org/hls/saltlake.m3u8" },
export const FEED_SOURCES: Record<string, FeedSource> = {
  CAM_001: { type: "procedural" },
  CAM_002: { type: "procedural" },
  CAM_003: { type: "procedural" },
  CAM_004: { type: "procedural" },
  CAM_005: { type: "procedural" },
  CAM_006: { type: "procedural" },
  CAM_007: { type: "procedural" },
  CAM_009: { type: "procedural" },
};

export function getFeedSource(cameraId: string): FeedSource {
  return FEED_SOURCES[cameraId] ?? { type: "procedural" };
}
