import './App.css'
import Name from '../src/header/name'
import SelectArea from '../src/header/midsection'
import Details from '../src/header/endsection'
function App() {

  return (
      <div className='flex justify-center items-center w-full h-[10%] bodycolour'>
        <div><Name/></div>
        <div className='flex-1 flex justify-center px-4'><SelectArea/></div>
        <div><Details/></div>
      </div>
  )
}

export default App
