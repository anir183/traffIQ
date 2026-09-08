import './tailwind.css'
import { Route,Routes } from 'react-router-dom'
import Feed from '../pages/livefeed'
import Overview from '../pages/trafficanalysis'
import Incident from '../pages/incidentmngmnt'
import Anpr from '../pages/anpr'
import Admin from '../pages/admin'
import Logs from '../pages/logs'
import Analysis from '../pages/stat'

function App() {

  return (
      <div className="displaywindow z-1000">
        <Routes>
            <Route path='/' element={<Overview/>} ></Route>
            <Route path='/feed' element={<Feed/>} ></Route>
            <Route path='/incident' element={<Incident/>} ></Route>
            <Route path='/anpr' element={<Anpr/>} ></Route>
            <Route path='/analysis' element={<Analysis/>}></Route>
            <Route path='/admin' element={<Admin/>} ></Route>
            <Route path='/logs' element={<Logs/>} ></Route>


        </Routes>
      </div>
  )
}

export default App