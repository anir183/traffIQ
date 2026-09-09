import type {
  DensityForecastResponse,
  SegmentResponse,
  TrafficSummaryResponse,
} from "../../types/contract/trafficSummary";
import { env } from "../env";
import { request } from "../http";
import type { RequestOptions } from "../http";
import * as mock from "../mock/handlers";

export async function getTrafficSummary(
  options: RequestOptions = {},
): Promise<TrafficSummaryResponse> {
  if (env.dataSource === "mock") {
    return mock.getTrafficSummary();
  }
  return request<TrafficSummaryResponse>("/traffic/summary", options);
}

export async function getTrafficSegments(
  options: RequestOptions = {},
): Promise<SegmentResponse> {
  if (env.dataSource === "mock") {
    return mock.getSegments();
  }
  return request<SegmentResponse>("/traffic/segments", options);
}

export async function getTrafficDensityForecast(
  options: RequestOptions = {},
): Promise<DensityForecastResponse> {
  if (env.dataSource === "mock") {
    return mock.getDensityForecast();
  }
  return request<DensityForecastResponse>("/traffic/density-forecast", options);
}
