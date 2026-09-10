import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Route, TriangleAlert } from "lucide-react";
import type { Incident, IncidentIcon } from "../../types/traffic";
import StatusBadge from "../../components/ui/badge";
import { useListPageSize } from "../../hooks/useListPageSize";

export type FilterKey = "all" | "active" | "investigating" | "resolved";

const HARDCODED_INCIDENTS: Incident[] = [
  {
    id: "1",
    icon: "alert",
    title: "Blacklisted Vehicle",
    detail: "WB02AM7555",
    location: "Park Street",
    time: "14:28",
    status: "Active",
  },
  {
    id: "2",
    icon: "warning",
    title: "Accident",
    detail: "Multiple vehicles",
    location: "EM Bypass",
    time: "14:15",
    status: "Active",
  },
  {
    id: "3",
    icon: "alert",
    title: "Speed Violation",
    detail: "DLBCAX1234",
    location: "VIP Road",
    time: "13:52",
    status: "Investigating",
  },
  {
    id: "4",
    icon: "wrongway",
    title: "Wrong Way",
    detail: "Unknown Vehicle",
    location: "Sector V",
    time: "13:45",
    status: "Investigating",
  },
  {
    id: "5",
    icon: "wrongway",
    title: "Route Anomaly",
    detail: "MH01AB9876",
    location: "New Town",
    time: "12:30",
    status: "Resolved",
  },
  {
    id: "6",
    icon: "warning",
    title: "Signal Malfunction",
    detail: "Intersection A12",
    location: "Howrah Bridge",
    time: "14:05",
    status: "Active",
  },
  {
    id: "7",
    icon: "alert",
    title: "Blacklisted Vehicle",
    detail: "HR26DD2233",
    location: "Salt Lake",
    time: "14:02",
    status: "Active",
  },
  {
    id: "8",
    icon: "warning",
    title: "Accident",
    detail: "Two-wheeler down",
    location: "AJC Bose Road",
    time: "13:40",
    status: "Investigating",
  },
  {
    id: "9",
    icon: "alert",
    title: "Speed Violation",
    detail: "WB01BB5566",
    location: "Kona Expressway",
    time: "13:31",
    status: "Investigating",
  },
  {
    id: "10",
    icon: "warning",
    title: "Road Construction",
    detail: "Lane closure",
    location: "Ballygunge",
    time: "12:15",
    status: "Resolved",
  },
  {
    id: "11",
    icon: "warning",
    title: "Signal Malfunction",
    detail: "Intersection B7",
    location: "Park Circus",
    time: "11:58",
    status: "Resolved",
  },
  {
    id: "12",
    icon: "wrongway",
    title: "Wrong Way",
    detail: "Unknown Vehicle",
    location: "Dhakuria",
    time: "13:58",
    status: "Active",
  },
  {
    id: "13",
    icon: "wrongway",
    title: "Route Anomaly",
    detail: "MH02CX8899",
    location: "City Centre",
    time: "13:20",
    status: "Investigating",
  },
  {
    id: "14",
    icon: "warning",
    title: "Accident",
    detail: "Minor collision",
    location: "Ruby More",
    time: "11:30",
    status: "Resolved",
  },
  {
    id: "15",
    icon: "alert",
    title: "Speed Violation",
    detail: "DL4MA9900",
    location: "Ballygunge Phari",
    time: "13:50",
    status: "Active",
  },
];

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
  const [page, setPage] = useState(1);
  const [prevFilter, setPrevFilter] = useState(filter);

  if (prevFilter !== filter) {
    setPrevFilter(filter);
    setPage(1);
  }

  const incidents = useMemo(() => {
    const status = FILTER_MAP[filter];
    if (!status) return HARDCODED_INCIDENTS;
    return HARDCODED_INCIDENTS.filter((incident) => incident.status === status);
  }, [filter]);

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
        <p className="flex-1 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No incidents match this filter.
        </p>
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
