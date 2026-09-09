import { getVehicles } from "../api/endpoints/vehicles";
import type { VehicleFilter } from "../api/endpoints/vehicles";
import type { GlobalVehicle } from "../types/contract/vehicle";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

export function useVehicles(
  filter: VehicleFilter = {},
  options: AsyncOptions = {},
) {
  return usePaginatedResource<GlobalVehicle>(
    (signal) => getVehicles(filter, { signal }),
    [filter.plate_text, filter.limit, filter.offset],
    options,
  );
}
