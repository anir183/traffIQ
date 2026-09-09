import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map } from "maplibre-gl";
import {
  baseStyle,
  applyMapTheme,
  addDotMarker,
  addLineLayer,
  fitBoundsToCoordinates,
  KOLKATA_CENTER,
} from "../../components/map/helpers";
import { useTheme } from "../../theme/useTheme";
import { useTrajectory } from "../../hooks/useTrajectory";
import { trajectoryPath } from "../../types/ui/adapters";

const MARKER_COLORS = ["#2563eb", "#eab308", "#dc2626", "#16a34a"];

function drawTrajectory(map: Map, points: [number, number][]): void {
  if (points.length === 0 || map.getSource("vehicle-path")) return;
  if (points.length >= 2) {
    addLineLayer(map, "highlighted-lane", [points[0], points[1]], "#2563eb", 5);
  }
  addLineLayer(map, "vehicle-path", points, "#dc2626", 4);
  points.forEach(([lng, lat], i) => {
    addDotMarker(map, [lng, lat], MARKER_COLORS[i % MARKER_COLORS.length]);
  });
  fitBoundsToCoordinates(map, points, 70);
}

export default function VehicleTrajectoryMap({ plate }: { plate: string }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const { resolvedTheme } = useTheme();
  const { data } = useTrajectory(plate);
  const points = useMemo(
    () => (data ? trajectoryPath(data.points) : []),
    [data],
  );

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: baseStyle(),
      center: KOLKATA_CENTER,
      zoom: 11,
    });
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || points.length === 0) return;
    if (map.loaded()) {
      drawTrajectory(map, points);
    } else {
      map.once("load", () => drawTrajectory(map, points));
    }
  }, [points]);

  useEffect(() => {
    if (mapInstance.current) {
      applyMapTheme(mapInstance.current, resolvedTheme === "dark");
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
