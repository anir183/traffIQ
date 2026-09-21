import type { AnprEvent } from "../../types/contract/anprEvent";
import { env } from "../env";
import { requestPaginated, toPaginatedResult } from "../http";
import type { PaginatedResult, RequestOptions } from "../http";
import type { AnprQuery } from "../mock/handlers";
import * as mock from "../mock/handlers";
import { abortable } from "../mock/middleware";

export interface AnprEventFilter {
  camera_id?: string;
  plate_text?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export async function getAnprEvents(
  filter: AnprEventFilter = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<AnprEvent>> {
  if (env.dataSource === "mock") {
    const query: AnprQuery = {
      camera_id: filter.camera_id,
      plate_text: filter.plate_text,
      from: filter.from,
      to: filter.to,
      limit: filter.limit,
      offset: filter.offset,
    };
    return toPaginatedResult(
      await abortable(mock.getAnprEvents(query), options.signal),
    );
  }
  return requestPaginated<AnprEvent>(
    "/anpr/events",
    {
      camera_id: filter.camera_id,
      plate_text: filter.plate_text,
      from: filter.from,
      to: filter.to,
      limit: filter.limit,
      offset: filter.offset,
      sort: "desc",
    },
    { ...options, signal: filter.signal },
  );
}
