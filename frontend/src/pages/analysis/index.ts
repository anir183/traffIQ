import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
import { GeoJSONSource } from 'maplibre-gl';
import { API_KEY } from './config';


TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [77.3693,28.36],
        zoom:10,
    },
});

TrafficFlowModule.get(map, { visible: true }).then((trafficFlowModule) => {
    // trafficFlowModule.setVisible(true);
        trafficFlowModule.filter({
            any: [{
                roadCategories: {
                    show: 'only',
                    values: ["motorway" , "motorway_link" , "trunk" , "trunk_link" , "primary" , "primary_link" , "secondary" , "secondary_link" , "tertiary" , "tertiary_link" , "street" , "service" , 'track' ],
                },
                }],
        });
        
});

map.mapLibreMap.on('load', async () => {
    map.mapLibreMap.addSource('traffic-heatmap-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // 2. Add the heatmap layer styled with your color ramp
    map.mapLibreMap.addLayer({
        id: 'live-traffic-heatmap',
        type: 'heatmap',
        source: 'traffic-heatmap-source',
        paint: {
            'heatmap-weight': ['get', 'severity'], // Uses severity or delay magnitude
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 255, 0)',
                0.2, 'rgb(0, 128, 255)',   // Blue (low events)
                0.4, 'rgb(0, 255, 0)',     // Green
                0.6, 'rgb(255, 255, 0)',   // Yellow
                0.8, 'rgb(255, 128, 0)',   // Orange
                1.0, 'rgb(255, 0, 0)'      // Red (high congestion/incidents)
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 18, 40],
            'heatmap-opacity': 0.85
        }
    });


    async function updateTrafficHeatmap() {
    const bounds = map.mapLibreMap.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${API_KEY}&bbox=${bbox}&timeValidityFilter=present`;
    
    const response = await fetch(url);
    const data = await response.json();
    const features = data.incidents ? data.incidents.map((incident : any ) => {
        const severity = Math.min((incident.properties.magnitudeOfDelay || 1) / 5, 1.0);
        
        return {
            type: 'Feature',
            properties: { severity: severity },
            geometry: incident.geometry
        };
    }).filter(Boolean) : [];

    const liveGeoJson = {
        type: 'FeatureCollection',
        features: features
    };

    const source = map.mapLibreMap.getSource('traffic-heatmap-source');
    if (source) {
        (source as GeoJSONSource).setData(liveGeoJson);
    }
}

    updateTrafficHeatmap();
    setInterval(updateTrafficHeatmap, 1000);
});