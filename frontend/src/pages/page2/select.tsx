import { useState } from 'react'

const NODES = ['Esplanade Circuit', 'Joka Circuit']

function NodeSelector() {
  const [selected, setSelected] = useState(NODES[0])

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Selected node
      </span>
      <div className="relative inline-flex items-center">
        <select
          className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {NODES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 text-xs text-slate-400 dark:text-slate-500">▾</span>
      </div>
    </div>
  )
}

export default NodeSelector