// mapp.tsx
import './mapp.css'
import { useEffect } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TomTomConfig } from '@tomtom-org/maps-sdk/core'
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map'
import type { GeoJSONSource } from 'maplibre-gl'
import { API_KEY } from './config'

const Mapp = () => {
  useEffect(() => {
    TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' })

    const map = new TomTomMap({
      mapLibre: {
        container: 'sdk-map',
        center: [77.3693, 28.36],
        zoom: 10,
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

    let intervalId: ReturnType<typeof setInterval>

    map.mapLibreMap.on('load', async () => {
      map.mapLibreMap.addSource('traffic-heatmap-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.mapLibreMap.addLayer({
        id: 'live-traffic-heatmap',
        type: 'heatmap',
        source: 'traffic-heatmap-source',
        paint: {
          'heatmap-weight': ['get', 'severity'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
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

      async function updateTrafficHeatmap() {
        const bounds = map.mapLibreMap.getBounds()
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${API_KEY}&bbox=${bbox}&timeValidityFilter=present`

        try {
          const response = await fetch(url)
          const data = await response.json()
          const features = data.incidents
            ? data.incidents.map((incident: any) => ({
                type: 'Feature',
                properties: { severity: Math.min((incident.properties.magnitudeOfDelay || 1) / 5, 1.0) },
                geometry: incident.geometry,
              }))
            : []

          const source = map.mapLibreMap.getSource('traffic-heatmap-source')
          if (source) (source as GeoJSONSource).setData({ type: 'FeatureCollection', features })
        } catch (err) {
          console.error('Failed to update traffic heatmap', err)
        }
      }

      updateTrafficHeatmap()
      intervalId = setInterval(updateTrafficHeatmap, 20000)
    })

    return () => {
      clearInterval(intervalId)
      map.mapLibreMap.remove()
    }
  }, [])

  return <div id="sdk-map" className='sdk' ></div>
}

export default Mapp