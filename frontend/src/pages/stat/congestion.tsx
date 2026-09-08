interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  /** If true, an "up" trend is treated as bad (colored red) instead of good. */
  invertTrendColor?: boolean;
  /** Optional override for the value text color, e.g. "text-orange-500". */
  valueColor?: string;
}

export default function StatCard({
  label = "Congestion Score",
  value = "68/100",
  change = "6%",
  trend = "up",
  invertTrendColor = false,
  valueColor = "text-gray-900",
}: Partial<StatCardProps>) {
  const isUp = trend === "up";
  const isGoodTrend = invertTrendColor ? !isUp : isUp;

  return (
    <div className="w-[18%] h-[150px] flex flex-col gap-2  rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[27px] ml-4! mt-1! text-gray-500">{label}</p>
      <p className="mt-1 text-[22px] ml-4! font-semibold text-gray-900">{value}</p>
      <p
        className={`mt-1 flex items-center ml-4! gap-1 text-[20px] font-medium ${
          isUp ? "text-green-600" : "text-red-600"
        }`}
      >
        <span>{isUp ? "↑" : "↓"}</span>
        {change}
      </p>
    </div>
  );
}