import React from 'react'
import '../tailwind.css'
import './detailF.css'
const detailF = () => {
  return (
        <div className=' flex flex-row w-[20%] bg-red-600 text-amber-50 redf'>
            <div className='flex flex-col gap-3 '>
                <span className='text-3xl pt-2!'>Critical Incidents</span>
                <div className='flex flex-col text-2xl gap-4'>
                    <div className='flex flex-col border-l-2 p-2! h-[40%] border-l-gray-400!'>
                        <span>2</span>
                        <span>suspicious activities</span>
                    </div>
                    <div className='flex flex-col border-l-2 p-2! h-[40%] border-l-gray-400!'>
                        <span>1</span>
                        <span>Accident</span>
                    </div>
                </div>
            </div>
            <div>
                <div></div>
                <div></div>
            </div>
            <div></div>
        </div>
  )
}

export default detailF