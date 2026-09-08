// import React from 'react'
import './tailwind.css'
import Selector from '../pages/page2/select'
import Updates from '../pages/page2/updates'
import Feed from '../pages/page2/feed'

const livefeed = () => {
  return (
    <div className='flex flex-col gap-8 '>
        
        <div className='flex h-[10%] mt-8! items-start'>
            <Selector/>
        </div>
        <div className='flex flex-row items-center justify-center gap-4 h-[90%]'>
            <Feed/>
            <Updates/>
        </div>
    </div>
  )
}

export default livefeed