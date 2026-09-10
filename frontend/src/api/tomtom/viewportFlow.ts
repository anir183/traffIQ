import type { Map as MapLibreMap } from "maplibre-gl";
import {
  TRAFFIC_FLOW_SOURCE_ID,
  TrafficFlowModule,
} from "@tomtom-org/maps-sdk/map";
import type {
  TomTomMap,
  TrafficFlowModule as TrafficFlowModuleType,
} from "@tomtom-org/maps-sdk/map";
import type { FlowSample } from "./flow";
import { tomtomKeyIsSet } from "./keys";

export const FLOW_SOURCE_ID = TRAFFIC_FLOW_SOURCE_ID;

const FLOW_ROAD_CATEGORIES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "street",
  "service",
  "track",
] as const;

export type FlowModule = TrafficFlowModuleType;

export async function startFlowModule(
  sdkMap: TomTomMap,
): Promise<FlowModule | null> {
  if (!tomtomKeyIsSet()) return null;
  try {
    return await TrafficFlowModule.get(sdkMap, {
      visible: false,
      filters: {
        any: [
          {
            roadCategories: {
              show: "only",
              values: [...FLOW_ROAD_CATEGORIES],
            },
          },
        ],
      },
    });
  } catch {
    return null;
  }
}

const flowSourceLayerCache = new WeakMap<MapLibreMap, string>();

export function resolveFlowSourceLayer(map: MapLibreMap): string {
  const cached = flowSourceLayerCache.get(map);
  if (cached) return cached;
  let layerName = "";
  try {
    for (const layer of map.getStyle().layers) {
      if ("source" in layer && layer.source === FLOW_SOURCE_ID) {
        const sourceLayer = (layer as { "source-layer"?: string })[
          "source-layer"
        ];
        if (typeof sourceLayer === "string" && sourceLayer) {
          layerName = sourceLayer;
          break;
        }
      }
    }
  } catch {
    return "Flow";
  }
  if (layerName) {
    flowSourceLayerCache.set(map, layerName);
    return layerName;
  }
  // No flow layer resolved yet (module not initialised): cache nothing so the
  // real source-layer is detected on a later call instead of a stale fallback.
  return "Flow";
}

function roadLabel(category: unknown): string {
  if (typeof category !== "string" || !category) return "Road segment";
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} road`;
}

interface RawFlowFeature {
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates?: unknown };
}

export function harvestFlowSamples(map: MapLibreMap): FlowSample[] {
  if (!map.getSource(FLOW_SOURCE_ID)) return [];
  const sourceLayer = resolveFlowSourceLayer(map);
  let raw: unknown[];
  try {
    raw = map.querySourceFeatures(FLOW_SOURCE_ID, { sourceLayer });
  } catch {
    return [];
  }
  const samples: FlowSample[] = [];
  for (const item of raw as RawFlowFeature[]) {
    const props = item.properties ?? {};
    const coordinates = item.geometry?.coordinates;
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Array.isArray(coordinates[0])
    ) {
      continue;
    }
    const relative =
      typeof props.relative_speed === "number" ? props.relative_speed : null;
    const absolute =
      typeof props.absolute_speed === "number" ? props.absolute_speed : null;
    const freeFlow =
      relative !== null && relative > 0 && absolute !== null
        ? absolute / relative
        : null;
    samples.push({
      roadName: roadLabel(props.road_category),
      currentSpeed: absolute,
      freeFlowSpeed: freeFlow !== null ? Math.round(freeFlow * 10) / 10 : null,
      confidence: relative !== null ? Math.round(relative * 100) : null,
      roadClosure: props.road_closure === true,
      coordinates: coordinates as Array<[number, number]>,
    });
  }
  return samples;
}

export function isFlowSegmentFeature(props: Record<string, unknown>): boolean {
  return typeof props?.relative_speed === "number";
}

export function normalizeFlowFeatureProps(
  props: Record<string, unknown>,
): Record<string, unknown> | null {
  if (typeof props.relative_speed !== "number") return null;
  const relative = props.relative_speed;
  const absolute =
    typeof props.absolute_speed === "number" ? props.absolute_speed : null;
  const closed = props.road_closure === true;
  const freeFlow =
    relative > 0 && absolute !== null ? absolute / relative : null;
  return {
    name: roadLabel(props.road_category),
    currentSpeed: absolute,
    freeFlowSpeed: freeFlow !== null ? Math.round(freeFlow * 10) / 10 : null,
    congestion: Math.round((1 - relative) * 100),
    confidence: Math.round(relative * 100),
    closed,
  };
}
