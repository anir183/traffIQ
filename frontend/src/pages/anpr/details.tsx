import { useState } from "react";
import { useListPageSize } from "../../hooks/useListPageSize";
import { useVehicleDetail } from "../../hooks/useVehicleDetail";
import { useCameras } from "../../hooks/useCameras";
import {
  cameraById,
  vehicleToDetails,
  vehicleToDetections,
} from "../../types/ui/adapters";
import InlineFetchStatus from "../../components/ui/fetch-status";

export default function VehicleInformation({ plate }: { plate: string }) {
  const { data, loading, error, refetch } = useVehicleDetail(plate);
  const { items: cameras } = useCameras();
  const [page, setPage] = useState(1);

  const details = data
    ? vehicleToDetails(data.vehicle, data.detections.length)
    : [];
  const history = data
    ? vehicleToDetections(
        data.detections,
        (cameraId) => cameraById(cameras, cameraId)?.location ?? "",
      )
    : [];

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 4, max: 12 },
    history.length,
  );

  const totalPages = Math.max(1, Math.ceil(history.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageRecords = history.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        Vehicle Information
      </h3>

      {loading && !data ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Loading&hellip;
        </p>
      ) : !data ? (
        <InlineFetchStatus
          loading={loading}
          hasData={false}
          error={error}
          onRetry={refetch}
          emptyNote="No vehicle found."
        />
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4">
            {details.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {row.value}
                </dd>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Detection History
            </h4>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {history.length} detections
            </span>
          </div>

          <div
            ref={containerRef}
            className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800"
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-2 font-medium" />
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Camera</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Speed</th>
                  <th className="px-3 py-2 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((record) => (
                  <tr
                    key={record.id}
                    data-sm-row
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
                  >
                    <td className="px-3 py-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {record.time}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {record.camera}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {record.location}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {record.speed} km/h
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {record.confidence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageRecords.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No detections found.
              </p>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500">
                Showing {startIndex + 1}–{startIndex + pageRecords.length} of{" "}
                {history.length}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
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
                    ),
                  )}
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
        </>
      )}
    </div>
  );
}
