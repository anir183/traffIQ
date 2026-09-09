export type DataSource = "mock" | "backend";

export interface ApiConfig {
  dataSource: DataSource;
  baseUrl: string;
  authEnabled: boolean;
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

export const env: ApiConfig = {
  dataSource: parseDataSource(import.meta.env.VITE_DATA_SOURCE),
  baseUrl: (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  authEnabled: parseBoolean(import.meta.env.VITE_AUTH_ENABLED, false),
};
