import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { useTrafficDensityForecast } from "../../hooks/useTrafficDensityForecast";
import { forecastToDensityPoints } from "../../types/ui/adapters";

const axisTick = { fontSize: 10, fill: "var(--chart-axis)" } as const;
const tooltipStyle = {
  background: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: "0.5rem",
  color: "var(--chart-axis)",
  fontSize: "12px",
} as const;

function DensityForecastChart() {
  const { data } = useTrafficDensityForecast();
  const points = data ? forecastToDensityPoints(data.points) : [];

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[40%] dark:border-slate-700 dark:bg-slate-900">
      <span className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
        Traffic Density Forecast
      </span>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--chart-grid)"
            />
            <XAxis dataKey="day" tick={axisTick} />
            <YAxis tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceArea
              x1="Sun"
              x2="Future+3"
              fill="#3b82f6"
              fillOpacity={0.06}
            />
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
    </div>
  );
}

export default DensityForecastChart;
