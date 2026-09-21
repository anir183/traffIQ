import {
  TRAFFIC_FLOW_SOURCE_ID,
  TrafficFlowModule,
} from "@tomtom-org/maps-sdk/map";
import type {
  TomTomMap,
  TrafficFlowModule as TrafficFlowModuleType,
} from "@tomtom-org/maps-sdk/map";
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

function roadLabel(category: unknown): string {
  if (typeof category !== "string" || !category) return "Road segment";
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} road`;
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
