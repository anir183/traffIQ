import ProfilePic from '../assets/profile1.webp'
import Notification from './notification'
import Light from './light'

function App() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
        <div className="cursor-pointer text-slate-500 transition-colors hover:text-slate-900">
          <Light size={24} />
        </div>
        <div className="cursor-pointer text-slate-500 transition-colors hover:text-slate-900">
          <Notification size={22} />
        </div>
      </div>
      <div className="hidden text-right md:block">
        <p className="text-sm font-medium leading-tight text-slate-900">Rudraneel</p>
        <p className="text-xs leading-tight text-slate-500">Traffic Control</p>
      </div>
      <img
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
        src={ProfilePic}
        alt="Profile"
      />
    </div>
  )
}

export default App