import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useElementSize } from "../../hooks/useElementSize";
import type { ElementSize } from "../../hooks/useElementSize";
import { useAlerts } from "../../hooks/useAlerts";
import { useCameras } from "../../hooks/useCameras";
import { useTrafficDensityForecast } from "../../hooks/useTrafficDensityForecast";
import { useTrafficSegments } from "../../hooks/useTrafficSegments";
import { useTrafficSummary } from "../../hooks/useTrafficSummary";
import { useTheme } from "../../theme/useTheme";
import {
  forecastToDensityPoints,
  segmentCongestionData,
  segmentSpeedData,
} from "../../types/ui/adapters";

const CONGESTION_COLORS = [
  "#0f172a",
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
];
const CONGESTION_COLORS_DARK = [
  "#f8fafc",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
];
const SPEED_COLOR = "#3b82f6";

const axisTick = { fontSize: 10, fill: "var(--chart-axis)" } as const;
const tooltipStyle = {
  background: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: "0.5rem",
  color: "var(--chart-axis)",
  fontSize: "12px",
} as const;
const cursorFill = { fill: "rgba(148,163,184,0.08)" } as const;

interface CardProps {
  title: string;
  dark?: boolean;
  tight?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

function Card({ title, dark, tight, badge, children }: CardProps) {
  return (
    <div
      className={
        dark
          ? `flex h-full min-h-0 flex-col rounded-xl border border-slate-700 bg-slate-900 text-white shadow-sm ${tight ? "px-5 pb-3 pt-5" : "p-5"}`
          : `flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${tight ? "px-5 pb-3 pt-5" : "p-5"}`
      }
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h3
          className={
            dark
              ? "text-sm font-semibold text-white"
              : "text-sm font-semibold text-slate-900 dark:text-slate-100"
          }
        >
          {title}
        </h3>
        {badge}
      </div>
      <div className={`min-h-0 flex-1 ${tight ? "mt-2" : "mt-3"}`}>
        {children}
      </div>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
      {label}
    </div>
  );
}

function useCongestionFontSize(value: number, size: ElementSize): number {
  const digits = Math.max(1, String(value).length);
  const widthFit = size.width > 0 ? (size.width / digits) * 0.62 : 56;
  const heightCap = size.height > 0 ? size.height * 0.42 : 96;
  return Math.round(Math.max(40, Math.min(widthFit, heightCap, 120)));
}

function NetworkOverviewCard() {
  const { data } = useTrafficSummary();
  const metrics = data?.metrics;
  const { items: alerts } = useAlerts();
  const { items: cameras } = useCameras();
  const { ref: heroRef, size: heroSize } = useElementSize<HTMLDivElement>();
  const activeIncidents = alerts.filter((a) => a.status === "active").length;
  const camerasOnline = cameras.filter((c) => c.status === "online").length;
  const congestionFontSize = useCongestionFontSize(
    metrics?.congestion_score ?? 0,
    heroSize,
  );

  if (!metrics) {
    return (
      <Card dark tight title="Network Overview">
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          No network data available.
        </div>
      </Card>
    );
  }

  const congestionLevel =
    metrics.congestion_score >= 70
      ? "High"
      : metrics.congestion_score >= 40
        ? "Moderate"
        : "Low";
  const congestionTone =
    congestionLevel === "High"
      ? "bg-red-400"
      : congestionLevel === "Moderate"
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <Card dark tight title="Network Overview">
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        <div
          ref={heroRef}
          className="flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden py-2"
        >
          <span
            className="font-bold leading-none"
            style={{ fontSize: `${congestionFontSize}px` }}
          >
            {metrics.congestion_score}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${congestionTone}`} />
            <span className="text-xs font-medium text-slate-300">
              {congestionLevel}
            </span>
          </span>
          <span className="text-xs text-slate-500">Congestion index</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-400">Active incidents</span>
            <span className="ml-auto text-sm font-semibold text-white">
              {activeIncidents}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400">Cameras online</span>
            <span className="ml-auto text-sm font-semibold text-white">
              {camerasOnline}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CongestedSegmentsCard() {
  const { data } = useTrafficSegments();
  const { resolvedTheme } = useTheme();
  const segments = data ? segmentCongestionData(data.congested) : [];
  const colors =
    resolvedTheme === "dark" ? CONGESTION_COLORS_DARK : CONGESTION_COLORS;

  return (
    <Card title="Top Congested Segments">
      {segments.length === 0 ? (
        <ChartEmpty label="No congestion data available." />
      ) : (
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={segments}
              layout="vertical"
              margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                type="number"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisTick}
                width={86}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={cursorFill}
                formatter={(value) => `${value} congestion`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {segments.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function AverageSpeedCard() {
  const { data } = useTrafficSegments();
  const segments = data ? segmentSpeedData(data.speed) : [];

  return (
    <Card title="Average Speed by Segment">
      {segments.length === 0 ? (
        <ChartEmpty label="No speed data available." />
      ) : (
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={segments}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                tick={axisTick}
                width={36}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={cursorFill}
                formatter={(value) => `${value} km/h`}
              />
              <Bar
                dataKey="value"
                fill={SPEED_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function DensityForecastCard() {
  const { data } = useTrafficDensityForecast();
  const points = data ? forecastToDensityPoints(data.points) : [];

  return (
    <Card title="Traffic Density (Last 3 Hours)">
      {points.length === 0 ? (
        <ChartEmpty label="No density data available." />
      ) : (
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="time"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                tick={axisTick}
                width={36}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="density"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export default function OverviewRow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <NetworkOverviewCard />
      <CongestedSegmentsCard />
      <AverageSpeedCard />
      <DensityForecastCard />
    </div>
  );
}
