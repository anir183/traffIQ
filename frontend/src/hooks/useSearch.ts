import { search } from "../api/endpoints/search";
import type { SearchResult } from "../types/contract/search";
import { usePaginatedResource } from "./usePaginatedResource";

export function useSearch(q: string, limit = 8) {
  return usePaginatedResource<SearchResult>(
    (signal) => search({ q, limit }, { signal }),
    [q, limit],
    { enabled: q.trim().length >= 2 },
  );
}
