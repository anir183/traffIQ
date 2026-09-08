// import  FilteredImageSvg  from './svg';
import Logo from '../assets/Union.svg'
import './name.css'
function App() {
  return (
    <div className='name'>
        <span className='logo'>
        <img src={Logo} alt="Site Logo" width="120" />
        </span>
        <span className='traffIQ'>
            traff <span className='iq'>IQ</span>
        </span>

    </div>
  )
}

export default App;