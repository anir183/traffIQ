import { getTrafficSegments } from "../api/endpoints/traffic";
import type { Bbox } from "../components/map/incidentsApi";
import type { SegmentResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficSegments(bbox?: Bbox | null) {
  return useAsyncResource<SegmentResponse>(
    (signal) => getTrafficSegments({ bbox, signal }),
    [bbox?.west, bbox?.south, bbox?.east, bbox?.north],
  );
}
