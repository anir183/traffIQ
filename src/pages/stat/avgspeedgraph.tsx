interface SpeedPoint {
  time: string;
  value: number;
}

// Hardcoded average speed data (km/h)
const DATA: SpeedPoint[] = [
  { time: "00:00", value: 34 },
  { time: "02:00", value: 40 },
  { time: "04:00", value: 41 },
  { time: "06:00", value: 33 },
  { time: "08:00", value: 30 },
  { time: "10:00", value: 38 },
  { time: "12:00", value: 27 },
  { time: "14:00", value: 22 },
  { time: "16:00", value: 18 },
  { time: "18:00", value: 24 },
  { time: "20:00", value: 26 },
  { time: "22:00", value: 30 },
];

const Y_MAX = 60;
const Y_TICKS = [0, 20, 40, 60];
const X_LABEL_INTERVAL = 2;

const CHART_WIDTH = 320;
const CHART_HEIGHT = 140;
const PADDING_X = 8;

function getPoints() {
  const stepX = (CHART_WIDTH - PADDING_X * 2) / (DATA.length - 1);
  return DATA.map((point, i) => {
    const x = PADDING_X + i * stepX;
    const y = CHART_HEIGHT - (point.value / Y_MAX) * CHART_HEIGHT;
    return { x, y, ...point };
  });
}

export default function AverageSpeedChart() {
  const points = getPoints();
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-2 h-[65%]! shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">
          Average Speed
        </h3>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          km/h
          <span className="text-gray-400">▾</span>
        </button>
      </div>

      <div className="flex">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between text-xs text-gray-400 pr-2"
          style={{ height: CHART_HEIGHT }}
        >
          {[...Y_TICKS].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            width="100%"
            height={CHART_HEIGHT}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#speedFill)" />
            <path
              d={linePath}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p) => (
              <circle
                key={p.time}
                cx={p.x}
                cy={p.y}
                r={3}
                fill="#22c55e"
              >
                <title>{`${p.time}: ${p.value} km/h`}</title>
              </circle>
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="flex mt-1">
            {DATA.map((point, i) => (
              <div key={point.time} className="flex-1 text-center">
                {i % X_LABEL_INTERVAL === 0 && (
                  <span className="text-xs text-gray-400">{point.time}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}