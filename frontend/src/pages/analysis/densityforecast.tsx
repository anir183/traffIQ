import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer } from 'recharts'
import { useTrafficData } from './useTrafficData'
import './tailwind.css'
function DensityForecastChart() {
  const { data } = useTrafficData()

  return (
    <div className='border rounded-2xl p-4 w-[40%] h-[232px]'>
      <span className='text-xs text-gray-400'>Traffic Density Forecast</span>
      <ResponsiveContainer width='100%' height={220}>
        <LineChart data={data.densityForecast}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.2} />
          <XAxis dataKey='day' tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <ReferenceArea x1='Sun' x2='Future+3' fill='#2a78d6' fillOpacity={0.06} />
          <Line type='monotone' dataKey='density' stroke='#2a78d6' strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DensityForecastChart