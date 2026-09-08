interface TrafficVolumePoint {
  time: string
  value: number
}

const DATA: TrafficVolumePoint[] = [
  { time: '00:00', value: 3200 },
  { time: '02:00', value: 4100 },
  { time: '04:00', value: 5400 },
  { time: '06:00', value: 7600 },
  { time: '08:00', value: 9800 },
  { time: '10:00', value: 11600 },
  { time: '12:00', value: 12800 },
  { time: '14:00', value: 11400 },
  { time: '16:00', value: 10200 },
  { time: '18:00', value: 8600 },
  { time: '20:00', value: 6800 },
  { time: '22:00', value: 5200 },
]

const Y_MAX = 15000
const Y_TICKS = [0, 5000, 10000, 15000]
const X_LABEL_INTERVAL = 2

function formatYLabel(value: number): string {
  return value === 0 ? '0' : `${value / 1000}K`
}

export default function TrafficVolumeChart() {
  const chartHeight = 180

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Traffic Volume</h3>

      <div className="flex">
        <div
          className="flex flex-col justify-between pr-2 pb-2 text-xs text-slate-400 dark:text-slate-500"
          style={{ height: chartHeight }}
        >
          {[...Y_TICKS].reverse().map((tick) => (
            <span key={tick}>{formatYLabel(tick)}</span>
          ))}
        </div>

        <div className="flex-1">
          <div className="flex items-end gap-1" style={{ height: chartHeight }}>
            {DATA.map((point) => {
              const barHeightPct = (point.value / Y_MAX) * 100
              return (
                <div key={point.time} className="flex h-full min-w-0 flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[18px] rounded-t-md bg-blue-500"
                    style={{ height: `${barHeightPct}%` }}
                    title={`${point.time}: ${point.value.toLocaleString()}`}
                  />
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex gap-1">
            {DATA.map((point, i) => (
              <div key={point.time} className="min-w-0 flex-1 text-center">
                {i % X_LABEL_INTERVAL === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">{point.time}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}