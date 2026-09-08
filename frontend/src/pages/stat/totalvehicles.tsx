interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
}

export default function StatCard({
  label = "Total Vehicles",
  value = "125,430",
  change = "14%",
  trend = "up",
}: Partial<StatCardProps>) {
  const isUp = trend === "up";

  return (
    <div className="w-[18%] h-[150px] flex flex-col gap-2  rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[29px] ml-4! text-gray-500">{label}</p>
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