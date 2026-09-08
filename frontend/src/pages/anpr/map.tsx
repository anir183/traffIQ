import { useEffect, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TomTomMap } from '@tomtom-org/maps-sdk/map'
import type { Map } from 'maplibre-gl'
import { ensureTomTomConfig, addDotMarker, addLineLayer } from '../../components/map/helpers'

type LngLat = { lng: number; lat: number }

const CAMERA_LOCATION: LngLat = { lng: 88.271, lat: 22.5958 }
const VEHICLE_START: LngLat = { lng: 88.3105, lat: 22.5893 }
const VEHICLE_MID: LngLat = { lng: 88.3639, lat: 22.5726 }
const VEHICLE_END: LngLat = { lng: 88.4103, lat: 22.5697 }

const HIGHLIGHTED_LANE: [number, number][] = [
  [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat],
  [VEHICLE_START.lng, VEHICLE_START.lat],
]

const VEHICLE_PATH: [number, number][] = [
  [VEHICLE_START.lng, VEHICLE_START.lat],
  [VEHICLE_MID.lng, VEHICLE_MID.lat],
  [VEHICLE_END.lng, VEHICLE_END.lat],
]

function getVehicleTrajectoryMap(container: HTMLDivElement): TomTomMap {
  return new TomTomMap({
    mapLibre: {
      container,
      center: [VEHICLE_MID.lng, VEHICLE_MID.lat],
      zoom: 11,
    },
  })
}

function onMapLoad(map: Map): void {
  addLineLayer(map, 'highlighted-lane', HIGHLIGHTED_LANE, '#2563eb', 5)
  addLineLayer(map, 'vehicle-path', VEHICLE_PATH, '#dc2626', 4)

  addDotMarker(map, [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat], '#2563eb')
  addDotMarker(map, [VEHICLE_START.lng, VEHICLE_START.lat], '#eab308')
  addDotMarker(map, [VEHICLE_MID.lng, VEHICLE_MID.lat], '#dc2626')
  addDotMarker(map, [VEHICLE_END.lng, VEHICLE_END.lat], '#16a34a')
}

export default function VehicleTrajectoryMap() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<TomTomMap | null>(null)

  useEffect(() => {
    ensureTomTomConfig()
    if (!mapRef.current) return

    const map = getVehicleTrajectoryMap(mapRef.current)
    mapInstance.current = map

    map.mapLibreMap.on('load', () => onMapLoad(map.mapLibreMap))

    return () => {
      map.mapLibreMap.remove()
      mapInstance.current = null
    }
  }, [])

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Vehicle Trajectory</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Camera Location
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            Vehicle Path
          </span>
        </div>
      </div>

      <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-lg border border-slate-100" />
    </div>
  )
}