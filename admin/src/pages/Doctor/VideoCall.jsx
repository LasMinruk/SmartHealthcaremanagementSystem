import React, { useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'

const VideoCall = () => {

    const { appointmentId } = useParams()
    const { dName } = useContext(DoctorContext)

    const displayName = useMemo(() => {
        return dName ? encodeURIComponent(dName) : 'Doctor'
    }, [dName])

    const roomName = useMemo(() => `prescripto-${appointmentId}`, [appointmentId])
    const jitsiUrl = useMemo(() => `https://meet.jit.si/${roomName}#userInfo.displayName=%22${displayName}%22`, [roomName, displayName])

    return (
        <div className='w-full h-[80vh] m-5'>
            <iframe
                title='Video Conference'
                src={jitsiUrl}
                allow='camera; microphone; fullscreen; display-capture; autoplay'
                className='w-full h-full rounded-lg border'
            />
        </div>
    )
}

export default VideoCall


