import { getAlerts } from "../api/endpoints/alerts";
import type { AlertFilter } from "../api/endpoints/alerts";
import type { Alert } from "../types/contract/alert";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

export function useAlerts(
  filter: AlertFilter = {},
  options: AsyncOptions = {},
) {
  return usePaginatedResource<Alert>(
    (signal) => getAlerts(filter, { signal }),
    [
      filter.status,
      filter.type,
      filter.severity,
      filter.from,
      filter.to,
      filter.limit,
      filter.offset,
    ],
    options,
  );
}
