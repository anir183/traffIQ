import { useState } from "react";
import type { IncidentEvent, IncidentEventStatus } from "../../types/traffic";
import { useListPageSize } from "../../hooks/useListPageSize";
import { useAlerts } from "../../hooks/useAlerts";
import {
  alertToEventStream,
  incidentStreamAlerts,
} from "../../types/ui/adapters";
import InlineFetchStatus from "../../components/ui/fetch-status";
import Pagination from "../../components/ui/pagination";

const STATUS_ICON: Record<IncidentEventStatus, string> = {
  error: "✕",
  success: "✓",
  neutral: "•",
  warning: "!",
};

const STATUS_STYLE: Record<IncidentEventStatus, string> = {
  error: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  success:
    "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  neutral: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

function IncidentQueue() {
  const { items: alerts, loading, error, refetch } = useAlerts();
  const items: IncidentEvent[] =
    incidentStreamAlerts(alerts).map(alertToEventStream);
  const [page, setPage] = useState(1);
  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 3 },
    items.length,
  );
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const pageItems = items.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="flex w-full shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[28%] dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Event Stream
        </span>
        <button
          type="button"
          className="text-slate-400 dark:text-slate-500"
          aria-label="More options"
        >
          ⋮
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100 overflow-hidden dark:divide-slate-800"
      >
        {pageItems.map((item) => (
          <div key={item.id} data-sm-row className="flex gap-3 py-2">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${STATUS_STYLE[item.status]}`}
            >
              {STATUS_ICON[item.status]}
            </span>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate text-[13px] leading-4 font-medium text-slate-800 dark:text-slate-200">
                  {item.title}
                </span>
                {item.timestamp && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                    {item.timestamp}
                  </span>
                )}
              </div>
              <div className="truncate text-xs leading-4 text-slate-500 dark:text-slate-400">
                {item.location}
              </div>
              <div className="truncate text-xs leading-4 text-slate-500 dark:text-slate-400">
                {item.detailLine} :{" "}
                <a href="#" className="text-blue-600 underline">
                  {item.linkText}
                </a>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <InlineFetchStatus
            loading={loading}
            hasData={items.length > 0}
            error={error}
            onRetry={refetch}
            emptyNote="No incidents to show."
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-auto flex items-center justify-center pt-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default IncidentQueue;
