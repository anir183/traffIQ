import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncOptions {
  pollMs?: number;
  enabled?: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useAsyncResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: AsyncOptions = {},
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  const fetcherRef = useRef(fetcher);
  const pollMsRef = useRef(options.pollMs);
  const enabledRef = useRef(options.enabled);

  useEffect(() => {
    fetcherRef.current = fetcher;
    pollMsRef.current = options.pollMs;
    enabledRef.current = options.enabled;
  });

  const refetch = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let latestRun = 0;
    const painting = enabledRef.current ?? true;

    if (!painting) {
      queueMicrotask(() => {
        if (cancelled) return;
        setData(null);
        setError(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const run = async () => {
      const runId = ++latestRun;
      queueMicrotask(() => {
        if (!cancelled) setLoading(true);
      });
      try {
        const result = await fetcherRef.current(controller.signal);
        if (cancelled || runId !== latestRun) return;
        setData(result);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled || runId !== latestRun) return;
        setError(err);
        setLoading(false);
      }
    };

    run();

    const pollMs = pollMsRef.current ?? 0;
    let timer: number | undefined;
    if (pollMs > 0) {
      timer = window.setInterval(run, pollMs);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) clearInterval(timer);
    };
    // The dynamic dependency list is intentional: the fetcher is kept fresh
    // through a ref, so the effect only restarts when callers request it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { data, loading, error, refetch };
}
