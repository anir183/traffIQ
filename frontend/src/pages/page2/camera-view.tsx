import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Video, X } from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import {
  cameraById,
  cameraNeighbors,
  cameraPosition,
} from "../../types/ui/adapters";

function CameraViewer() {
  const { cameraId } = useParams<{ cameraId: string }>();
  const { items: cameras, loading } = useCameras();
  const navigate = useNavigate();
  const close = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  if (!cameraId) return null;
  const camera = loading ? undefined : cameraById(cameras, cameraId);
  if (!camera) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 text-slate-200">
        <p className="text-lg font-medium">
          {loading ? "Loading…" : "Camera not found"}
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
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
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold text-slate-100">
            {camera.name}
          </h2>
          <span className="text-sm text-slate-500">·</span>
          <span className="shrink-0 text-xs text-slate-400">
            {camera.circuit}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Live
          </span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close camera view"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Placeholder body */}
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
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-slate-300 transition-colors hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <Video className="h-16 w-16 text-slate-600" />
          <span className="text-base font-medium text-slate-400">
            {camera.name}
          </span>
          <span className="text-sm text-slate-600">No signal</span>
        </div>

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
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-slate-300 transition-colors hover:bg-slate-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 px-6 py-2.5">
        {position !== null && (
          <span className="text-xs text-slate-500">
            {position} / {cameras.length}
          </span>
        )}
        <span className="text-xs text-slate-600">Esc to close</span>
      </div>
    </div>
  );
}

export default CameraViewer;
