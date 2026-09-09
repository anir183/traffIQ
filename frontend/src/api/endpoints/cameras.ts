import type { CameraMeta } from "../../types/contract/camera";
import { env } from "../env";
import { request, requestPaginated, toPaginatedResult } from "../http";
import type { PaginatedResult, RequestOptions } from "../http";
import type { CameraQuery } from "../mock/handlers";
import * as mock from "../mock/handlers";

export interface CameraFilter {
  circuit?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getCameras(
  filter: CameraFilter = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<CameraMeta>> {
  if (env.dataSource === "mock") {
    const query: CameraQuery = {
      circuit: filter.circuit,
      status: filter.status,
      limit: filter.limit,
      offset: filter.offset,
    };
    return toPaginatedResult(await mock.getCameras(query));
  }
  return requestPaginated<CameraMeta>("/cameras", { ...filter }, options);
}

export async function getCameraById(
  cameraId: string,
  options: RequestOptions = {},
): Promise<CameraMeta> {
  if (env.dataSource === "mock") {
    return mock.getCameraById(cameraId);
  }
  return request<CameraMeta>(
    `/cameras/${encodeURIComponent(cameraId)}`,
    options,
  );
}
