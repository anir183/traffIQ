interface CameraCount {
  camera: string;
  count: number;
}

// Hardcoded camera-wise vehicle count data
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
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Camera-wise Vehicle Count
        </h3>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Total Vehicles
          <span className="text-gray-400">▾</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {DATA.map((row) => {
          const widthPct = (row.count / MAX_COUNT) * 100;
          return (
            <div key={row.camera}>
              <span className="text-sm text-gray-500 mb-1 block">
                {row.camera}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
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