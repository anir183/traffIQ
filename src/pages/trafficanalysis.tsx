import './tailwind.css'
import Analysis from './analysis/detailF'
import Charts from './analysis/stataf'
import DensityData from './analysis/densityforecast'
import Map from './analysis/mapp'
import Incident from './analysis/incident-queue'

const trafficanalysis = () => {
  return (
    <div className='flex flex-col justify-start pr-4! h-full'>
        <div className='flex h-[30%] flex-row mt-4! gap-2'>
            <Analysis/>
            <Charts/>
            <DensityData/>
        </div>
        <div className='traffic-details h-[70%] w-full flex flex-row gap-18'>
            <Map/>
            <Incident/>
        </div>
    </div>
  )
}

export default trafficanalysis