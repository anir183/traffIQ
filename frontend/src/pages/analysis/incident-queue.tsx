import { useState } from 'react'
import type { IncidentEvent, IncidentEventStatus } from '../../types/traffic'

const INCIDENTS: IncidentEvent[] = [
  { id: '1', status: 'error', title: 'Event Description + Incident Update', location: 'Bidhannagar Area, Kolkata | Traffic Monitoring', timestamp: 'Saturday, 12:30 AM', detailLine: 'Location: 09:36 AM | Status → Update', linkText: 'Container link' },
  { id: '2', status: 'success', title: 'Event Update: Media content operational', location: '', timestamp: '1:00 PM', detailLine: 'Location: 09:35 AM | Status Update', linkText: 'Link link' },
  { id: '3', status: 'error', title: 'Incident & Event Stream', location: 'Bidhannagar Area, Kolkata | Kolkata', timestamp: 'Saturday, 11:00 PM', detailLine: 'Location: 09:06 AM | Status → Update', linkText: 'Continue event link' },
  { id: '4', status: 'neutral', title: 'Status Description Summary', location: '', timestamp: '', detailLine: 'Location: 09:36 AM | Update', linkText: 'Crops one link' },
  { id: '5', status: 'neutral', title: 'Status Description Summary', location: '', timestamp: '', detailLine: 'Location: 07:35 PM | Status Update', linkText: 'Links the link' },
  { id: '6', status: 'warning', title: 'Incident & Event Stream', location: 'Bidhannagar Area, Kolkata | Kolkata', timestamp: 'Saturday, 09:35 PM', detailLine: 'Location: 09:36 AM | Where → Update', linkText: 'Starting cost link' },
]

const PAGE_SIZE = 3

const STATUS_ICON: Record<IncidentEventStatus, string> = {
  error: '✕',
  success: '✓',
  neutral: '•',
  warning: '!',
}

const STATUS_STYLE: Record<IncidentEventStatus, string> = {
  error: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  success: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  neutral: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
}

function IncidentQueue() {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(INCIDENTS.length / PAGE_SIZE))
  const pageItems = INCIDENTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex w-full shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[28%] dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Incident &amp; Event Stream</span>
        <button type="button" className="text-slate-400 dark:text-slate-500" aria-label="More options">⋮</button>
      </div>

      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {pageItems.map((item) => (
          <div key={item.id} className="flex gap-3 py-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${STATUS_STYLE[item.status]}`}
            >
              {STATUS_ICON[item.status]}
            </span>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                {item.timestamp && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">{item.timestamp}</span>
                )}
              </div>
              {item.location && <div className="text-xs text-slate-500 dark:text-slate-400">{item.location}</div>}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {item.detailLine} :{' '}
                <a href="#" className="text-blue-600 underline">{item.linkText}</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-center gap-1 pt-4 text-xs">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={`h-6 w-6 rounded-full text-xs transition-colors ${
              p === page ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Next ›
        </button>
      </div>
    </div>
  )
}

export default IncidentQueue