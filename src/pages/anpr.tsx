
import './tailwind.css'
import './anpr.css'
import Search from '../pages/anpr/search'
import Details from '../pages/anpr/details'
import Map from '../pages/anpr/map'
const anpr = () => {
  return (
    <div className='flex flex-col justify-center gap-10'>
      <div className='flex flex-row justify-center items-center gap-3 mt-2! pt-2!'>
        <span className='circle1'></span>
        <h2 className='text-[35px]'>ANPR INTELLIGENCE</h2>

      </div>
      <h3 className='flex flex-row justify-center items-center text-[20px]'>SEARCH VEHICLES BY THEIR NUMBER PLATE OR NODAL CAMERA </h3>
      <div className='flex flex-row justify-center items-center gap-8'>
        <Search/>
      </div>
      <div className='flex flex-row justify-center items-center gap-8 p-8!'>
        <Details/>
        <Map/>
      </div>
    </div>
  )
}

export default anpr