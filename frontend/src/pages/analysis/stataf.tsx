import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useTrafficData } from './useTrafficData'
import { useTheme } from '../../theme/useTheme'

const CONGESTION_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']
const CONGESTION_COLORS_DARK = ['#f8fafc', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155']
const SPEED_COLOR = '#3b82f6'

function Charts() {
  const { data } = useTrafficData()
  const { resolvedTheme } = useTheme()
  const congestionColors =
    resolvedTheme === 'dark' ? CONGESTION_COLORS_DARK : CONGESTION_COLORS
  const axisTick = { fontSize: 10, fill: 'var(--chart-axis)' } as const

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[40%] xl:flex-row dark:border-slate-700 dark:bg-slate-900">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Top Congested Segments</span>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.congestedSegments}>
              <XAxis dataKey="name" tick={axisTick} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={axisTick} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.congestedSegments.map((_, i) => (
                  <Cell key={i} fill={congestionColors[i % congestionColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Average Speed by Segment</span>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.avgSpeed}>
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis tick={axisTick} />
              <Bar dataKey="value" fill={SPEED_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Charts