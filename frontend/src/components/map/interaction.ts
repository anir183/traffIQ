import { Popup } from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

const livePopups = new WeakMap<MapLibreMap, Popup>();

export function closeHoverPopups(map: MapLibreMap): void {
  livePopups.get(map)?.remove();
}

export function bindFeatureHoverPopup(
  map: MapLibreMap,
  layerIds: string[],
  isActive: () => boolean,
  buildContent: (properties: Record<string, unknown>) => HTMLElement,
  pickFallback?: (
    features: Array<{ properties: Record<string, unknown> }>,
  ) => { properties: Record<string, unknown> } | null,
): () => void {
  let popup: Popup | null = null;
  const canvas = map.getCanvas();

  const close = () => {
    if (popup) {
      popup.remove();
      livePopups.delete(map);
    }
    popup = null;
  };

  const clearPointer = () => {
    canvas.style.cursor = "";
  };

  const openPopup = (
    event: MapMouseEvent,
    properties: Record<string, unknown>,
  ): boolean => {
    if (!popup) popup = new Popup({ closeButton: false, offset: 12 });
    popup.setDOMContent(buildContent(properties)).setLngLat(event.lngLat);
    if (!popup.isOpen()) popup.addTo(map);
    livePopups.set(map, popup);
    return true;
  };

  const showFeature = (event: MapMouseEvent): boolean => {
    const available = layerIds.filter((id) => map.getLayer(id));
    if (available.length > 0) {
      let features: Array<{ properties: Record<string, unknown> }> = [];
      try {
        features = map.queryRenderedFeatures(event.point, {
          layers: available,
        }) as Array<{ properties: Record<string, unknown> }>;
      } catch {
        features = [];
      }
      if (features.length > 0) {
        return openPopup(
          event,
          (features[0].properties ?? {}) as Record<string, unknown>,
        );
      }
    }
    if (pickFallback) {
      let all: Array<{ properties: Record<string, unknown> }> = [];
      try {
        all = map.queryRenderedFeatures(event.point, {
          validate: false,
        }) as Array<{ properties: Record<string, unknown> }>;
      } catch {
        all = [];
      }
      const picked = pickFallback(all);
      if (picked) return openPopup(event, picked.properties);
    }
    return false;
  };

  const onMove = (event: MapMouseEvent) => {
    close();
    if (!isActive() || !showFeature(event)) {
      clearPointer();
    } else {
      canvas.style.cursor = "pointer";
    }
  };

  const onClick = (event: MapMouseEvent) => {
    if (!isActive()) return;
    if (showFeature(event)) return;
    close();
  };

  const onLeave = () => {
    close();
    clearPointer();
  };

  map.on("mousemove", onMove);
  map.on("click", onClick);
  canvas.addEventListener("mouseleave", onLeave);

  return () => {
    map.off("mousemove", onMove);
    map.off("click", onClick);
    canvas.removeEventListener("mouseleave", onLeave);
    close();
    clearPointer();
  };
}
