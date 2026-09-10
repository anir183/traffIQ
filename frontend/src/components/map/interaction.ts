import { Popup } from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

export function bindFeatureHoverPopup(
  map: MapLibreMap,
  layerIds: string[],
  isActive: () => boolean,
  buildContent: (properties: Record<string, unknown>) => HTMLElement,
): () => void {
  let popup: Popup | null = null;
  const canvas = map.getCanvas();

  const close = () => {
    if (popup) popup.remove();
  };

  const clearPointer = () => {
    canvas.style.cursor = "";
  };

  const showFeature = (event: MapMouseEvent): boolean => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: layerIds,
    });
    if (features.length === 0) return false;
    if (!popup) popup = new Popup({ closeButton: false, offset: 12 });
    popup
      .setDOMContent(
        buildContent((features[0].properties ?? {}) as Record<string, unknown>),
      )
      .setLngLat(event.lngLat);
    if (!popup.isOpen()) popup.addTo(map);
    return true;
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
