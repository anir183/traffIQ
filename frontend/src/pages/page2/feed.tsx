import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Maximize2, Video } from "lucide-react";
import { useListPageSize } from "../../hooks/useListPageSize";
import { useCameras } from "../../hooks/useCameras";
import InlineFetchStatus from "../../components/ui/fetch-status";
import Pagination from "../../components/ui/pagination";
import { LiveFeedCanvas } from "../../components/camera/LiveFeedCanvas";
import type { CameraMeta } from "../../types/contract/camera";

const COLS = 2;
const SNAPSHOT_REFRESH_MS = 12_000;

function bustUrl(url: string, tick: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}t=${tick}`;
}

function CameraView({ camera }: { camera: CameraMeta }) {
  const [tick, setTick] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const snapshotUrl =
    camera.stream_type === "snapshot" && camera.stream_url
      ? camera.stream_url
      : undefined;
  const hasFeed = !!snapshotUrl || camera.stream_type === "procedural";

  useEffect(() => {
    if (!snapshotUrl) return;
    const timer = setInterval(() => setTick((t) => t + 1), SNAPSHOT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [snapshotUrl]);

  const simulatedThumb = (
    <LiveFeedCanvas
      cameraId={camera.camera_id}
      name={camera.name}
      latitude={camera.latitude}
      longitude={camera.longitude}
      animated={false}
      className="absolute inset-0 h-full w-full"
    />
  );

  const thumb =
    snapshotUrl && !imgFailed ? (
      <img
        src={bustUrl(snapshotUrl, tick)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setImgFailed(true)}
      />
    ) : null;

  return (
    <NavLink
      to={`/feed/cam/${camera.camera_id}`}
      data-sm-row
      className="group relative flex h-56 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/80"
    >
      <Maximize2
        className="absolute top-2 right-2 z-10 h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500"
        aria-hidden="true"
      />

      {hasFeed ? (
        <>
          {thumb ?? simulatedThumb}
          <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
            <span className="block truncate text-sm font-medium text-white">
              {camera.name}
            </span>
            <span className="block truncate text-xs text-slate-300">
              {camera.circuit}
            </span>
          </div>
        </>
      ) : (
        <>
          <Video
            className="h-8 w-8 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {camera.name}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {camera.circuit}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Feed() {
  const { items: cameras, loading, error, refetch } = useCameras();
  const [page, setPage] = useState(1);

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 2 },
    cameras.length,
  );

  const tilesPerPage = rowsPerPage * COLS;
  const totalPages = Math.max(1, Math.ceil(cameras.length / tilesPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * tilesPerPage;
  const pageCameras = cameras.slice(startIndex, startIndex + tilesPerPage);
  const liveCount = cameras.filter((c) => c.stream_type).length;

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Camera Feed
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {loading && cameras.length === 0
            ? "Loading\u2026"
            : liveCount > 0
              ? `${liveCount} live · ${cameras.length} cameras`
              : `${cameras.length} cameras`}
        </span>
      </div>

      <div
        ref={containerRef}
        className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-hidden"
      >
        {pageCameras.map((camera) => (
          <CameraView key={camera.camera_id} camera={camera} />
        ))}
      </div>

      {cameras.length === 0 && (
        <InlineFetchStatus
          loading={loading}
          hasData={cameras.length > 0}
          error={error}
          onRetry={refetch}
          emptyNote="No cameras configured."
        />
      )}

      {cameras.length > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">
            Showing {startIndex + 1}–{startIndex + pageCameras.length} of{" "}
            {cameras.length}
          </span>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
