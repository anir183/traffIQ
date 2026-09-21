import { createContext, useContext } from "react";
import type { Bbox } from "../components/map/incidentsApi";

export interface MapViewportState {
  bbox: Bbox | null;
  setBbox: (bbox: Bbox | null) => void;
}

export const MapViewportContext = createContext<MapViewportState>({
  bbox: null,
  setBbox: () => {},
});

export function useMapViewport(): MapViewportState {
  return useContext(MapViewportContext);
}
