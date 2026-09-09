import { useTrafficSummary } from "../../hooks/useTrafficSummary";
import { typeBreakdownToPercentages } from "../../types/ui/adapters";

const SEGMENT_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#22c55e"];

export default function VehicleTypeGraph() {
  const { data } = useTrafficSummary();
  const segments = typeBreakdownToPercentages(
    data?.metrics.vehicle_type_breakdown ?? [],
  );
  const total = data?.metrics.total_vehicles ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Vehicle Type
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Today
        </span>
      </div>

      {segments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No vehicle type data available.
        </p>
      ) : (
        <>
          <div className="mb-4 flex h-3.5 w-full overflow-hidden rounded-full">
            {segments.map((segment, i) => (
              <div
                key={segment.label}
                title={`${segment.label}: ${segment.percent}%`}
                className="h-full"
                style={{
                  width: `${segment.percent}%`,
                  backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                }}
              />
            ))}
          </div>

          <div className="space-y-2">
            {segments.map((segment, i) => (
              <div
                key={segment.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    }}
                  />
                  {segment.label}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {segment.percent}%
                </span>
              </div>
            ))}

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                Total Vehicles
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {total > 0 ? total.toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
