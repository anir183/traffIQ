import './tailwind.css'
import ProfilePic from '../assets/profile1.jpg'
import Notification from './notification'
import Light from './light'
function App(){
    return(
        <div className='profile'>
            <div className='features flex! flex-row! gap-[25px] pr-[24px]! translate-y-2 '>
                <div><Light/></div>
                <div><Notification/></div>
                
                
            </div>
        <div className='flex flex-col p-4! justify-center text-[17px]'>
            <span className=''>Rudraneel</span>
            <span>Traffic Control</span>
        </div>
        <div className='w-12 h-12 rounded-full overflow-hidden translate-y-4 border-3 border-indigo-600'>
            <img className='w-full h-full object-cover' src={ProfilePic} alt="profilepic" />
        </div>
        </div>
    )
}
export default App