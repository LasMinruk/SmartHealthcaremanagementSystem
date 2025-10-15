import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const ConsultationHistory = () => {
    const { userData, token } = useContext(AppContext)
    const [consultations, setConsultations] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedConsultation, setSelectedConsultation] = useState(null)
    const [selectedPrescription, setSelectedPrescription] = useState(null)
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

    useEffect(() => {
        if (token) {
            loadConsultationHistory()
        }
    }, [token])

    const loadConsultationHistory = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/user/consultation-history`,
                { headers: { token } }
            )
            if (data.success) {
                setConsultations(data.consultations)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error loading consultation history:', error)
            toast.error('Failed to load consultation history')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // View prescription details
    const viewPrescription = (appointmentId) => {
        const consultation = consultations.find(cons => 
            cons.appointmentId._id === appointmentId
        );
        
        if (consultation) {
            setSelectedPrescription(consultation);
            setShowPrescriptionModal(true);
        } else {
            toast.error("Prescription not found");
        }
    };

    // Close prescription modal
    const closePrescriptionModal = () => {
        setShowPrescriptionModal(false);
        setSelectedPrescription(null);
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading consultation history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='max-w-6xl mx-auto px-4'>
                <div className='bg-white rounded-lg shadow-lg p-6'>
                    <h1 className='text-3xl font-bold text-gray-800 mb-6'>Consultation History</h1>
                    
                    {consultations.length === 0 ? (
                        <div className='text-center py-12'>
                            <div className='text-gray-400 mb-4'>
                                <svg className='w-16 h-16 mx-auto' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clipRule='evenodd' />
                                </svg>
                            </div>
                            <h3 className='text-lg font-medium text-gray-900 mb-2'>No consultations found</h3>
                            <p className='text-gray-500'>You haven't had any consultations yet.</p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {consultations.map((consultation) => (
                                <div key={consultation._id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                                    <div className='flex justify-between items-start mb-3'>
                                        <div>
                                            <h3 className='text-lg font-semibold text-gray-800'>
                                                Dr. {consultation.doctorId?.name || 'Unknown Doctor'}
                                            </h3>
                                            <p className='text-gray-600'>{consultation.doctorId?.speciality || 'General Medicine'}</p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-sm text-gray-500'>{formatDate(consultation.createdAt)}</p>
                                            <p className='text-sm text-gray-500'>{formatTime(consultation.createdAt)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                                        {consultation.diagnosis && (
                                            <div>
                                                <h4 className='font-medium text-gray-700 mb-1'>Diagnosis</h4>
                                                <p className='text-gray-600'>{consultation.diagnosis}</p>
                                            </div>
                                        )}
                                        
                                        {consultation.symptoms && consultation.symptoms.length > 0 && (
                                            <div>
                                                <h4 className='font-medium text-gray-700 mb-1'>Symptoms</h4>
                                                <p className='text-gray-600'>{consultation.symptoms.join(', ')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {consultation.medications && consultation.medications.length > 0 && (
                                        <div className='mb-4'>
                                            <h4 className='font-medium text-gray-700 mb-2'>Prescribed Medications</h4>
                                            <div className='space-y-2'>
                                                {consultation.medications.map((med, index) => (
                                                    <div key={index} className='bg-gray-50 p-3 rounded-md'>
                                                        <div className='flex justify-between items-start'>
                                                            <div>
                                                                <p className='font-medium text-gray-800'>{med.name}</p>
                                                                <p className='text-sm text-gray-600'>
                                                                    {med.dosage} - {med.frequency} - {med.duration}
                                                                </p>
                                                                {med.instructions && (
                                                                    <p className='text-sm text-gray-500 mt-1'>{med.instructions}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {consultation.consultationNotes && (
                                        <div className='mb-4'>
                                            <h4 className='font-medium text-gray-700 mb-2'>Consultation Notes</h4>
                                            <p className='text-gray-600 bg-gray-50 p-3 rounded-md'>{consultation.consultationNotes}</p>
                                        </div>
                                    )}

                                    {consultation.followUpRequired && (
                                        <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                                            <h4 className='font-medium text-blue-800 mb-1'>Follow-up Required</h4>
                                            {consultation.followUpDate && (
                                                <p className='text-blue-700 text-sm'>
                                                    Follow-up Date: {formatDate(consultation.followUpDate)}
                                                </p>
                                            )}
                                            {consultation.followUpNotes && (
                                                <p className='text-blue-700 text-sm mt-1'>{consultation.followUpNotes}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className='flex justify-between items-center mt-4 pt-3 border-t border-gray-200'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            consultation.status === 'completed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : consultation.status === 'in-progress'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                                        </span>
                                        
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => viewPrescription(consultation.appointmentId._id)}
                                                className='text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1'
                                            >
                                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                </svg>
                                                View Prescription
                                            </button>
                                            
                                            <button
                                                onClick={() => setSelectedConsultation(consultation)}
                                                className='text-primary hover:text-primary-dark text-sm font-medium'
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation Details Modal */}
            {selectedConsultation && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
                    <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                        <div className='p-6'>
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className='text-xl font-bold text-gray-800'>Consultation Details</h2>
                                <button
                                    onClick={() => setSelectedConsultation(null)}
                                    className='text-gray-400 hover:text-gray-600'
                                >
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className='space-y-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <h3 className='font-medium text-gray-700'>Doctor</h3>
                                        <p className='text-gray-600'>Dr. {selectedConsultation.doctorId?.name}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-medium text-gray-700'>Speciality</h3>
                                        <p className='text-gray-600'>{selectedConsultation.doctorId?.speciality}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-medium text-gray-700'>Date</h3>
                                        <p className='text-gray-600'>{formatDate(selectedConsultation.createdAt)}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-medium text-gray-700'>Time</h3>
                                        <p className='text-gray-600'>{formatTime(selectedConsultation.createdAt)}</p>
                                    </div>
                                </div>

                                {selectedConsultation.diagnosis && (
                                    <div>
                                        <h3 className='font-medium text-gray-700 mb-2'>Diagnosis</h3>
                                        <p className='text-gray-600'>{selectedConsultation.diagnosis}</p>
                                    </div>
                                )}

                                {selectedConsultation.symptoms && selectedConsultation.symptoms.length > 0 && (
                                    <div>
                                        <h3 className='font-medium text-gray-700 mb-2'>Symptoms</h3>
                                        <p className='text-gray-600'>{selectedConsultation.symptoms.join(', ')}</p>
                                    </div>
                                )}

                                {selectedConsultation.consultationNotes && (
                                    <div>
                                        <h3 className='font-medium text-gray-700 mb-2'>Notes</h3>
                                        <p className='text-gray-600'>{selectedConsultation.consultationNotes}</p>
                                    </div>
                                )}

                                {selectedConsultation.medications && selectedConsultation.medications.length > 0 && (
                                    <div>
                                        <h3 className='font-medium text-gray-700 mb-2'>Prescribed Medications</h3>
                                        <div className='space-y-2'>
                                            {selectedConsultation.medications.map((med, index) => (
                                                <div key={index} className='bg-gray-50 p-3 rounded-md'>
                                                    <p className='font-medium text-gray-800'>{med.name}</p>
                                                    <p className='text-sm text-gray-600'>
                                                        Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}
                                                    </p>
                                                    {med.instructions && (
                                                        <p className='text-sm text-gray-500 mt-1'>Instructions: {med.instructions}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedConsultation.followUpRequired && (
                                    <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                                        <h3 className='font-medium text-blue-800 mb-2'>Follow-up Information</h3>
                                        {selectedConsultation.followUpDate && (
                                            <p className='text-blue-700 text-sm'>
                                                Follow-up Date: {formatDate(selectedConsultation.followUpDate)}
                                            </p>
                                        )}
                                        {selectedConsultation.followUpNotes && (
                                            <p className='text-blue-700 text-sm mt-1'>{selectedConsultation.followUpNotes}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
                                <button
                                    onClick={() => {
                                        setSelectedConsultation(null);
                                        viewPrescription(selectedConsultation.appointmentId._id);
                                    }}
                                    className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2'
                                >
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                    </svg>
                                    View Prescription
                                </button>
                                
                                <button
                                    onClick={() => setSelectedConsultation(null)}
                                    className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescription Modal */}
            {showPrescriptionModal && selectedPrescription && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
                    <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
                        <div className='p-6'>
                            {/* Header */}
                            <div className='flex justify-between items-center mb-6'>
                                <h2 className='text-2xl font-bold text-gray-800'>Prescription Details</h2>
                                <button
                                    onClick={closePrescriptionModal}
                                    className='text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                    </svg>
                                </button>
                            </div>

                            {/* Doctor Information */}
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                                <h3 className='text-lg font-semibold text-blue-800 mb-3'>Doctor Information</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-blue-600 font-medium'>Doctor Name</p>
                                        <p className='text-blue-800'>Dr. {selectedPrescription.doctorId?.name}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm text-blue-600 font-medium'>Speciality</p>
                                        <p className='text-blue-800'>{selectedPrescription.doctorId?.speciality}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Information */}
                            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6'>
                                <h3 className='text-lg font-semibold text-gray-800 mb-3'>Appointment Information</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-gray-600 font-medium'>Appointment Date</p>
                                        <p className='text-gray-800'>{formatDate(selectedPrescription.appointmentId?.slotDate)}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-600 font-medium'>Appointment Time</p>
                                        <p className='text-gray-800'>{selectedPrescription.appointmentId?.slotTime}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis */}
                            {selectedPrescription.diagnosis && (
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>Diagnosis</h3>
                                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                                        <p className='text-yellow-800'>{selectedPrescription.diagnosis}</p>
                                    </div>
                                </div>
                            )}

                            {/* Symptoms */}
                            {selectedPrescription.symptoms && selectedPrescription.symptoms.length > 0 && (
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>Symptoms</h3>
                                    <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                                        <p className='text-orange-800'>{selectedPrescription.symptoms.join(', ')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Medications */}
                            {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>Prescribed Medications</h3>
                                    <div className='space-y-3'>
                                        {selectedPrescription.medications.map((medication, index) => (
                                            <div key={index} className='bg-green-50 border border-green-200 rounded-lg p-4'>
                                                <div className='flex justify-between items-start mb-2'>
                                                    <h4 className='font-semibold text-green-800 text-lg'>{medication.name}</h4>
                                                </div>
                                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                                                    <div>
                                                        <p className='text-green-600 font-medium'>Dosage</p>
                                                        <p className='text-green-800'>{medication.dosage}</p>
                                                    </div>
                                                    <div>
                                                        <p className='text-green-600 font-medium'>Frequency</p>
                                                        <p className='text-green-800'>{medication.frequency}</p>
                                                    </div>
                                                    <div>
                                                        <p className='text-green-600 font-medium'>Duration</p>
                                                        <p className='text-green-800'>{medication.duration}</p>
                                                    </div>
                                                </div>
                                                {medication.instructions && (
                                                    <div className='mt-3'>
                                                        <p className='text-green-600 font-medium text-sm'>Instructions</p>
                                                        <p className='text-green-800 text-sm'>{medication.instructions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Consultation Notes */}
                            {selectedPrescription.consultationNotes && (
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>Consultation Notes</h3>
                                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                        <p className='text-gray-800 whitespace-pre-wrap'>{selectedPrescription.consultationNotes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Follow-up Information */}
                            {selectedPrescription.followUpRequired && (
                                <div className='mb-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>Follow-up Information</h3>
                                    <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                                        {selectedPrescription.followUpDate && (
                                            <div className='mb-2'>
                                                <p className='text-purple-600 font-medium text-sm'>Follow-up Date</p>
                                                <p className='text-purple-800'>{formatDate(selectedPrescription.followUpDate)}</p>
                                            </div>
                                        )}
                                        {selectedPrescription.followUpNotes && (
                                            <div>
                                                <p className='text-purple-600 font-medium text-sm'>Follow-up Notes</p>
                                                <p className='text-purple-800'>{selectedPrescription.followUpNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Close Button */}
                            <div className='flex justify-end mt-6'>
                                <button
                                    onClick={closePrescriptionModal}
                                    className='px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ConsultationHistory
