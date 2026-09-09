import type { TrajectoryResponse } from "../../types/contract/trajectory";
import type { GlobalVehicle } from "../../types/contract/vehicle";
import type { VehicleDetailResponse } from "../../types/contract/vehicle";
import { env } from "../env";
import { request, requestPaginated, toPaginatedResult } from "../http";
import type { PaginatedResult, RequestOptions } from "../http";
import type { VehicleQuery } from "../mock/handlers";
import * as mock from "../mock/handlers";

export interface VehicleFilter {
  plate_text?: string;
  limit?: number;
  offset?: number;
}

export async function getVehicles(
  filter: VehicleFilter = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<GlobalVehicle>> {
  if (env.dataSource === "mock") {
    const query: VehicleQuery = {
      plate_text: filter.plate_text,
      limit: filter.limit,
      offset: filter.offset,
    };
    return toPaginatedResult(await mock.getVehicles(query));
  }
  return requestPaginated<GlobalVehicle>("/vehicles", { ...filter }, options);
}

export async function getVehicleByPlate(
  plateText: string,
  options: RequestOptions = {},
): Promise<VehicleDetailResponse> {
  if (env.dataSource === "mock") {
    return mock.getVehicleByPlate(plateText);
  }
  return request<VehicleDetailResponse>(
    `/vehicles/${encodeURIComponent(plateText)}`,
    options,
  );
}

export async function getVehicleTrajectory(
  plateText: string,
  options: RequestOptions = {},
): Promise<TrajectoryResponse> {
  if (env.dataSource === "mock") {
    return mock.getTrajectory(plateText);
  }
  return request<TrajectoryResponse>(
    `/vehicles/${encodeURIComponent(plateText)}/trajectory`,
    options,
  );
}
