// NodeSelector.tsx
import { useState } from 'react'
import './select.css'

const NODES = ['Esplanade Circuit', 'Joka Circuit']

function NodeSelector() {
  const [selected, setSelected] = useState(NODES[0])

  return (
    <div className='node-selector'>
      <span className='node-selector-label'>Selected node</span>
      <div className='node-selector-dropdown'>
        <select
          className='node-selector-select'
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {NODES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <span className='node-selector-arrow'>▾</span>
      </div>
    </div>
  )
}

export default NodeSelector