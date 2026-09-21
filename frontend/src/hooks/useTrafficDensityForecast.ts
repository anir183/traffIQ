import { getTrafficDensityForecast } from "../api/endpoints/traffic";
import type { Bbox } from "../components/map/incidentsApi";
import type { DensityForecastResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficDensityForecast(bbox?: Bbox | null) {
  return useAsyncResource<DensityForecastResponse>(
    (signal) => getTrafficDensityForecast({ bbox, signal }),
    [bbox?.west, bbox?.south, bbox?.east, bbox?.north],
  );
}
