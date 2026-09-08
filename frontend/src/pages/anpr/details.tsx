const rows = [
  { label: 'Plate Number', value: 'WB02AM7555' },
  { label: 'Vehicle Type', value: 'Car' },
  { label: 'Make / Model', value: 'Maruti Swift' },
  { label: 'First Seen', value: '06 Sep 2026, 14:30:02' },
  { label: 'Last Seen', value: '06 Sep 2026, 14:47:56' },
  { label: 'Total Detections', value: '3' },
]

export default function VehicleInformation() {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Vehicle Information</h3>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex text-sm">
            <dt className="w-32 shrink-0 text-slate-500">{row.label}</dt>
            <dd className="text-slate-800">{row.value}</dd>
          </div>
        ))}
        <div className="flex items-center text-sm">
          <dt className="w-32 shrink-0 text-slate-500">Status</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-0.5 text-xs font-medium text-green-700">
              Normal
            </span>
          </dd>
        </div>
      </dl>
    </div>
  )
}