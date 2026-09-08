import Navigation from './body/navigation'
import Window from './body/window'

function App() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:gap-6 lg:overflow-hidden lg:p-6">
      <Navigation/>
      <Window/>
    </div>
  )
}

export default App