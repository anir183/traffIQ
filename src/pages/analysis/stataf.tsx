// src/body/window/analysis/stataf.tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useTrafficData } from './useTrafficData'
import './tailwind.css'
const CONGESTION_COLORS = ['#e0561f', '#e8722f', '#efa23f', '#f2c14e', '#f2c14e', '#e8d9b0']
const SPEED_COLOR = '#3d8fa8'

function Charts() {
  const { data, loading } = useTrafficData()

  if (loading) return <div>Loading...</div>

  return (
    <div className='flex flex-row gap-4 w-[40%] h-[232px]'>
      <div className='flex-1 border rounded-2xl p-4'>
        <span className='text-xs text-gray-400'>Top Congested Segments</span>
        <ResponsiveContainer width='100%' height={180}>
          <BarChart data={data.congestedSegments}>
            <XAxis dataKey='name' tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor='end' />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar dataKey='value' radius={[4, 4, 0, 0]}>
              {data.congestedSegments.map((_, i) => (
                <Cell key={i} fill={CONGESTION_COLORS[i % CONGESTION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className='flex-1 border rounded-2xl p-4'>
        <span className='text-xs text-gray-400'>Average Speed by Segment</span>
        <ResponsiveContainer width='100%' height={180}>
          <BarChart data={data.avgSpeed}>
            <XAxis dataKey='name' tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar dataKey='value' fill={SPEED_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Charts