import { getTrafficDensityForecast } from "../api/endpoints/traffic";
import type { DensityForecastResponse } from "../types/contract/trafficSummary";
import { useAsyncResource } from "./useAsyncResource";

export function useTrafficDensityForecast() {
  return useAsyncResource<DensityForecastResponse>(
    (signal) => getTrafficDensityForecast({ signal }),
    [],
  );
}
