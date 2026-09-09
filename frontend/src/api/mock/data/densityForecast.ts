import type { DensityForecastResponse } from "../../../types/contract/trafficSummary";

export const DENSITY_FORECAST: DensityForecastResponse = {
  from: "2026-09-07T00:00:00.000Z",
  to: "2026-09-12T23:59:59.000Z",
  points: [
    { day: "Mon", density: 65 },
    { day: "Tue", density: 58 },
    { day: "Wed", density: 55 },
    { day: "Thu", density: 62 },
    { day: "Fri", density: 70 },
    { day: "Sat", density: 68 },
    { day: "Sun", density: 60 },
    { day: "Future", density: 45 },
    { day: "Future+2", density: 35 },
    { day: "Future+3", density: 25 },
  ],
};
