import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Maximize2, Video } from "lucide-react";
import { useListPageSize } from "../../hooks/useListPageSize";
import { CAMERAS } from "./cameraData";

const COLS = 2;

function CameraView({
  id,
  name,
  circuit,
}: {
  id: string;
  name: string;
  circuit: string;
}) {
  return (
    <NavLink
      to={`/feed/cam/${id}`}
      data-sm-row
      className="group relative flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/80"
    >
      <Maximize2
        className="absolute top-2 right-2 h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500"
        aria-hidden="true"
      />
      <Video
        className="h-8 w-8 text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {name}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {circuit}
      </span>
    </NavLink>
  );
}

export default function Feed() {
  const [page, setPage] = useState(1);

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 2, max: 8 },
    CAMERAS.length,
  );

  const tilesPerPage = rowsPerPage * COLS;
  const totalPages = Math.max(1, Math.ceil(CAMERAS.length / tilesPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * tilesPerPage;
  const pageCameras = CAMERAS.slice(startIndex, startIndex + tilesPerPage);

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Camera Feed
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {CAMERAS.length} cameras
        </span>
      </div>

      <div
        ref={containerRef}
        className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto"
      >
        {pageCameras.map((cam) => (
          <CameraView key={cam.id} {...cam} />
        ))}
      </div>

      {CAMERAS.length > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">
            Showing {startIndex + 1}–{startIndex + pageCameras.length} of{" "}
            {CAMERAS.length}
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
