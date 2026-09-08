interface VehicleTypeSegment {
  label: string;
  percent: number;
  color: string;
}

// Hardcoded breakdown data
const SEGMENTS: VehicleTypeSegment[] = [
  { label: "Car", percent: 58, color: "#3b82f6" },
  { label: "Bike", percent: 26, color: "#2dd4bf" },
  { label: "Bus", percent: 8, color: "#f59e0b" },
  { label: "Truck", percent: 6, color: "#ef4444" },
  { label: "Others", percent: 2, color: "#d1d5db" },
];

const TOTAL_VEHICLES = "125,430";

const RADIUS = 60;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function VehicleTypeBreakdown() {
  let cumulativePercent = 0;

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Vehicle Type Breakdown
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
          <svg
            viewBox="0 0 160 160"
            className="-rotate-90"
            width={160}
            height={160}
          >
            {SEGMENTS.map((segment) => {
              const dash = (segment.percent / 100) * CIRCUMFERENCE;
              const gap = CIRCUMFERENCE - dash;
              const offset = -(cumulativePercent / 100) * CIRCUMFERENCE;
              cumulativePercent += segment.percent;

              return (
                <circle
                  key={segment.label}
                  cx={80}
                  cy={80}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-gray-900">
              {TOTAL_VEHICLES}
            </span>
            <span className="text-xs text-gray-400">Total Vehicles</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {SEGMENTS.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-between gap-6 text-sm"
            >
              <span className="flex items-center gap-2 text-gray-600">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="text-gray-900 font-medium">
                {segment.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}