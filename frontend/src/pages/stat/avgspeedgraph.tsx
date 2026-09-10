interface SpeedPoint {
  time: string;
  value: number;
}

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
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Average Speed
        </h3>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          km/h
          <span className="text-slate-400 dark:text-slate-500">▾</span>
        </button>
      </div>

      <div className="flex">
        <div
          className="flex flex-col justify-between pr-2 text-xs text-slate-400 dark:text-slate-500"
          style={{ height: CHART_HEIGHT }}
        >
          {[...Y_TICKS].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="flex-1">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            width="100%"
            height={CHART_HEIGHT}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#speedFill)" />
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p) => (
              <circle key={p.time} cx={p.x} cy={p.y} r={3} fill="#10b981">
                <title>{`${p.time}: ${p.value} km/h`}</title>
              </circle>
            ))}
          </svg>

          <div className="mt-1 flex">
            {DATA.map((point, i) => (
              <div key={point.time} className="flex-1 text-center">
                {i % X_LABEL_INTERVAL === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {point.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
