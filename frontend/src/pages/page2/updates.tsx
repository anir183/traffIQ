// AnprLog.tsx
import { useState } from 'react'
import './updates.css'

interface AnprEntry {
  id: string
  time: string
  vehicleNumber: string
  camera: string
  vehicleType: 'Car' | 'Truck' | 'Bike' | 'Bus'
  confidence: number
}

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

const TYPE_ICON: Record<AnprEntry['vehicleType'], string> = {
  Car: '🚗',
  Truck: '🚚',
  Bike: '🏍️',
  Bus: '🚌',
}

function AnprLog() {
  const [search, setSearch] = useState('')

  const filtered = ENTRIES.filter((e) =>
    e.vehicleNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='anpr-container'>
      <div className='anpr-search-bar'>
        <input
          className='anpr-search-input'
          type='text'
          placeholder='Search...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className='anpr-filter-btn' aria-label='Filter'>
          ☰
        </button>
      </div>

      <div className='anpr-table-wrapper'>
        <table className='anpr-table'>
          <thead>
            <tr>
              <th></th>
              <th>Time</th>
              <th>Vehicle Number</th>
              <th>Camera</th>
              <th>Vehicle Type</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className='anpr-status-dot' />
                </td>
                <td>{entry.time}</td>
                <td className='anpr-vehicle-number'>{entry.vehicleNumber}</td>
                <td>{entry.camera}</td>
                <td>
                  <span className={`anpr-type-badge anpr-type-${entry.vehicleType.toLowerCase()}`}>
                    {TYPE_ICON[entry.vehicleType]} {entry.vehicleType}
                  </span>
                </td>
                <td>
                  <span className='anpr-confidence-pill'>{entry.confidence}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AnprLog