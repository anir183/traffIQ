import { getVehicleByPlate } from "../api/endpoints/vehicles";
import type { VehicleDetailResponse } from "../types/contract/vehicle";
import { useAsyncResource } from "./useAsyncResource";

export function useVehicleDetail(plateText: string) {
  return useAsyncResource<VehicleDetailResponse>(
    (signal) => getVehicleByPlate(plateText, { signal }),
    [plateText],
    { enabled: Boolean(plateText.trim()) },
  );
}
