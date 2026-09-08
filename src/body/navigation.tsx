import './tailwind.css'
import './body.css'
function App() {

  return (
      <div className=' flex flex-col h-full  items-start justify-start w-[80%] rounded-3xl  pt-8! nav z-1000'>
            <span className='heading-nav'>NAVIGATION</span>
            <hr className="my-4 border-t-1 border-slate-300 w-[30%]" />
            <div className='button-nav pt-4! flex flex-col gap-4 pb-4! justify-center items-start!'>
                <div className='options flex flex-row  justify-center items-center'>
                    <a href="/"><span></span> <pre>Overview</pre></a></div>
                <div className='options flex flex-row justify-center items-center'><a href="/feed"><span></span><pre>LIVE FEED</pre></a></div>
                <div className='options flex flex-row justify-center items-center'><a href="/anpr"><span></span><pre>ANPR INTELLIGENCE</pre></a></div>
                <div className='options flex flex-row justify-center items-center'><a href="/incident"><span></span> <pre>Incident Management</pre> </a></div>
                <div className='options flex flex-row justify-center items-center'><a href="/analysis"><span></span> <pre>Traffic Analysis</pre> </a></div>

            </div>
            {/* <span className='heading-nav'> SYSTEM ADMINISTRATION </span>
            <hr className="my-4 border-t-1 border-slate-300 w-[50%]" />
            <div className='button-nav pt-4! flex flex-col gap-4  justify-center items-start!'>
                <div className='options flex flex-row justify-center items-center'><a href="/logs"><span></span> <pre>SHOW LOGS</pre> </a></div>
                <div className='options flex flex-row justify-center items-center'><a href="/admin"><span></span> <pre>ADMIN PANEL</pre> </a></div>
            </div> */}
            <div className='mt-auto! footer '>
                <span className='flex flex-row items-center gap-2'>
                    <div className='circle'></div>
                    <div> ACTIVE AREA</div>
                </span>
                <span className='circuit'>
                    <div className=' w-full  h-[30%] flex items-center justify-center'>ACTIVE CIRCUIT</div>
                    <div className='flex justify-center items-center h-[70%]'>ESPLANADE-JOKA CIRCUIT</div>
                </span>
            </div>

      </div>
  )
}

export default App
