interface CameraCount {
  camera: string;
  count: number;
}

const DATA: CameraCount[] = [
  { camera: "CAM_001", count: 18234 },
  { camera: "CAM_002", count: 15621 },
  { camera: "CAM_003", count: 14982 },
  { camera: "CAM_004", count: 12450 },
  { camera: "CAM_005", count: 10321 },
];

const MAX_COUNT = Math.max(...DATA.map((d) => d.count));

export default function CameraVehicleCount() {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Camera-wise Vehicle Count
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {DATA.map((row) => {
          const widthPct = (row.count / MAX_COUNT) * 100;
          return (
            <div key={row.camera}>
              <span className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
                {row.camera}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
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
