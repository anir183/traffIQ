import { useEffect } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { Feature, Geometry } from 'geojson'
import { API_KEY } from '../../config'
import { ensureTomTomConfig, KOLKATA_CENTER } from '../../components/map/helpers'

interface TomTomIncident {
  properties: { magnitudeOfDelay?: number }
  geometry: Geometry
}

function getFeatures(incidents: TomTomIncident[]): Feature[] {
  return incidents.map((incident) => ({
    type: 'Feature' as const,
    properties: {
      severity: Math.min((incident.properties.magnitudeOfDelay || 1) / 5, 1.0),
    },
    geometry: incident.geometry,
  }))
}

function setupHeatmap(map: MapLibreMap): void {
  map.addSource('traffic-heatmap-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  map.addLayer({
    id: 'live-traffic-heatmap',
    type: 'heatmap',
    source: 'traffic-heatmap-source',
    paint: {
      'heatmap-weight': ['get', 'severity'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgb(0, 128, 255)',
        0.4, 'rgb(0, 255, 0)',
        0.6, 'rgb(255, 255, 0)',
        0.8, 'rgb(255, 128, 0)',
        1.0, 'rgb(255, 0, 0)',
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 18, 40],
      'heatmap-opacity': 0.85,
    },
  })
}

function updateTrafficHeatmap(map: MapLibreMap): Promise<void> {
  const bounds = map.getBounds()
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${API_KEY}&bbox=${bbox}&timeValidityFilter=present`

  return fetch(url)
    .then((response) => response.json())
    .then((data: { incidents?: TomTomIncident[] }) => {
      const source = map.getSource('traffic-heatmap-source') as GeoJSONSource | undefined
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: getFeatures(data.incidents ?? []),
        })
      }
    })
    .catch((err) => {
      console.error('Failed to update traffic heatmap', err)
    })
}

const Mapp = () => {
  useEffect(() => {
    ensureTomTomConfig()

    const map = new TomTomMap({
      mapLibre: {
        container: 'sdk-map',
        center: KOLKATA_CENTER,
        zoom: 11,
      },
    })

    TrafficFlowModule.get(map, { visible: true }).then((trafficFlowModule) => {
      trafficFlowModule.filter({
        any: [{
          roadCategories: {
            show: 'only',
            values: ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'street', 'service', 'track'],
          },
        }],
      })
    })

    let intervalId: ReturnType<typeof setInterval> | undefined

    map.mapLibreMap.on('load', () => {
      setupHeatmap(map.mapLibreMap)
      void updateTrafficHeatmap(map.mapLibreMap)
      intervalId = setInterval(() => void updateTrafficHeatmap(map.mapLibreMap), 20000)
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
      map.mapLibreMap.remove()
    }
  }, [])

  return (
    <div className="flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div id="sdk-map" className="h-full min-h-[300px] w-full" />
    </div>
  )
}

export default Mapp