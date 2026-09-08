import { useMemo } from 'react'
import type { Incident, IncidentIcon } from '../../types/traffic'
import StatusBadge from '../../components/ui/badge'

export type FilterKey = 'all' | 'active' | 'investigating' | 'resolved'

const HARDCODED_INCIDENTS: Incident[] = [
  { id: '1', icon: 'alert', title: 'Blacklisted Vehicle', detail: 'WB02AM7555', location: 'Park Street', time: '14:28', status: 'Active' },
  { id: '2', icon: 'warning', title: 'Accident', detail: 'Multiple vehicles', location: 'EM Bypass', time: '14:15', status: 'Active' },
  { id: '3', icon: 'alert', title: 'Speed Violation', detail: 'DLBCAX1234', location: 'VIP Road', time: '13:52', status: 'Investigating' },
  { id: '4', icon: 'wrongway', title: 'Wrong Way', detail: 'Unknown Vehicle', location: 'Sector V', time: '13:45', status: 'Investigating' },
  { id: '5', icon: 'wrongway', title: 'Route Anomaly', detail: 'MH01AB9876', location: 'New Town', time: '12:30', status: 'Resolved' },
]

const ICON_STYLES: Record<IncidentIcon, { bg: string; fg: string; symbol: string }> = {
  alert: { bg: 'bg-red-50', fg: 'text-red-600', symbol: '▲' },
  warning: { bg: 'bg-amber-50', fg: 'text-amber-600', symbol: '▲' },
  wrongway: { bg: 'bg-amber-50', fg: 'text-amber-600', symbol: '⟲' },
}

const FILTER_MAP: Record<FilterKey, Incident['status'] | undefined> = {
  all: undefined,
  active: 'Active',
  investigating: 'Investigating',
  resolved: 'Resolved',
}

function IncidentRow({ incident }: { incident: Incident }) {
  const icon = ICON_STYLES[incident.icon]

  return (
    <div className="flex items-start gap-3 p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${icon.bg} ${icon.fg}`}
      >
        {icon.symbol}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{incident.title}</p>
        <p className="truncate text-sm text-slate-500">{incident.detail}</p>
        <p className="text-sm text-slate-400">{incident.location}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs text-slate-400">{incident.time}</span>
        <StatusBadge status={incident.status} />
      </div>
    </div>
  )
}

export default function RecentIncidents({ filter = 'all' }: { filter?: FilterKey }) {
  const incidents = useMemo(() => {
    const status = FILTER_MAP[filter]
    if (!status) return HARDCODED_INCIDENTS
    return HARDCODED_INCIDENTS.filter((incident) => incident.status === status)
  }, [filter])

  return (
    <div className="flex w-full max-w-sm flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 pl-2 pt-2 text-base font-semibold text-slate-900">Recent Incidents</h3>

      <div className="divide-y divide-slate-100">
        {incidents.map((incident) => (
          <IncidentRow key={incident.id} incident={incident} />
        ))}
      </div>
      {incidents.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No incidents match this filter.</p>
      )}
    </div>
  )
}