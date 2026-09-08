import Hero from './header'
import Body from './body'

function App() {
  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Hero/>
      <Body/>
    </div>
  )
}

export default App