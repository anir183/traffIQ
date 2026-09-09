export type DataSource = "mock" | "backend";

export interface ApiConfig {
  dataSource: DataSource;
  baseUrl: string;
  authEnabled: boolean;
  mockLatencyMinMs: number;
  mockLatencyMaxMs: number;
  mockFailureRate: number;
}

function parseDataSource(raw: string | undefined): DataSource {
  if (raw === "backend") return "backend";
  if (raw !== undefined && raw !== "mock" && raw !== "") {
    console.warn(`Unknown VITE_DATA_SOURCE "${raw}", falling back to "mock"`);
  }
  return "mock";
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  console.warn(
    `Unrecognized boolean value "${raw}" for VITE_AUTH_ENABLED, using ${fallback}`,
  );
  return fallback;
}

function parseLatencyMs(
  raw: string | undefined,
  fallback: number,
  label: string,
): number {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    console.warn(`Unrecognized ${label} "${raw}", using ${fallback}`);
    return fallback;
  }
  return Math.min(10_000, Math.max(0, Math.floor(value)));
}

function parseFailureRate(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    console.warn(
      `Unrecognized VITE_MOCK_FAILURE_RATE "${raw}", using ${fallback}`,
    );
    return fallback;
  }
  return Math.min(100, Math.max(0, value)) / 100;
}

const mockLatencyMinMs = parseLatencyMs(
  import.meta.env.VITE_MOCK_LATENCY_MIN_MS,
  300,
  "VITE_MOCK_LATENCY_MIN_MS",
);
const mockLatencyMaxMs = parseLatencyMs(
  import.meta.env.VITE_MOCK_LATENCY_MAX_MS,
  700,
  "VITE_MOCK_LATENCY_MAX_MS",
);

export const env: ApiConfig = {
  dataSource: parseDataSource(import.meta.env.VITE_DATA_SOURCE),
  baseUrl: (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  authEnabled: parseBoolean(import.meta.env.VITE_AUTH_ENABLED, false),
  mockLatencyMinMs: Math.min(mockLatencyMinMs, mockLatencyMaxMs),
  mockLatencyMaxMs: Math.max(mockLatencyMinMs, mockLatencyMaxMs),
  mockFailureRate: parseFailureRate(
    import.meta.env.VITE_MOCK_FAILURE_RATE,
    0.05,
  ),
};
