import { useState, useEffect } from 'react'
import type { TrafficData } from '../../types/traffic'

const MOCK_DATA: TrafficData = {
  congestedSegments: [
    { name: 'VIP Road', value: 800 },
    { name: 'EM Bypass', value: 130 },
    { name: 'Sector 5', value: 100 },
    { name: 'Sector 2', value: 65 },
    { name: 'Salt Lake', value: 40 },
    { name: 'Tollygunge', value: 12 },
  ],
  avgSpeed: [
    { name: '14', value: 74 },
    { name: '17', value: 78 },
    { name: '25', value: 66 },
    { name: '23', value: 69 },
    { name: '18', value: 62 },
    { name: '21', value: 66 },
  ],
  densityForecast: [
    { day: 'Mon', density: 65 },
    { day: 'Tue', density: 58 },
    { day: 'Wed', density: 55 },
    { day: 'Thu', density: 62 },
    { day: 'Fri', density: 70 },
    { day: 'Sat', density: 68 },
    { day: 'Sun', density: 60 },
    { day: 'Future', density: 45 },
    { day: 'Future+2', density: 35 },
    { day: 'Future+3', density: 25 },
  ],
}

export function useTrafficData(pollMs?: number) {
  const [data, setData] = useState<TrafficData>(MOCK_DATA)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pollMs) return

    let cancelled = false

    const fetchLive = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/traffic/overview')
        const json: TrafficData = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('Failed to fetch traffic data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLive()
    const id = setInterval(fetchLive, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollMs])

  return { data, loading }
}