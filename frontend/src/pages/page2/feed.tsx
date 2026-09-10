import { Video } from "lucide-react";

const CAMERAS = ["CAM_001", "CAM_002", "CAM_003", "CAM_004"];

function CameraView({ name }: { name: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 dark:border-slate-600 dark:bg-slate-800">
      <Video
        className="h-8 w-8 text-slate-600 dark:text-slate-400"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-300 dark:text-slate-200">
        {name}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        No signal
      </span>
    </div>
  );
}

export default function Feed() {
  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Camera Feed
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Live preview placeholder
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CAMERAS.map((name) => (
          <CameraView key={name} name={name} />
        ))}
      </div>
    </div>
  );
}
