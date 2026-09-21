import { ApiError } from "../http";
import { env } from "../env";
import type { Paginated } from "../../types/contract/pagination";

export interface MockDelayOptions {
  failure?: boolean;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatencyMs(): number {
  const { mockLatencyMinMs, mockLatencyMaxMs } = env;
  if (mockLatencyMaxMs <= 0) return 0;
  const span = mockLatencyMaxMs - mockLatencyMinMs;
  return mockLatencyMinMs + Math.floor(Math.random() * (span + 1));
}

function shouldFail(): boolean {
  if (env.mockFailureRate <= 0) return false;
  return Math.random() < env.mockFailureRate;
}

export async function mockDelay<T>(
  value: T,
  options: MockDelayOptions = {},
): Promise<T> {
  const simulateFailure = options.failure !== false;
  const latency = randomLatencyMs();
  if (latency > 0) await delay(latency);
  if (simulateFailure && shouldFail()) {
    throw new ApiError("Simulated server failure", "INTERNAL", 500);
  }
  return value;
}

/**
 * Races a pending mock promise against an AbortSignal so an aborted request
 * settles immediately (parity with real `fetch` semantics). Any occurrence of
 * `mockDelay` latency or injected failure is discarded on abort.
 */
export function abortable<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal || signal.aborted) {
    if (signal?.aborted) {
      return Promise.reject(new ApiError("Request aborted", "INTERNAL", 0));
    }
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () =>
      reject(new ApiError("Request aborted", "INTERNAL", 0));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export function paginate<T>(
  items: T[],
  limit = items.length,
  offset = 0,
): Paginated<T> {
  const safeLimit = Math.max(0, Math.floor(limit));
  const safeOffset = Math.max(0, Math.floor(offset));
  return {
    items: items.slice(safeOffset, safeOffset + safeLimit),
    total: items.length,
    limit: safeLimit,
    offset: safeOffset,
  };
}
