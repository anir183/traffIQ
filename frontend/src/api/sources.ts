import { env } from "./env";

export const dataSource = env.dataSource;
export const isMock = env.dataSource === "mock";
export const authEnabled = env.authEnabled;

export type MapRenderMode = "tomtom" | "custom";

export const mapRenderMode: MapRenderMode = isMock ? "tomtom" : "custom";
