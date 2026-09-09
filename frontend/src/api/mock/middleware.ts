import type { Paginated } from "../../types/contract/pagination";

export const MOCK_DELAY_MS = 0;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockDelay<T>(value: T): Promise<T> {
  if (MOCK_DELAY_MS > 0) await delay(MOCK_DELAY_MS);
  return value;
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
