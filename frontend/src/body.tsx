import './App.css'

import Navigation from '../src/body/navigation'
import Window from '../src/body/window'


function App() {

  return (
    <>

      <div className=' flex flex-row  justify-center items-stretch w-full h-[85%] bodycolour   '>
        <div className='w-[20%] translate-x-4'><Navigation/></div>
        <div className='w-[80%]'><Window/></div>
      </div>
    </>
  )
}

export default App
