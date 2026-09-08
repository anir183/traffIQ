import { useEffect, useRef } from "react";
import {API_KEY} from '../analysis/config'

// Replace with your own TomTom API key: https://developer.tomtom.com/
const TOMTOM_API_KEY = API_KEY;

type LngLat = { lng: number; lat: number };

declare global {
  interface Window {
    tt: any;
  }
}

// Hardcoded trajectory data (Howrah -> Kolkata -> Salt Lake)
const CAMERA_LOCATION: LngLat = { lng: 88.271, lat: 22.5958 }; // Howrah side
const VEHICLE_START: LngLat = { lng: 88.3105, lat: 22.5893 }; // river crossing point
const VEHICLE_MID: LngLat = { lng: 88.3639, lat: 22.5726 }; // Kolkata (yellow pin)
const VEHICLE_END: LngLat = { lng: 88.4103, lat: 22.5697 }; // Salt Lake (green pin)

// Highlighted lane: the river-crossing leg of the path
const HIGHLIGHTED_LANE: [number, number][] = [
  [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat],
  [VEHICLE_START.lng, VEHICLE_START.lat],
];

// Remaining path: crossing point -> mid -> end
const VEHICLE_PATH: [number, number][] = [
  [VEHICLE_START.lng, VEHICLE_START.lat],
  [VEHICLE_MID.lng, VEHICLE_MID.lat],
  [VEHICLE_END.lng, VEHICLE_END.lat],
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export default function VehicleTrajectoryMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      loadStylesheet(
        "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"
      );
      await loadScript(
        "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"
      );
      if (cancelled || !window.tt || !mapRef.current) return;

      const map = window.tt.map({
        key: TOMTOM_API_KEY,
        container: mapRef.current,
        center: [VEHICLE_MID.lng, VEHICLE_MID.lat],
        zoom: 11,
      });
      mapInstance.current = map;

      map.on("load", () => {
        // Highlighted lane (river crossing) - blue, thicker
        map.addLayer({
          id: "highlighted-lane",
          type: "line",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "LineString", coordinates: HIGHLIGHTED_LANE },
            },
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 5,
          },
        });

        // Remaining vehicle path - red
        map.addLayer({
          id: "vehicle-path",
          type: "line",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "LineString", coordinates: VEHICLE_PATH },
            },
          },
          paint: {
            "line-color": "#dc2626",
            "line-width": 4,
          },
        });

        // Camera location marker (blue)
        const cameraEl = document.createElement("div");
        cameraEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 0 1px #2563eb;";
        new window.tt.Marker({ element: cameraEl })
          .setLngLat([CAMERA_LOCATION.lng, CAMERA_LOCATION.lat])
          .addTo(map);

        // Start of visible path (yellow)
        new window.tt.Marker({ color: "#eab308" })
          .setLngLat([VEHICLE_START.lng, VEHICLE_START.lat])
          .addTo(map);

        // Mid point / vehicle pin (red)
        new window.tt.Marker({ color: "#dc2626" })
          .setLngLat([VEHICLE_MID.lng, VEHICLE_MID.lat])
          .addTo(map);

        // End point (green)
        new window.tt.Marker({ color: "#16a34a" })
          .setLngLat([VEHICLE_END.lng, VEHICLE_END.lat])
          .addTo(map);
      });
    }

    init();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-[50%] h-[362px] rounded-xl border border-gray-200 bg-white p-4! mr-6! shadow-sm">
      <div className="flex items-center justify-between mb-3 h-[55px]">
        <h3 className="text-base text-2xl p-4! text-gray-900">
          Vehicle Trajectory
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-600">
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

      <div
        ref={mapRef}
        className="h-72 w-full rounded-lg overflow-hidden border border-gray-100"
      />


    </div>
  );
}