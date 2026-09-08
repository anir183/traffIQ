import './name.css'
import './tailwind.css'
function App(){
    return (<div className='flex flex-row w-full items-center justify-center gap-18 '>
    <input type="text"
    placeholder='Search...'
    className='w-[40%]!  border text-2xl h-12 px-22! rounded-full focus:outline-none focus:border-emerald-400 '
     />

    </div>)

}
export default App