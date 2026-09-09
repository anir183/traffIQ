import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Route, TriangleAlert } from "lucide-react";
import type { Incident, IncidentIcon } from "../../types/traffic";
import StatusBadge from "../../components/ui/badge";
import { useListPageSize } from "../../hooks/useListPageSize";
import { useAlerts } from "../../hooks/useAlerts";
import { alertToIncident, triageAlerts } from "../../types/ui/adapters";
import InlineFetchStatus from "../../components/ui/fetch-status";

export type FilterKey = "all" | "active" | "investigating" | "resolved";

const ICON_STYLES: Record<
  IncidentIcon,
  { bg: string; fg: string; Icon: LucideIcon }
> = {
  alert: { bg: "bg-red-50", fg: "text-red-600", Icon: TriangleAlert },
  warning: { bg: "bg-amber-50", fg: "text-amber-600", Icon: TriangleAlert },
  wrongway: { bg: "bg-amber-50", fg: "text-amber-600", Icon: Route },
};

const FILTER_MAP: Record<FilterKey, Incident["status"] | undefined> = {
  all: undefined,
  active: "Active",
  investigating: "Investigating",
  resolved: "Resolved",
};

function IncidentRow({ incident }: { incident: Incident }) {
  const { bg, fg, Icon } = ICON_STYLES[incident.icon];

  return (
    <div data-sm-row className="flex items-start gap-3 p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {incident.title}
        </p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
          {incident.detail}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {incident.location}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {incident.time}
        </span>
        <StatusBadge status={incident.status} />
      </div>
    </div>
  );
}

export default function RecentIncidents({
  filter = "all",
}: {
  filter?: FilterKey;
}) {
  const { items: alerts, loading, error, refetch } = useAlerts();
  const [page, setPage] = useState(1);
  const [prevFilter, setPrevFilter] = useState(filter);

  if (prevFilter !== filter) {
    setPrevFilter(filter);
    setPage(1);
  }

  const incidents = useMemo(() => {
    const source = triageAlerts(alerts).map(alertToIncident);
    const status = FILTER_MAP[filter];
    if (!status) return source;
    return source.filter((incident) => incident.status === status);
  }, [alerts, filter]);

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 4, max: 12 },
    incidents.length,
  );

  const totalPages = Math.max(1, Math.ceil(incidents.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageItems = incidents.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex w-full max-w-sm min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-1 shrink-0 pl-2 pt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
        Recent Incidents
      </h3>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800"
      >
        {pageItems.map((incident) => (
          <IncidentRow key={incident.id} incident={incident} />
        ))}
      </div>
      {incidents.length === 0 && (
        <InlineFetchStatus
          loading={loading}
          hasData={incidents.length > 0}
          error={error}
          onRetry={refetch}
          emptyNote="No incidents match this filter."
        />
      )}

      {incidents.length > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">
            Showing {startIndex + 1}–{startIndex + pageItems.length} of{" "}
            {incidents.length}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-6 w-6 rounded-full text-xs transition-colors ${
                    p === safePage
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
