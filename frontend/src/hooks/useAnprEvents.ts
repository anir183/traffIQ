import { getAnprEvents } from "../api/endpoints/anpr";
import type { AnprEventFilter } from "../api/endpoints/anpr";
import type { AnprEvent } from "../types/contract/anprEvent";
import { usePaginatedResource } from "./usePaginatedResource";
import type { AsyncOptions } from "./useAsyncResource";

export function useAnprEvents(
  filter: AnprEventFilter = {},
  options: AsyncOptions = {},
) {
  return usePaginatedResource<AnprEvent>(
    (signal) => getAnprEvents(filter, { signal }),
    [
      filter.camera_id,
      filter.plate_text,
      filter.from,
      filter.to,
      filter.limit,
      filter.offset,
    ],
    options,
  );
}
