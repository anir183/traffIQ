import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useTrafficData } from './useTrafficData'

const CONGESTION_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']
const SPEED_COLOR = '#3b82f6'

function Charts() {
  const { data } = useTrafficData()

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[40%] xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="mb-1 text-sm font-medium text-slate-600">Top Congested Segments</span>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.congestedSegments}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.congestedSegments.map((_, i) => (
                  <Cell key={i} fill={CONGESTION_COLORS[i % CONGESTION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="mb-1 text-sm font-medium text-slate-600">Average Speed by Segment</span>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.avgSpeed}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" fill={SPEED_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Charts