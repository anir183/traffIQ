import { useState } from 'react'
import type { AnprEntry, VehicleType } from '../../types/traffic'

const ENTRIES: AnprEntry[] = [
  { id: '1', time: '14:32:18', vehicleNumber: 'WB02AM7555', camera: 'CAM_001', vehicleType: 'Car', confidence: 92 },
  { id: '2', time: '14:32:17', vehicleNumber: 'DL8CAX1234', camera: 'CAM_003', vehicleType: 'Truck', confidence: 88 },
  { id: '3', time: '14:32:15', vehicleNumber: 'MH01AB9876', camera: 'CAM_002', vehicleType: 'Bike', confidence: 85 },
  { id: '4', time: '14:32:14', vehicleNumber: 'WB20CD4567', camera: 'CAM_004', vehicleType: 'Car', confidence: 91 },
  { id: '5', time: '14:32:12', vehicleNumber: 'KA05MN4321', camera: 'CAM_001', vehicleType: 'Bus', confidence: 87 },
  { id: '6', time: '14:32:10', vehicleNumber: 'AS012X7788', camera: 'CAM_002', vehicleType: 'Car', confidence: 90 },
  { id: '7', time: '14:32:08', vehicleNumber: 'BR06PQ1122', camera: 'CAM_003', vehicleType: 'Bike', confidence: 83 },
  { id: '8', time: '14:32:06', vehicleNumber: 'WB12XY9999', camera: 'CAM_004', vehicleType: 'Truck', confidence: 86 },
  { id: '9', time: '14:32:04', vehicleNumber: 'OD02KL3344', camera: 'CAM_001', vehicleType: 'Car', confidence: 89 },
  { id: '10', time: '14:32:02', vehicleNumber: 'RJ14AB2211', camera: 'CAM_002', vehicleType: 'Bike', confidence: 84 },
]

const TYPE_STYLE: Record<VehicleType, { bg: string; fg: string; icon: string }> = {
  Car: { bg: 'bg-blue-50 dark:bg-blue-500/10', fg: 'text-blue-700 dark:text-blue-400', icon: '🚗' },
  Truck: { bg: 'bg-red-50 dark:bg-red-500/10', fg: 'text-red-700 dark:text-red-400', icon: '🚚' },
  Bike: { bg: 'bg-green-50 dark:bg-green-500/10', fg: 'text-green-700 dark:text-green-400', icon: '🏍️' },
  Bus: { bg: 'bg-amber-50 dark:bg-amber-500/10', fg: 'text-amber-700 dark:text-amber-400', icon: '🚌' },
}

function AnprLog() {
  const [search, setSearch] = useState('')

  const filtered = ENTRIES.filter((e) =>
    e.vehicleNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
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
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                <td className="px-2 py-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                </td>
                <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{entry.time}</td>
                <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-200">{entry.vehicleNumber}</td>
                <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{entry.camera}</td>
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
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No vehicles found.</p>
        )}
      </div>
    </div>
  )
}

export default AnprLog