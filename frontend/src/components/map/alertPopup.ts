import type { Alert, AlertSeverity } from "../../types/contract/alert";
import { alertTypeLabel, formatUtcDateTime } from "../../types/ui/adapters";

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#22c55e",
};

function row(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "mt-1 flex justify-between gap-3 text-xs";
  const labelEl = document.createElement("span");
  labelEl.className = "shrink-0 text-slate-600";
  labelEl.textContent = label;
  const valueEl = document.createElement("span");
  valueEl.className = "text-right font-medium text-slate-800";
  valueEl.textContent = value;
  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

export function buildAlertPopup(alert: Alert): HTMLElement {
  const container = document.createElement("div");
  container.className = "w-64 px-1.5 py-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-slate-900";
  title.textContent = alert.title;
  container.appendChild(title);

  const meta = document.createElement("p");
  meta.className =
    "mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700";
  const dot = document.createElement("span");
  dot.className = "h-2 w-2 rounded-full";
  dot.style.backgroundColor = SEVERITY_COLORS[alert.severity] ?? "#94a3b8";
  const label = document.createElement("span");
  label.textContent = `${alert.severity[0].toUpperCase()}${alert.severity.slice(1)} · ${alertTypeLabel(alert.type)}`;
  meta.appendChild(dot);
  meta.appendChild(label);
  container.appendChild(meta);

  if (alert.detail) {
    const detail = document.createElement("p");
    detail.className = "mt-1.5 text-xs leading-snug text-slate-700";
    detail.textContent = alert.detail;
    container.appendChild(detail);
  }

  if (alert.location.label) {
    container.appendChild(row("Location", alert.location.label));
  }
  container.appendChild(row("Detected", formatUtcDateTime(alert.detected_at)));
  container.appendChild(row("Status", alert.status));
  if (alert.involved_plate) {
    container.appendChild(row("Plate", alert.involved_plate));
  }

  return container;
}
