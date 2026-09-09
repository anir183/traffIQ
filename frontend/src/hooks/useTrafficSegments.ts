import { getTrafficSegments } from "../api/endpoints/traffic";
import type { SegmentResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficSegments() {
  return useAsyncResource<SegmentResponse>(
    (signal) => getTrafficSegments({ signal }),
    [],
  );
}
