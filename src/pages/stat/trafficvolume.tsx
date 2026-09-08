interface TrafficVolumePoint {
  time: string; // "00:00", "02:00", ...
  value: number;
}


const DATA: TrafficVolumePoint[] = [
  { time: "00:00", value: 3200 },
  { time: "02:00", value: 4100 },
  { time: "04:00", value: 5400 },
  { time: "06:00", value: 7600 },
  { time: "08:00", value: 9800 },
  { time: "10:00", value: 11600 },
  { time: "12:00", value: 12800 },
  { time: "14:00", value: 11400 },
  { time: "16:00", value: 10200 },
  { time: "18:00", value: 8600 },
  { time: "20:00", value: 6800 },
  { time: "22:00", value: 5200 },
];

const Y_MAX = 15000;
const Y_TICKS = [0, 5000, 10000, 15000];

const X_LABEL_INTERVAL = 2;

function formatYLabel(value: number): string {
  return value === 0 ? "0" : `${value / 1000}K`;
}

export default function TrafficVolumeChart() {
  const chartHeight = 180;

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white  shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Traffic Volume
        </h3>
      </div>

      <div className="flex">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between text-xs text-gray-400 pr-2 pb-2"
          style={{ height: chartHeight }}
        >
          {[...Y_TICKS].reverse().map((tick) => (
            <span key={tick}>{formatYLabel(tick)}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1">
          <div
            className="flex items-end gap-2"
            style={{ height: chartHeight }}
          >
            {DATA.map((point) => {
              const barHeightPct = (point.value / Y_MAX) * 100;
              return (
                <div
                  key={point.time}
                  className="flex-1  flex items-end justify-center h-full"
                >
                  <div
                    className="w-full w-[22px] rounded-t-md bg-blue-400"
                    style={{ height: `${barHeightPct}%` }}
                    title={`${point.time}: ${point.value.toLocaleString()}`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 mt-2">
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