import type { DensityForecastResponse } from "../../../types/contract/trafficSummary";

export const DENSITY_FORECAST: DensityForecastResponse = {
  from: "2026-09-09T11:00:00.000Z",
  to: "2026-09-09T14:00:00.000Z",
  points: [
    { time: "-5h", density: 58 },
    { time: "-4h", density: 55 },
    { time: "-3h", density: 62 },
    { time: "-2h", density: 70 },
    { time: "-1h", density: 68 },
    { time: "now", density: 60 },
    { time: "+1h", density: 45 },
    { time: "+2h", density: 35 },
  ],
};
