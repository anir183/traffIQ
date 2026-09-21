import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { Bbox } from "../components/map/incidentsApi";
import { MapViewportContext } from "./mapViewport";

export function MapViewportProvider({ children }: { children: ReactNode }) {
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const stableSetBbox = useCallback((next: Bbox | null) => {
    setBbox((prev) => {
      if (
        prev &&
        next &&
        prev.west === next.west &&
        prev.south === next.south &&
        prev.east === next.east &&
        prev.north === next.north
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  return (
    <MapViewportContext.Provider value={{ bbox, setBbox: stableSetBbox }}>
      {children}
    </MapViewportContext.Provider>
  );
}
