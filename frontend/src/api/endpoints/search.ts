import type { SearchResult } from "../../types/contract/search";
import { env } from "../env";
import { requestPaginated, toPaginatedResult } from "../http";
import type { PaginatedResult, RequestOptions } from "../http";
import type { SearchQuery } from "../mock/handlers";
import * as mock from "../mock/handlers";
import { abortable } from "../mock/middleware";

export interface SearchFilter {
  q: string;
  types?: string;
  limit?: number;
}

export async function search(
  filter: SearchFilter,
  options: RequestOptions = {},
): Promise<PaginatedResult<SearchResult>> {
  if (env.dataSource === "mock") {
    const query: SearchQuery = {
      q: filter.q,
      types: filter.types,
      limit: filter.limit,
    };
    return toPaginatedResult(
      await abortable(mock.search(query), options.signal),
    );
  }
  return requestPaginated<SearchResult>(
    "/search",
    {
      q: filter.q,
      types: filter.types,
      limit: filter.limit ?? 8,
    },
    options,
  );
}
