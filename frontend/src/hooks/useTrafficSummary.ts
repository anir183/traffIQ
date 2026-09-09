import { getTrafficSummary } from "../api/endpoints/traffic";
import type { TrafficSummaryResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficSummary() {
  return useAsyncResource<TrafficSummaryResponse>(
    (signal) => getTrafficSummary({ signal }),
    [],
  );
}
