import type { LucideIcon } from "lucide-react";
import { Activity, Car, Clock, Gauge } from "lucide-react";
import {
  getFastestPeriod,
  getPeakVolume,
  getSlowestPeriod,
  VEHICLE_TYPE_MIX,
} from "./analysisData";

interface Insight {
  label: string;
  value: string;
  sub: string;
  Icon: LucideIcon;
  tint: string;
}

function buildInsights(): Insight[] {
  const peak = getPeakVolume();
  const slowest = getSlowestPeriod();
  const fastest = getFastestPeriod();
  const dominantType = VEHICLE_TYPE_MIX.reduce((top, mix) =>
    mix.percent > top.percent ? mix : top,
  );

  return [
    {
      label: "Peak Hour",
      value: peak.time,
      sub: `${peak.volume.toLocaleString()} vehicles`,
      Icon: Clock,
      tint: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      label: "Slowest Period",
      value: slowest.time,
      sub: `${slowest.speed} km/h avg`,
      Icon: Gauge,
      tint: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    },
    {
      label: "Fastest Period",
      value: fastest.time,
      sub: `${fastest.speed} km/h avg`,
      Icon: Activity,
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Week-over-Week",
      value: "+14%",
      sub: `vehicle count · ${dominantType.label} heavy mix`,
      Icon: Car,
      tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
  ];
}

export default function Insights() {
  const insights = buildInsights();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Insights
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map(({ label, value, sub, Icon, tint }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {label}
              </p>
              <p className="mt-0.5 text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {value}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
