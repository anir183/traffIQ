import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Bell, Route, TriangleAlert } from "lucide-react";
import type { Incident, IncidentIcon } from "../types/traffic";
import {
  activeAlertCount,
  activeAlerts,
  alertToIncident,
} from "../types/ui/adapters";
import { useAlerts } from "../hooks/useAlerts";
import StatusBadge from "../components/ui/badge";

const ICON_STYLES: Record<
  IncidentIcon,
  { bg: string; fg: string; Icon: LucideIcon }
> = {
  alert: { bg: "bg-red-50", fg: "text-red-600", Icon: TriangleAlert },
  warning: { bg: "bg-amber-50", fg: "text-amber-600", Icon: TriangleAlert },
  wrongway: { bg: "bg-amber-50", fg: "text-amber-600", Icon: Route },
};

const MAX_ITEMS = 6;

function NotificationItem({ incident }: { incident: Incident }) {
  const { bg, fg, Icon } = ICON_STYLES[incident.icon];

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {incident.title}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {incident.detail} · {incident.location}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {incident.time}
        </span>
        <StatusBadge status={incident.status} />
      </div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { items: alerts } = useAlerts();

  const activeCount = activeAlertCount(alerts);
  const recent = activeAlerts(alerts, MAX_ITEMS).map(alertToIncident);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const goToIncidents = () => {
    setOpen(false);
    navigate("/incident");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <span className="relative block h-6 w-6">
          <Bell size={24} />
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {activeCount} active
            </span>
          </div>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {recent.map((incident) => (
              <NotificationItem key={incident.id} incident={incident} />
            ))}
            {recent.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No active incidents.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={goToIncidents}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-slate-800"
          >
            Show all incidents
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
