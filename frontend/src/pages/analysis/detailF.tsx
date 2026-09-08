function CriticalIncidents() {
  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-xl bg-slate-800 p-5 text-white shadow-sm xl:w-[20%]">
      <span className="text-base font-semibold">Critical Incidents</span>
      <div className="flex flex-col gap-4 text-base">
        <div className="flex flex-col border-l-2 border-slate-500 pl-3">
          <span className="text-2xl font-bold">2</span>
          <span className="text-sm text-slate-300">Suspicious activities</span>
        </div>
        <div className="flex flex-col border-l-2 border-slate-500 pl-3">
          <span className="text-2xl font-bold">1</span>
          <span className="text-sm text-slate-300">Accident</span>
        </div>
      </div>
    </div>
  )
}

export default CriticalIncidents