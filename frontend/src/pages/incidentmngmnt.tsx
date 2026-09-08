import { useState } from 'react'
import Map from '../pages/incident/map'
import IncidentLogs, { type FilterKey } from '../pages/incident/incidents'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
]

const IncidentManagement = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  return (
    <div className="flex flex-col gap-6 p-6 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Incident Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage traffic incidents and alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.key === activeFilter
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="w-full">
          <Map/>
        </div>
      </div>

      <IncidentLogs filter={activeFilter}/>
    </div>
  )
}

export default IncidentManagement