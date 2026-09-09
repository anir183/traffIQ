import { getCameras } from "../api/endpoints/cameras";
import type { CameraFilter } from "../api/endpoints/cameras";
import type { CameraMeta } from "../types/contract/camera";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

export function useCameras(
  filter: CameraFilter = {},
  options: AsyncOptions = {},
) {
  return usePaginatedResource<CameraMeta>(
    (signal) => getCameras(filter, { signal }),
    [filter.circuit, filter.status, filter.limit, filter.offset],
    options,
  );
}
