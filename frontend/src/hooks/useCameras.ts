import { useEffect } from "react";
import { getCameras } from "../api/endpoints/cameras";
import type { CameraFilter } from "../api/endpoints/cameras";
import type { CameraMeta } from "../types/contract/camera";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

export function useCameras(
  filter: CameraFilter = {},
  options: AsyncOptions = {},
) {
  const resource = usePaginatedResource<CameraMeta>(
    (signal) => getCameras(filter, { signal }),
    [filter.circuit, filter.status, filter.limit, filter.offset],
    options,
  );
  const { refetch } = resource;

  useEffect(() => {
    const onConnectivityChange = () => refetch();
    window.addEventListener("online", onConnectivityChange);
    window.addEventListener("offline", onConnectivityChange);
    return () => {
      window.removeEventListener("online", onConnectivityChange);
      window.removeEventListener("offline", onConnectivityChange);
    };
  }, [refetch]);

  return resource;
}
