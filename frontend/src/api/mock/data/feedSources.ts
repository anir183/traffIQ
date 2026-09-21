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
// "hls"          -> HLS .m3u8 manifest (e.g. Caltrans wzmedia). Played with
//                   hls.js; fatal stream errors fall back to the simulated
//                   canvas so a flaky feed never shows a black box.
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

export interface LiveFeedEntry {
  id: string;
  name: string;
  location: string;
  type: "snapshot" | "hls";
  url: string;
  latitude?: number;
  longitude?: number;
}

// Dedicated external/live cameras shown alongside the local simulated ones.
// Each entry with a URL becomes its own camera tile (id `EXT_xxx`, circuit
// "External Feeds"). Drop in more entries to grow the live set — no code
// changes needed.
export const LIVE_FEEDS: LiveFeedEntry[] = [
  {
    id: "EXT_001",
    name: "Seoul CCTV · Ch 11",
    location: "Seoul, KR (TOPIS)",
    type: "hls",
    url: "https://topiscctv1.eseoul.go.kr/sd2/ch11.stream/playlist.m3u8",
  },
  {
    id: "EXT_002",
    name: "Seoul CCTV · Ch 59",
    location: "Seoul, KR (TOPIS)",
    type: "hls",
    url: "https://topiscctv1.eseoul.go.kr/sd2/ch59.stream/playlist.m3u8",
  },
  {
    id: "EXT_003",
    name: "Seoul CCTV · Ch 2",
    location: "Seoul, KR (TOPIS)",
    type: "hls",
    url: "https://topiscctv1.eseoul.go.kr/sd2/ch2.stream/playlist.m3u8",
  },
  {
    id: "EXT_004",
    name: "R10 · Cam 151",
    location: "NY State DOT",
    type: "hls",
    url: "https://s51.nysdot.skyvdn.com/rtplive/R10_151/playlist.m3u8",
  },
  {
    id: "EXT_005",
    name: "MoDOT Cam 289",
    location: "MoDOT traveler",
    type: "hls",
    url: "https://sfs02-traveler.modot.mo.gov/rtplive/MODOT_CAM_289/playlist.m3u8",
  },
  {
    id: "EXT_006",
    name: "MoDOT Cam 360",
    location: "MoDOT traveler",
    type: "hls",
    url: "https://sfs03-traveler.modot.mo.gov/rtplive/MODOT_CAM_360/playlist.m3u8",
  },
  {
    id: "EXT_007",
    name: "CHART Feed 18",
    location: "CHART (MD)",
    type: "hls",
    url: "https://s57.us-east-1.skyvdn.com/rtplive/CHARTFeed18/playlist.m3u8",
  },
  {
    id: "EXT_008",
    name: "TA · Cam 043",
    location: "NY State DOT",
    type: "hls",
    url: "https://s52.nysdot.skyvdn.com/rtplive/TA_043/playlist.m3u8",
  },
  {
    id: "EXT_009",
    name: "R3 · Cam 066",
    location: "NY State DOT",
    type: "hls",
    url: "https://s7.nysdot.skyvdn.com/rtplive/R3_066/playlist.m3u8",
  },
  {
    id: "EXT_010",
    name: "R1 · Cam 076",
    location: "NY State DOT",
    type: "hls",
    url: "https://s7.nysdot.skyvdn.com/rtplive/R1_076/playlist.m3u8",
  },
];

export function getFeedSource(cameraId: string): FeedSource {
  return FEED_SOURCES[cameraId] ?? { type: "procedural" };
}
