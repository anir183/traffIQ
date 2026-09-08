// IncidentQueue.tsx
import './i.css'
import { useState } from 'react'
// import './incidentQueue.css'

interface IncidentEvent {
  id: string
  status: 'error' | 'success' | 'neutral' | 'warning'
  title: string
  location: string
  timestamp: string
  detailLine: string
  linkText: string
}

const INCIDENTS: IncidentEvent[] = [
  { id: '1', status: 'error', title: 'Event Description + Incident Update', location: 'Bidhannagar Area, Kolkata | Traffic Monitoring', timestamp: 'Saturday, 12:30 AM', detailLine: 'Location: 09:36 AM | Status → Update', linkText: 'Container link' },
  { id: '2', status: 'success', title: 'Event Update: Media content operational', location: '', timestamp: '1:00 PM', detailLine: 'Location: 09:35 AM | Status Update', linkText: 'Link link' },
  { id: '3', status: 'error', title: 'Incident & Event Stream', location: 'Bidhannagar Area, Kolkata | Kolkata', timestamp: 'Saturday, 11:00 PM', detailLine: 'Location: 09:06 AM | Status → Update', linkText: 'Continue event link' },
  { id: '4', status: 'neutral', title: 'Status Description Summary', location: '', timestamp: '', detailLine: 'Location: 09:36 AM | Update', linkText: 'Crops one link' },
  { id: '5', status: 'neutral', title: 'Status Description Summary', location: '', timestamp: '', detailLine: 'Location: 07:35 PM | Status Update', linkText: 'Links the link' },
  { id: '6', status: 'warning', title: 'Incident & Event Stream', location: 'Bidhannagar Area, Kolkata | Kolkata', timestamp: 'Saturday, 09:35 PM', detailLine: 'Location: 09:36 AM | Where → Update', linkText: 'Starting cost link' },
]

const PAGE_SIZE = 3

const STATUS_ICON: Record<IncidentEvent['status'], string> = {
  error: '✕',
  success: '✓',
  neutral: '•',
  warning: '!',
}

function IncidentQueue() {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(INCIDENTS.length / PAGE_SIZE))
  const pageItems = INCIDENTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className='incident-queue'>
      <div className='incident-queue-header'>
        <span className='incident-queue-title'>Incident & Event Stream</span>
        <span className='incident-queue-menu'>⋮</span>
      </div>

      <div className='incident-list'>
        {pageItems.map((item) => (
          <div key={item.id} className='incident-item'>
            <div className={`incident-icon incident-icon-${item.status}`}>
              {STATUS_ICON[item.status]}
            </div>
            <div className='incident-body'>
              <div className='incident-top-row'>
                <span className='incident-title'>{item.title}</span>
                {item.timestamp && <span className='incident-timestamp'>{item.timestamp}</span>}
              </div>
              {item.location && <div className='incident-location'>{item.location}</div>}
              <div className='incident-detail'>
                {item.detailLine} : <a href='#' className='incident-link'>{item.linkText}</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='incident-pagination'>
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className='pagination-arrow'>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`pagination-dot ${p === page ? 'pagination-dot-active' : ''}`}
          >
            {p}
          </button>
        ))}
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className='pagination-arrow'>Next ›</button>
      </div>
    </div>
  )
}

export default IncidentQueue