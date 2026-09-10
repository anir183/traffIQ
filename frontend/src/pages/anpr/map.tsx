import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { TomTomMap } from "@tomtom-org/maps-sdk/map";
import type { Map } from "maplibre-gl";
import {
  ensureTomTomConfig,
  applyTomTomTheme,
  addDotMarker,
  addLineLayer,
  fitBoundsToCoordinates,
} from "../../components/map/helpers";
import { useTheme } from "../../theme/useTheme";

type LngLat = { lng: number; lat: number };

const CAMERA_LOCATION: LngLat = { lng: 88.271, lat: 22.5958 };
const VEHICLE_START: LngLat = { lng: 88.3105, lat: 22.5893 };
const VEHICLE_MID: LngLat = { lng: 88.3639, lat: 22.5726 };
const VEHICLE_END: LngLat = { lng: 88.4103, lat: 22.5697 };

const HIGHLIGHTED_LANE: [number, number][] = [
  [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat],
  [VEHICLE_START.lng, VEHICLE_START.lat],
];

const VEHICLE_PATH: [number, number][] = [
  [VEHICLE_START.lng, VEHICLE_START.lat],
  [VEHICLE_MID.lng, VEHICLE_MID.lat],
  [VEHICLE_END.lng, VEHICLE_END.lat],
];

const TRAJECTORY_POINTS: [number, number][] = [
  [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat],
  [VEHICLE_START.lng, VEHICLE_START.lat],
  [VEHICLE_MID.lng, VEHICLE_MID.lat],
  [VEHICLE_END.lng, VEHICLE_END.lat],
];

function getVehicleTrajectoryMap(container: HTMLDivElement): TomTomMap {
  return new TomTomMap({
    mapLibre: {
      container,
      center: [VEHICLE_MID.lng, VEHICLE_MID.lat],
      zoom: 11,
    },
  });
}

function onMapLoad(map: Map): void {
  if (map.getSource("highlighted-lane")) return;
  addLineLayer(map, "highlighted-lane", HIGHLIGHTED_LANE, "#2563eb", 5);
  addLineLayer(map, "vehicle-path", VEHICLE_PATH, "#dc2626", 4);
}

export default function VehicleTrajectoryMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<TomTomMap | null>(null);
  const trajectoryFitted = useRef(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    ensureTomTomConfig();
    if (!mapRef.current) return;

    const map = getVehicleTrajectoryMap(mapRef.current);
    mapInstance.current = map;

    map.mapLibreMap.on("load", () => {
      onMapLoad(map.mapLibreMap);
      if (!trajectoryFitted.current) {
        trajectoryFitted.current = true;
        fitBoundsToCoordinates(map.mapLibreMap, TRAJECTORY_POINTS, 70);
      }
    });

    addDotMarker(
      map.mapLibreMap,
      [CAMERA_LOCATION.lng, CAMERA_LOCATION.lat],
      "#2563eb",
    );
    addDotMarker(
      map.mapLibreMap,
      [VEHICLE_START.lng, VEHICLE_START.lat],
      "#eab308",
    );
    addDotMarker(
      map.mapLibreMap,
      [VEHICLE_MID.lng, VEHICLE_MID.lat],
      "#dc2626",
    );
    addDotMarker(
      map.mapLibreMap,
      [VEHICLE_END.lng, VEHICLE_END.lat],
      "#16a34a",
    );

    return () => {
      map.mapLibreMap.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      applyTomTomTheme(mapInstance.current, resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Vehicle Trajectory
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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
        className="min-h-72 w-full flex-1 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700"
      />
    </div>
  );
}
