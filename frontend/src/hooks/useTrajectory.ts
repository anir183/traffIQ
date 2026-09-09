import { getVehicleTrajectory } from "../api/endpoints/vehicles";
import type { TrajectoryResponse } from "../types/contract/trajectory";
import { useAsyncResource } from "./useAsyncResource";

export function useTrajectory(plateText: string) {
  return useAsyncResource<TrajectoryResponse>(
    (signal) => getVehicleTrajectory(plateText, { signal }),
    [],
    { enabled: Boolean(plateText) },
  );
}
