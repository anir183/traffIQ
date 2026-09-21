import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTrafficSummary } from "../../hooks/useTrafficSummary";
import { timeSeriesToVolumeSpeed } from "../../types/ui/adapters";

const VOLUME_TICKS = [0, 5000, 10000, 15000];
const SPEED_TICKS = [0, 20, 40, 60];

const axisTick = { fontSize: 10, fill: "var(--chart-axis)" } as const;
const tooltipStyle = {
  background: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: "0.5rem",
  color: "var(--chart-axis)",
  fontSize: "12px",
} as const;

function formatVolumeLabel(value: number): string {
  return value === 0 ? "0" : `${value / 1000}K`;
}

function formatVolumeTooltip(value: number): string {
  return `${value.toLocaleString()} vehicle${value === 1 ? "" : "s"}`;
}

export default function VolumeSpeedChart() {
  const { data } = useTrafficSummary();
  const points = timeSeriesToVolumeSpeed(data?.time_series ?? []);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Traffic Volume &amp; Average Speed
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Volume
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-0.5 w-4 rounded-full bg-emerald-500" />
            Avg speed
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-sm text-slate-400 dark:text-slate-500">
          No traffic data available.
        </p>
      ) : (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--chart-grid)"
              />
              <XAxis dataKey="time" tick={axisTick} interval={1} />
              <YAxis
                yAxisId="volume"
                orientation="left"
                tick={axisTick}
                domain={[0, 15000]}
                ticks={VOLUME_TICKS}
                tickFormatter={formatVolumeLabel}
                width={44}
              />
              <YAxis
                yAxisId="speed"
                orientation="right"
                tick={axisTick}
                domain={[0, 60]}
                ticks={SPEED_TICKS}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "speed"
                    ? `${value} km/h`
                    : formatVolumeTooltip(Number(value))
                }
              />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="speed"
                type="monotone"
                dataKey="speed"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
