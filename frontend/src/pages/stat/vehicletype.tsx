import { useMemo } from 'react'
import { useTheme } from '../../theme/useTheme'

interface VehicleTypeSegment {
  label: string
  percent: number
  color: string
}

const SEGMENTS: VehicleTypeSegment[] = [
  { label: 'Car', percent: 58, color: '#0f172a' },
  { label: 'Bike', percent: 26, color: '#475569' },
  { label: 'Bus', percent: 8, color: '#94a3b8' },
  { label: 'Truck', percent: 6, color: '#cbd5e1' },
  { label: 'Others', percent: 2, color: '#e2e8f0' },
]

const SEGMENTS_DARK: VehicleTypeSegment[] = [
  { label: 'Car', percent: 58, color: '#f8fafc' },
  { label: 'Bike', percent: 26, color: '#cbd5e1' },
  { label: 'Bus', percent: 8, color: '#94a3b8' },
  { label: 'Truck', percent: 6, color: '#64748b' },
  { label: 'Others', percent: 2, color: '#475569' },
]

const TOTAL_VEHICLES = '125,430'

const RADIUS = 60
const STROKE_WIDTH = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function VehicleTypeBreakdown() {
  const { resolvedTheme } = useTheme()
  const segments = useMemo(() => {
    const palette = resolvedTheme === 'dark' ? SEGMENTS_DARK : SEGMENTS
    const cumulativeBefore = palette.map((_, i) =>
      palette.slice(0, i).reduce((acc, s) => acc + s.percent, 0)
    )
    return palette.map((segment, i) => {
      const dash = (segment.percent / 100) * CIRCUMFERENCE
      const gap = CIRCUMFERENCE - dash
      const offset = -(cumulativeBefore[i] / 100) * CIRCUMFERENCE
      return { ...segment, dash, gap, offset }
    })
  }, [resolvedTheme])

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Vehicle Type Breakdown</h3>

      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <svg
            viewBox="0 0 160 160"
            className="-rotate-90"
            width={140}
            height={140}
          >
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx={80}
                cy={80}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${segment.dash} ${segment.gap}`}
                strokeDashoffset={segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">{TOTAL_VEHICLES}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Total Vehicles</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2.5">
          {segments.map((segment) => (
            <div key={segment.label} className="flex min-w-0 items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{segment.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}