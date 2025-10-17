import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {
  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Government' | 'Private'
  const navigate = useNavigate()

  const { doctors = [], currency } = useContext(AppContext)

  const applyFilter = () => {
    let list = doctors || []

    // apply speciality filter if present
    if (speciality) {
      list = list.filter((doc) => doc.speciality === speciality)
    }

    // apply tab filter if a specific tab selected
    if (activeTab === 'Government' || activeTab === 'Private') {
      list = list.filter((doc) => (doc.type || 'Government') === activeTab)
    }

    setFilterDoc(list)
  }

  // Re-apply filters when doctors, speciality or activeTab changes
  useEffect(() => {
    applyFilter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, speciality, activeTab])

  // toggle tab: clicking the same tab again will reset to 'All'
  const handleTabClick = (tab) => {
    setActiveTab((prev) => (prev === tab ? 'All' : tab))
  }

  return (
    <div>
      <p className='text-gray-600'>Browse through the doctors specialist.</p>

      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
            showFilter ? 'bg-primary text-white' : ''
          }`}
        >
          Filters
        </button>

        <div
          className={`flex-col gap-4 text-sm text-gray-600 ${
            showFilter ? 'flex' : 'hidden sm:flex'
          }`}
        >
          <p
            onClick={() =>
              speciality === 'General physician'
                ? navigate('/doctors')
                : navigate('/doctors/General physician')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'General physician' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            General physician
          </p>
          <p
            onClick={() =>
              speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            Gynecologist
          </p>
          <p
            onClick={() =>
              speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            Dermatologist
          </p>
          <p
            onClick={() =>
              speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            Pediatricians
          </p>
          <p
            onClick={() =>
              speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            Neurologist
          </p>
          <p
            onClick={() =>
              speciality === 'Gastroenterologist'
                ? navigate('/doctors')
                : navigate('/doctors/Gastroenterologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black ' : ''
            }`}
          >
            Gastroenterologist
          </p>
        </div>

        {/* Tab navigation (same style as admin) */}
        <div className='w-full'>
          <div className='flex justify-center mb-4'>
            <div className='flex bg-blue-100 rounded-full m-auto p-1 w-fit mb-0'>
              <button
                onClick={() => handleTabClick('Government')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'Government'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Government
              </button>
              <button
                onClick={() => handleTabClick('Private')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'Private'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6'>
            {filterDoc && filterDoc.length > 0 ? (
              filterDoc.map((item) => (
                <div
                  onClick={() => {
                    navigate(`/appointment/${item._id}`)
                    scrollTo(0, 0)
                  }}
                  className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                  key={item._id}
                >
                  {/* Image - fallback to blank area if missing */}
                  <div className='w-full h-44 bg-[#EAEFFF] overflow-hidden'>
                    {item.image ? (
                      <img className='w-full h-full object-cover' src={item.image} alt={item.name} />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-400'>
                        No image
                      </div>
                    )}
                  </div>

                  <div className='p-4'>
                    <div className={`flex items-center justify-between gap-2`}>
                      <div className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <p>{item.available ? 'Available' : 'Not Available'}</p>
                      </div>

                      {/* Type badge */}
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${item.type === 'Private' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.type || 'Government'}
                      </div>
                    </div>

                    <p className='text-[#262626] text-lg font-medium mt-3'>{item.name}</p>
                    <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>

                    {/* Show fees only for Private doctors */}
                    {item.type === 'Private' && (
                      <p className='mt-2 text-sm text-gray-700'>
                        Consultation Fee: <span className='font-medium'>{currency} {item.fees ?? '—'}</span>
                      </p>
                    )}

                    {/* show address */}
                    {item.address?.line1 && (
                      <p className='text-xs text-gray-500 mt-2'>{item.address.line1}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-gray-500 mt-4 text-center col-span-full'>No doctors found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Doctors
