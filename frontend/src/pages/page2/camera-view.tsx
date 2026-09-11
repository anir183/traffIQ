import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Video, X } from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import {
  cameraById,
  cameraNeighbors,
  cameraPosition,
} from "../../types/ui/adapters";
import InlineFetchStatus from "../../components/ui/fetch-status";
import { LiveFeedCanvas } from "../../components/camera/LiveFeedCanvas";
import type { CameraMeta } from "../../types/contract/camera";

const SNAPSHOT_REFRESH_MS = 12_000;

function bustUrl(url: string, tick: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}t=${tick}`;
}

function FeedPane({ camera }: { camera: CameraMeta }) {
  const snapshotUrl =
    camera.stream_type === "snapshot" && camera.stream_url
      ? camera.stream_url
      : undefined;
  const [snapshotTick, setSnapshotTick] = useState(0);
  const [snapshotFailed, setSnapshotFailed] = useState(false);

  useEffect(() => {
    if (!snapshotUrl) return;
    const timer = setInterval(
      () => setSnapshotTick((t) => t + 1),
      SNAPSHOT_REFRESH_MS,
    );
    return () => clearInterval(timer);
  }, [snapshotUrl]);

  if (!camera.stream_type) {
    return (
      <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900">
        <Video className="h-16 w-16 text-slate-600" aria-hidden="true" />
        <span className="text-base font-medium text-slate-300">
          {camera.name}
        </span>
        <span className="text-sm text-slate-500">No signal</span>
      </div>
    );
  }

  const simulated = (
    <div className="h-full w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      <LiveFeedCanvas
        cameraId={camera.camera_id}
        name={camera.name}
        latitude={camera.latitude}
        longitude={camera.longitude}
        className="h-full w-full"
      />
    </div>
  );

  return snapshotUrl && !snapshotFailed ? (
    <img
      key={snapshotTick}
      src={bustUrl(snapshotUrl, snapshotTick)}
      alt={`${camera.name} live feed`}
      onError={() => setSnapshotFailed(true)}
      className="max-h-full max-w-full rounded-2xl border border-slate-800 object-contain shadow-2xl"
    />
  ) : (
    simulated
  );
}

function CameraViewer() {
  const { cameraId } = useParams<{ cameraId: string }>();
  const { items: cameras, loading, error, refetch } = useCameras();
  const navigate = useNavigate();
  const close = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const feedCamera = cameraId
    ? loading
      ? undefined
      : cameraById(cameras, cameraId)
    : undefined;

  if (!cameraId) return null;
  const camera = feedCamera;
  if (!camera) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 text-slate-700 dark:bg-slate-950/95 dark:text-slate-200">
        <InlineFetchStatus
          loading={loading}
          hasData={false}
          error={error}
          onRetry={refetch}
          emptyNote="Camera not found"
        />
        <button
          type="button"
          onClick={close}
          className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Go back
        </button>
      </div>
    );
  }

  const neighbors = cameraNeighbors(cameras, cameraId);
  const position = cameraPosition(cameras, cameraId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${camera.name} camera view`}
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {camera.name}
          </h2>
          <span className="text-sm text-slate-400 dark:text-slate-600">·</span>
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {camera.circuit}
          </span>
          {camera.stream_type ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Live
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Offline
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close camera view"
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Feed body */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-6">
        {/* Prev */}
        {neighbors && (
          <button
            type="button"
            onClick={() =>
              navigate(`/feed/cam/${neighbors.prev.camera_id}`, {
                replace: true,
              })
            }
            aria-label={`Previous camera: ${neighbors.prev.name}`}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <FeedPane key={camera.camera_id} camera={camera} />

        {/* Next */}
        {neighbors && (
          <button
            type="button"
            onClick={() =>
              navigate(`/feed/cam/${neighbors.next.camera_id}`, {
                replace: true,
              })
            }
            aria-label={`Next camera: ${neighbors.next.name}`}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        {position !== null && (
          <span className="text-xs text-slate-500">
            {position} / {cameras.length}
          </span>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-600">
          Esc to close
        </span>
      </div>
    </div>
  );
}

export default CameraViewer;
