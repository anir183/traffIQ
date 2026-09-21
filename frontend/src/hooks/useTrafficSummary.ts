import { getTrafficSummary } from "../api/endpoints/traffic";
import type { Bbox } from "../components/map/incidentsApi";
import type { TrafficSummaryResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficSummary(bbox?: Bbox | null) {
  return useAsyncResource<TrafficSummaryResponse>(
    (signal) => getTrafficSummary({ bbox, signal }),
    [bbox?.west, bbox?.south, bbox?.east, bbox?.north],
  );
}
