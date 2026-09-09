import { useTrafficSummary } from "../../hooks/useTrafficSummary";
import { overviewInsights } from "../../types/ui/adapters";

interface InsightCard {
  title: string;
  value: string;
  detail: string;
  icon: string;
}

function to12h(time: string): string {
  const [hour] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

function buildInsightCards(
  insights: ReturnType<typeof overviewInsights>,
): InsightCard[] {
  return [
    {
      title: "Peak Traffic Time",
      value: `${to12h(insights.peakTime)}`,
      detail: `Heaviest traffic in the last 24 hours (${insights.peakVolume.toLocaleString()} vehicles)`,
      icon: "🚦",
    },
    {
      title: "Slowest Road Segment",
      value: to12h(insights.slowestTime),
      detail: `${insights.slowestSpeed} km/h average speed`,
      icon: "🐢",
    },
    {
      title: "Fastest Road Segment",
      value: to12h(insights.fastestTime),
      detail: `${insights.fastestSpeed} km/h average speed`,
      icon: "🚀",
    },
    {
      title: "Vehicle Type Charge",
      value: insights.dominantLabel,
      detail: `Largest share of vehicles on the road (week over week ${insights.weekOverWeek})`,
      icon: "🚗",
    },
  ];
}

function Insights() {
  const { data } = useTrafficSummary();
  const insights = data
    ? buildInsightCards(
        overviewInsights(
          data.time_series,
          data.metrics.vehicle_type_breakdown,
          data.metrics.total_vehicles_change_pct,
        ),
      )
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          LIVE Insights
        </h3>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            LIVE
          </span>
        </span>
      </div>

      {insights.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No insights available.
        </p>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid gap-4">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {insights.map((i) => (
                  <div
                    key={i.title}
                    className="flex flex-col rounded-lg border border-slate-100 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <span className="text-xl">{i.icon}</span>
                    <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {i.title}
                    </span>
                    <span className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {i.value}
                    </span>
                    <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {i.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Insights;
