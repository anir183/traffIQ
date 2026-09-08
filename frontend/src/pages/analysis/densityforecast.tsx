import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer } from 'recharts'
import { useTrafficData } from './useTrafficData'

function DensityForecastChart() {
  const { data } = useTrafficData()

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[40%]">
      <span className="mb-1 text-sm font-medium text-slate-600">Traffic Density Forecast</span>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.densityForecast}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip />
            <ReferenceArea x1="Sun" x2="Future+3" fill="#3b82f6" fillOpacity={0.06} />
            <Line type="monotone" dataKey="density" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DensityForecastChart