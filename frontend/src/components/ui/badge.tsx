import type { IncidentStatus } from '../../types/traffic'

const STATUS_STYLES: Record<IncidentStatus, { bg: string; fg: string }> = {
  Active: { bg: 'bg-red-50', fg: 'text-red-700' },
  Investigating: { bg: 'bg-amber-50', fg: 'text-amber-700' },
  Resolved: { bg: 'bg-green-50', fg: 'text-green-700' },
}

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.fg}`}
    >
      {status}
    </span>
  )
}