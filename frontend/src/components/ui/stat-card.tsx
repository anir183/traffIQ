interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  invertTrendColor?: boolean;
}

export default function StatCard({
  label,
  value,
  change,
  trend = "up",
  invertTrendColor = false,
}: StatCardProps) {
  const isUp = trend === "up";
  const isGood = invertTrendColor ? !isUp : isUp;

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p
        className={`flex items-center gap-1 text-sm font-medium ${
          isGood ? "text-green-600" : "text-red-600"
        }`}
      >
        <span>{isUp ? "↑" : "↓"}</span>
        {change}
      </p>
    </div>
  );
}
