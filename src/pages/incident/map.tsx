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

// Hardcoded incident points (Kolkata / Salt Lake area)
const INCIDENT_1: LngLat = { lng: 88.3095, lat: 22.5975 }; // upper-left pin
const INCIDENT_2: LngLat = { lng: 88.4103, lat: 22.5820 }; // upper-right pin (Salt Lake)

const MAP_CENTER: LngLat = { lng: 88.3639, lat: 22.5726 };

const LEGEND = [
  { label: "Normal", color: "#22c55e" },
  { label: "Moderate", color: "#eab308" },
  { label: "Heavy", color: "#f97316" },
  { label: "Incident", color: "#dc2626" },
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

function addIncidentMarker(map: any, point: LngLat) {
  // Fading pulse ring wrapper
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:relative;width:16px;height:16px;display:flex;align-items:center;justify-content:center;";

  const pulse = document.createElement("div");
  pulse.className = "incident-pulse";
  pulse.style.cssText =
    "position:absolute;width:16px;height:16px;border-radius:50%;background:rgba(220,38,38,0.55);";
  wrapper.appendChild(pulse);

  const dot = document.createElement("div");
  dot.style.cssText =
    "position:relative;width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);";
  wrapper.appendChild(dot);

  new window.tt.Marker({ element: wrapper })
    .setLngLat([point.lng, point.lat])
    .addTo(map);
}

export default function IncidentMap() {
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
        center: [MAP_CENTER.lng, MAP_CENTER.lat],
        zoom: 12,
      });
      mapInstance.current = map;

      map.on("load", () => {
        addIncidentMarker(map, INCIDENT_1);
        addIncidentMarker(map, INCIDENT_2);
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
    <div className="w-full h-[517px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* CSS for the fading pulse animation */}
      <style>{`
        @keyframes incident-pulse-fade {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(4.5);
            opacity: 0;
          }
        }
        .incident-pulse {
          animation: incident-pulse-fade 1.8s ease-out infinite;
        }
      `}</style>

      <div className="flex items-center! justify-between mb-3">
        <h3 className="text-2xl p-4! flex items-center! font-semibold text-gray-900">
          Incident Map
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 p-4!gap-y-1 mb-3 text-xs text-gray-600">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex p-2! items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div
        ref={mapRef}
        className="h-72 w-full rounded-lg p-4! translate-y-7 overflow-hidden border border-gray-100"
      />
    </div>
  );
}