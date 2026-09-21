import type { AlertSeverity } from "../contract/alert";

export const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; color: string }
> = {
  high: { label: "High", color: "#dc2626" },
  medium: { label: "Medium", color: "#f97316" },
  low: { label: "Low", color: "#22c55e" },
};

export const SEVERITY_ORDER: AlertSeverity[] = ["high", "medium", "low"];
