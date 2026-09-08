import Logo from '../assets/Union.svg'

function App() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center">
        <img src={Logo} alt="TraffIQ logo" className="h-8 w-auto" />
      </span>
      <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        traff<span className="text-blue-600">IQ</span>
      </span>
    </div>
  )
}

export default App