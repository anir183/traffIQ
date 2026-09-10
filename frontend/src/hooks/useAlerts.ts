import { getAlerts } from "../api/endpoints/alerts";
import type { AlertFilter } from "../api/endpoints/alerts";
import type { Alert } from "../types/contract/alert";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

const ALERTS_POLL_MS = 30_000;

export function useAlerts(
  filter: AlertFilter = {},
  options: AsyncOptions = { pollMs: ALERTS_POLL_MS },
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
