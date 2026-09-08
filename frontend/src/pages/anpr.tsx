import Search from '../pages/anpr/search'
import Details from '../pages/anpr/details'
import Map from '../pages/anpr/map'

const anpr = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-center gap-3">
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <h2 className="text-2xl font-semibold text-slate-900">ANPR Intelligence</h2>
      </div>
      <h3 className="text-center text-sm text-slate-500">
        Search vehicles by their number plate or nodal camera
      </h3>

      <div className="flex justify-center">
        <Search/>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/2">
          <Details/>
        </div>
        <div className="w-full lg:w-1/2">
          <Map/>
        </div>
      </div>
    </div>
  )
}

export default anpr