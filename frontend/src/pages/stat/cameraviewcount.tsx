import { CAMERAS } from "../page2/cameraData";

interface CameraCountRow {
  id: string;
  count: number;
}

const ROWS: CameraCountRow[] = CAMERAS.map((cam, i) => ({
  id: cam.id,
  count: 18500 - i * 310 + ((i * 37) % 900),
})).sort((a, b) => b.count - a.count);

const MAX_COUNT = Math.max(...ROWS.map((row) => row.count));

export default function CameraVehicleCount() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Camera-wise Vehicle Count
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {ROWS.length} cameras
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {ROWS.map((row) => {
          const widthPct = (row.count / MAX_COUNT) * 100;
          return (
            <div key={row.id}>
              <span className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
                {row.id}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                  {row.count.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
