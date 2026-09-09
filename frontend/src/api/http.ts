import type { ApiEnvelope, ApiFailure } from "../types/contract/apiEnvelope";
import type { ErrorCode } from "../types/contract/errorCodes";
import type { Paginated } from "../types/contract/pagination";
import { clearTokens, getRefreshToken, setTokens } from "../auth/tokens";
import { env } from "./env";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 250;

let tokenProvider: (() => string | null) | null = null;

export function setAuthTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function statusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "INVALID_PARAMS";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL";
  }
}

function buildError(res: Response, payload: unknown): ApiError {
  const failure = payload as Partial<ApiFailure> | undefined;
  const message =
    failure?.error?.message ?? `Request failed with status ${res.status}`;
  const code = failure?.error?.code ?? statusToCode(res.status);
  return new ApiError(message, code, res.status);
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    message: string,
    code: ErrorCode,
    status: number,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function parseEnvelope<T>(payload: unknown): T {
  const envelope = payload as ApiEnvelope<T> | undefined;
  if (!envelope || typeof envelope.success !== "boolean") {
    throw new ApiError("Unexpected response shape", "INTERNAL", 0);
  }
  if (!envelope.success) {
    const failure = envelope as ApiFailure;
    throw new ApiError(
      failure.error?.message ?? "Request failed",
      failure.error?.code ?? "INTERNAL",
      0,
      envelope.meta.request_id,
    );
  }
  return envelope.data;
}

export function toPaginatedResult<T>(page: Paginated<T>): PaginatedResult<T> {
  return {
    items: page.items,
    total: page.total,
    limit: page.limit,
    offset: page.offset,
  };
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${env.baseUrl}${path}`;
  const headers: Record<string, string> = { ...options.headers };
  headers["Content-Type"] = "application/json";

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (attempt > 0) await delay(RETRY_DELAY_MS * attempt);

    const token = options.token ?? tokenProvider?.() ?? null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        signal: options.signal,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (err) {
      lastError = new ApiError(
        err instanceof Error ? err.message : "Network error",
        "INTERNAL",
        0,
      );
      break;
    }

    const payload: unknown = res.status === 204 ? null : await safeJson(res);
    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return parseEnvelope<T>(payload);
    }

    lastError = buildError(res, payload);
    if (
      res.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/refresh"
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) continue;
    }
    if (!RETRYABLE_STATUS.has(res.status)) break;
  }

  throw lastError ?? new ApiError("Request failed", "INTERNAL", 0);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${env.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const payload: unknown = await safeJson(response);
    if (!response.ok) return null;
    const data = parseEnvelope<{
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    }>(payload);
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export function requestPaginated<T>(
  path: string,
  query: Record<string, unknown> = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<T>> {
  return request<Paginated<T>>(
    `${path}${buildQueryString(query)}`,
    options,
  ).then((page) => toPaginatedResult<T>(page));
}

export function buildQueryString(
  query: Record<string, unknown> | URLSearchParams,
): string {
  const params = new URLSearchParams();
  const entries =
    query instanceof URLSearchParams ? query.entries() : Object.entries(query);
  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
