import type { PaginatedResult } from "../api/http";
import { useAsyncResource } from "./useAsyncResource";
import type { AsyncOptions } from "./useAsyncResource";

export interface PaginatedState<T> {
  items: T[];
  total: number;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function usePaginatedResource<T>(
  fetcher: (signal: AbortSignal) => Promise<PaginatedResult<T>>,
  deps: unknown[],
  options: AsyncOptions = {},
): PaginatedState<T> {
  const state = useAsyncResource<PaginatedResult<T>>(fetcher, deps, options);
  return {
    items: state.data?.items ?? [],
    total: state.data?.total ?? 0,
    loading: state.loading,
    error: state.error,
    refetch: state.refetch,
  };
}
