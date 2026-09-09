import { LngLatBounds, Marker } from "maplibre-gl";
import type { Map, StyleSpecification } from "maplibre-gl";
import { TomTomConfig } from "@tomtom-org/maps-sdk/core";
import type { TomTomMap } from "@tomtom-org/maps-sdk/map";
import { API_KEY } from "../../config";

export const KOLKATA_CENTER: [number, number] = [88.3639, 22.5726];

let tomTomConfigured = false;

export function ensureTomTomConfig(): void {
  if (tomTomConfigured) return;
  TomTomConfig.instance.put({ apiKey: API_KEY, language: "en-GB" });
  tomTomConfigured = true;
}

export function applyTomTomTheme(map: TomTomMap, dark: boolean): void {
  map.setStyle(dark ? "standardDark" : "standardLight");
}

const RASTER_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function baseStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [RASTER_URL],
        tileSize: 256,
        attribution: "\u00a9 OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm-basemap",
        type: "raster",
        source: "osm",
        paint: { "raster-opacity": 0.9 },
      },
    ],
  };
}

export function applyMapTheme(map: Map, dark: boolean): void {
  map.getCanvas().style.filter = dark ? "invert(1) hue-rotate(180deg)" : "";
}

export function addDotMarker(
  map: Map,
  lngLat: [number, number],
  color: string,
): Marker {
  const el = document.createElement("div");
  el.style.cssText =
    `width:14px;height:14px;border-radius:50%;background:${color};` +
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);";
  return new Marker({ element: el }).setLngLat(lngLat).addTo(map);
}

export function addPulseMarker(map: Map, lngLat: [number, number]): Marker {
  const wrapper = document.createElement("div");
  wrapper.className = "relative flex h-4 w-4 items-center justify-center";

  const pulse = document.createElement("div");
  pulse.className = "absolute h-4 w-4 rounded-full bg-red-500 animate-ping";
  wrapper.appendChild(pulse);

  const dot = document.createElement("div");
  dot.className =
    "relative h-3.5 w-3.5 rounded-full bg-red-600 border-2 border-white";
  wrapper.appendChild(dot);

  return new Marker({ element: wrapper }).setLngLat(lngLat).addTo(map);
}

export function addLineLayer(
  map: Map,
  id: string,
  coordinates: [number, number][],
  color: string,
  width = 4,
): void {
  map.addLayer({
    id,
    type: "line",
    source: {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: {},
      },
    },
    paint: {
      "line-color": color,
      "line-width": width,
    },
  });
}

export function fitBoundsToCoordinates(
  map: Map,
  coordinates: [number, number][],
  padding = 60,
): void {
  if (coordinates.length === 0) return;
  const bounds = new LngLatBounds();
  coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
  map.fitBounds(bounds, { padding, duration: 0, maxZoom: 13 });
}
