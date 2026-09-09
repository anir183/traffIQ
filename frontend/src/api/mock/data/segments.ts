import type { SegmentResponse } from "../../../types/contract/trafficSummary";

export const SEGMENTS: SegmentResponse = {
  from: "2026-09-06T14:00:00.000Z",
  to: "2026-09-06T15:00:00.000Z",
  congested: [
    { segment_id: "SEG_VIP", name: "VIP Road", congestion_score: 800 },
    { segment_id: "SEG_EM", name: "EM Bypass", congestion_score: 130 },
    { segment_id: "SEG_S5", name: "Sector 5", congestion_score: 100 },
    { segment_id: "SEG_S2", name: "Sector 2", congestion_score: 65 },
    { segment_id: "SEG_SL", name: "Salt Lake", congestion_score: 40 },
    { segment_id: "SEG_TL", name: "Tollygunge", congestion_score: 12 },
  ],
  speed: [
    { segment_id: "SEG_14", name: "14", avg_speed_kmh: 74 },
    { segment_id: "SEG_17", name: "17", avg_speed_kmh: 78 },
    { segment_id: "SEG_25", name: "25", avg_speed_kmh: 66 },
    { segment_id: "SEG_23", name: "23", avg_speed_kmh: 69 },
    { segment_id: "SEG_18", name: "18", avg_speed_kmh: 62 },
    { segment_id: "SEG_21", name: "21", avg_speed_kmh: 66 },
  ],
};
