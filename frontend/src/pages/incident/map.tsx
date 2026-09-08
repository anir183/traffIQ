import { useEffect, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TomTomMap } from '@tomtom-org/maps-sdk/map'
import { ensureTomTomConfig, addPulseMarker, KOLKATA_CENTER } from '../../components/map/helpers'

type LngLat = { lng: number; lat: number }

const INCIDENT_1: LngLat = { lng: 88.3095, lat: 22.5975 }
const INCIDENT_2: LngLat = { lng: 88.4103, lat: 22.582 }

const LEGEND = [
  { label: 'Normal', color: '#22c55e' },
  { label: 'Moderate', color: '#eab308' },
  { label: 'Heavy', color: '#f97316' },
  { label: 'Incident', color: '#dc2626' },
]

export default function IncidentMap() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<TomTomMap | null>(null)

  useEffect(() => {
    ensureTomTomConfig()
    if (!mapRef.current) return

    const map = new TomTomMap({
      mapLibre: {
        container: mapRef.current,
        center: KOLKATA_CENTER,
        zoom: 12,
      },
    })
    mapInstance.current = map

    map.mapLibreMap.on('load', () => {
      addPulseMarker(map.mapLibreMap, [INCIDENT_1.lng, INCIDENT_1.lat])
      addPulseMarker(map.mapLibreMap, [INCIDENT_2.lng, INCIDENT_2.lat])
    })

    return () => {
      map.mapLibreMap.remove()
      mapInstance.current = null
    }
  }, [])

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Incident Map</h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-lg border border-slate-100" />
    </div>
  )
}