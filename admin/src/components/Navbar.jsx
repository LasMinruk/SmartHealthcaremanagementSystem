import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { LabPharmacyContext } from '../context/LabPharmacyContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const { lbToken, setLbToken } = useContext(LabPharmacyContext)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    
    if (dToken) {
      setDToken('')
      localStorage.removeItem('dToken')
      localStorage.removeItem('doctorId')
      localStorage.removeItem('dName')
    }
    
    if (aToken) {
      setAToken('')
      localStorage.removeItem('aToken')
    }
    
    if (lbToken) {
      setLbToken('')
      localStorage.removeItem('lbtoken')
    }
  }

  const getUserRole = () => {
    if (aToken) return 'Admin'
    if (dToken) return 'Doctor'
    if (lbToken) return 'Lab/Pharmacy'
    return ''
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img onClick={() => navigate('/')} className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>
          {getUserRole()}
        </p>
      </div>
      <button onClick={() => logout()} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>
        Logout
      </button>
    </div>
  )
}

export default Navbar