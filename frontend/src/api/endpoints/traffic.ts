import type { Bbox } from "../../components/map/incidentsApi";
import type {
  DensityForecastResponse,
  SegmentResponse,
  TrafficSummaryResponse,
} from "../../types/contract/trafficSummary";
import { env } from "../env";
import { request } from "../http";
import type { RequestOptions } from "../http";
import * as mock from "../mock/handlers";
import { abortable } from "../mock/middleware";

export interface TrafficRequestOptions extends RequestOptions {
  bbox?: Bbox | null;
}

export async function getTrafficSummary(
  options: TrafficRequestOptions = {},
): Promise<TrafficSummaryResponse> {
  if (env.dataSource === "mock") {
    return abortable(
      mock.getTrafficSummary(options.bbox ?? null),
      options.signal,
    );
  }
  return request<TrafficSummaryResponse>("/traffic/summary", options);
}

export async function getTrafficSegments(
  options: TrafficRequestOptions = {},
): Promise<SegmentResponse> {
  if (env.dataSource === "mock") {
    return abortable(mock.getSegments(options.bbox ?? null), options.signal);
  }
  return request<SegmentResponse>("/traffic/segments", options);
}

export async function getTrafficDensityForecast(
  options: TrafficRequestOptions = {},
): Promise<DensityForecastResponse> {
  if (env.dataSource === "mock") {
    return abortable(
      mock.getDensityForecast(options.bbox ?? null),
      options.signal,
    );
  }
  return request<DensityForecastResponse>("/traffic/density-forecast", options);
}
