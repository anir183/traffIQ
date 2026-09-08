const CAMERAS = ['CAM_001', 'CAM_002', 'CAM_003', 'CAM_004']

function CameraView({ name }: { name: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900">
      <svg
        className="h-8 w-8 text-slate-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" />
        <rect x="3" y="6" width="14" height="12" rx="2" />
      </svg>
      <span className="text-sm font-medium text-slate-300">{name}</span>
      <span className="text-xs text-slate-500">No signal</span>
    </div>
  )
}

export default function Feed() {
  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Camera Feed</h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
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
  )
}