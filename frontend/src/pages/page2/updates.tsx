import { useState } from "react";
import type { AnprEntry, VehicleType } from "../../types/traffic";
import { useListPageSize } from "../../hooks/useListPageSize";

const ENTRIES: AnprEntry[] = [
  {
    id: "1",
    time: "14:32:18",
    vehicleNumber: "WB02AM7555",
    camera: "CAM_001",
    vehicleType: "Car",
    confidence: 92,
  },
  {
    id: "2",
    time: "14:32:17",
    vehicleNumber: "DL8CAX1234",
    camera: "CAM_003",
    vehicleType: "Truck",
    confidence: 88,
  },
  {
    id: "3",
    time: "14:32:15",
    vehicleNumber: "MH01AB9876",
    camera: "CAM_002",
    vehicleType: "Bike",
    confidence: 85,
  },
  {
    id: "4",
    time: "14:32:14",
    vehicleNumber: "WB20CD4567",
    camera: "CAM_004",
    vehicleType: "Car",
    confidence: 91,
  },
  {
    id: "5",
    time: "14:32:12",
    vehicleNumber: "KA05MN4321",
    camera: "CAM_001",
    vehicleType: "Bus",
    confidence: 87,
  },
  {
    id: "6",
    time: "14:32:10",
    vehicleNumber: "AS012X7788",
    camera: "CAM_002",
    vehicleType: "Car",
    confidence: 90,
  },
  {
    id: "7",
    time: "14:32:08",
    vehicleNumber: "BR06PQ1122",
    camera: "CAM_003",
    vehicleType: "Bike",
    confidence: 83,
  },
  {
    id: "8",
    time: "14:32:06",
    vehicleNumber: "WB12XY9999",
    camera: "CAM_004",
    vehicleType: "Truck",
    confidence: 86,
  },
  {
    id: "9",
    time: "14:32:04",
    vehicleNumber: "OD02KL3344",
    camera: "CAM_001",
    vehicleType: "Car",
    confidence: 89,
  },
  {
    id: "10",
    time: "14:32:02",
    vehicleNumber: "RJ14AB2211",
    camera: "CAM_002",
    vehicleType: "Bike",
    confidence: 84,
  },
  {
    id: "11",
    time: "14:31:58",
    vehicleNumber: "TN09CV6677",
    camera: "CAM_003",
    vehicleType: "Truck",
    confidence: 90,
  },
  {
    id: "12",
    time: "14:31:55",
    vehicleNumber: "GJ01DR8899",
    camera: "CAM_004",
    vehicleType: "Car",
    confidence: 87,
  },
  {
    id: "13",
    time: "14:31:52",
    vehicleNumber: "WB05ES2233",
    camera: "CAM_001",
    vehicleType: "Bus",
    confidence: 88,
  },
  {
    id: "14",
    time: "14:31:49",
    vehicleNumber: "PB10FT4455",
    camera: "CAM_002",
    vehicleType: "Car",
    confidence: 91,
  },
  {
    id: "15",
    time: "14:31:47",
    vehicleNumber: "UP32GU6677",
    camera: "CAM_003",
    vehicleType: "Bike",
    confidence: 82,
  },
  {
    id: "16",
    time: "14:31:44",
    vehicleNumber: "HR26HV8899",
    camera: "CAM_004",
    vehicleType: "Truck",
    confidence: 85,
  },
  {
    id: "17",
    time: "14:31:40",
    vehicleNumber: "TS09JD1122",
    camera: "CAM_001",
    vehicleType: "Car",
    confidence: 93,
  },
  {
    id: "18",
    time: "14:31:37",
    vehicleNumber: "KL07KG3344",
    camera: "CAM_002",
    vehicleType: "Bus",
    confidence: 86,
  },
  {
    id: "19",
    time: "14:31:34",
    vehicleNumber: "WB18LH5566",
    camera: "CAM_003",
    vehicleType: "Car",
    confidence: 89,
  },
  {
    id: "20",
    time: "14:31:31",
    vehicleNumber: "AP09MJ7788",
    camera: "CAM_004",
    vehicleType: "Bike",
    confidence: 84,
  },
  {
    id: "21",
    time: "14:31:27",
    vehicleNumber: "MP04NK9900",
    camera: "CAM_001",
    vehicleType: "Truck",
    confidence: 88,
  },
  {
    id: "22",
    time: "14:31:24",
    vehicleNumber: "DL3CPN1122",
    camera: "CAM_002",
    vehicleType: "Car",
    confidence: 90,
  },
  {
    id: "23",
    time: "14:31:21",
    vehicleNumber: "CG04PR3344",
    camera: "CAM_003",
    vehicleType: "Car",
    confidence: 86,
  },
  {
    id: "24",
    time: "14:31:18",
    vehicleNumber: "WB22QS5566",
    camera: "CAM_004",
    vehicleType: "Bus",
    confidence: 87,
  },
  {
    id: "25",
    time: "14:31:14",
    vehicleNumber: "JH05RT7788",
    camera: "CAM_001",
    vehicleType: "Bike",
    confidence: 83,
  },
  {
    id: "26",
    time: "14:31:11",
    vehicleNumber: "UK08SU9900",
    camera: "CAM_002",
    vehicleType: "Car",
    confidence: 92,
  },
  {
    id: "27",
    time: "14:31:08",
    vehicleNumber: "WB06TV1122",
    camera: "CAM_003",
    vehicleType: "Truck",
    confidence: 85,
  },
  {
    id: "28",
    time: "14:31:05",
    vehicleNumber: "DL5CV3344",
    camera: "CAM_004",
    vehicleType: "Car",
    confidence: 88,
  },
];

const TYPE_STYLE: Record<
  VehicleType,
  { bg: string; fg: string; icon: string }
> = {
  Car: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    fg: "text-blue-700 dark:text-blue-400",
    icon: "🚗",
  },
  Truck: {
    bg: "bg-red-50 dark:bg-red-500/10",
    fg: "text-red-700 dark:text-red-400",
    icon: "🚚",
  },
  Bike: {
    bg: "bg-green-50 dark:bg-green-500/10",
    fg: "text-green-700 dark:text-green-400",
    icon: "🏍️",
  },
  Bus: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    fg: "text-amber-700 dark:text-amber-400",
    icon: "🚌",
  },
};

function AnprLog() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = ENTRIES.filter((e) =>
    e.vehicleNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 5, max: 15 },
    filtered.length,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + rowsPerPage);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="flex w-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-auto"
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-2 py-2.5 font-medium" />
              <th className="px-2 py-2.5 font-medium">Time</th>
              <th className="px-2 py-2.5 font-medium">Vehicle Number</th>
              <th className="px-2 py-2.5 font-medium">Camera</th>
              <th className="px-2 py-2.5 font-medium">Vehicle Type</th>
              <th className="px-2 py-2.5 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((entry) => (
              <tr
                key={entry.id}
                data-sm-row
                className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
              >
                <td className="px-2 py-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                </td>
                <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                  {entry.time}
                </td>
                <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-200">
                  {entry.vehicleNumber}
                </td>
                <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                  {entry.camera}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[entry.vehicleType].bg} ${TYPE_STYLE[entry.vehicleType].fg}`}
                  >
                    {TYPE_STYLE[entry.vehicleType].icon} {entry.vehicleType}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                    {entry.confidence}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No vehicles found.
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">
            Showing {startIndex + 1}–{startIndex + pageItems.length} of{" "}
            {filtered.length}
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

export default AnprLog;
