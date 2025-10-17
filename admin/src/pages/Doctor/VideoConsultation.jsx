import React, { useContext, useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const VideoConsultation = () => {
    const { appointmentId } = useParams()
    const { dName, dToken, doctorId } = useContext(DoctorContext)
    const navigate = useNavigate()
    
    // State for consultation
    const [patientInfo, setPatientInfo] = useState(null)
    const [consultationNotes, setConsultationNotes] = useState('')
    const [diagnosis, setDiagnosis] = useState('')
    const [symptoms, setSymptoms] = useState('')
    const [vitalSigns, setVitalSigns] = useState({
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: '',
        height: '',
        oxygenSaturation: ''
    })
    const [medications, setMedications] = useState([{
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
    }])
    const [followUpRequired, setFollowUpRequired] = useState(false)
    const [followUpDate, setFollowUpDate] = useState('')
    const [followUpNotes, setFollowUpNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [existingConsultation, setExistingConsultation] = useState(null)

    const displayName = useMemo(() => {
        return dName ? encodeURIComponent(dName) : 'Doctor'
    }, [dName])

    const roomName = useMemo(() => `prescripto-${appointmentId}`, [appointmentId])
    const jitsiUrl = useMemo(() => `https://meet.jit.si/${roomName}#userInfo.displayName=%22${displayName}%22`, [roomName, displayName])

    // Load patient info and existing consultation notes
    useEffect(() => {
        if (appointmentId && dToken && doctorId) {
            loadPatientInfo()
            loadExistingConsultation()
        } else if (!dToken) {
            toast.error('Please login to access consultation')
            navigate('/login')
        }
    }, [appointmentId, dToken, doctorId])

    const loadPatientInfo = async () => {
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/doctor/get-patient-info`,
                { appointmentId },
                { headers: { dtoken: dToken } }
            )
            if (data.success) {
                setPatientInfo(data.patientInfo)
            } else {
                toast.error(data.message)
            }
            console.log('Patient info data:', data)
        } catch (error) {
            console.error('Error loading patient info:', error)
            toast.error('Failed to load patient information')
        }
    }

    const loadExistingConsultation = async () => {
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/doctor/get-consultation-notes`,
                { appointmentId },
                { headers: { dtoken: dToken } }
            )
            if (data.success && data.consultation) {
                setExistingConsultation(data.consultation)
                setConsultationNotes(data.consultation.consultationNotes || '')
                setDiagnosis(data.consultation.diagnosis || '')
                setSymptoms(data.consultation.symptoms || '')
                setVitalSigns(data.consultation.vitalSigns || vitalSigns)
                setMedications(data.consultation.medications || medications)
                setFollowUpRequired(data.consultation.followUpRequired || false)
                setFollowUpDate(data.consultation.followUpDate || '')
                setFollowUpNotes(data.consultation.followUpNotes || '')
            }
        } catch (error) {
            console.error('Error loading consultation notes:', error)
        }
    }

    const saveConsultationNotes = async () => {
        setIsLoading(true)
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/doctor/save-consultation-notes`,
                {
                    appointmentId,
                    doctorId: doctorId,
                    consultationNotes,
                    diagnosis,
                    symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
                    vitalSigns,
                    medications: medications.filter(med => med.name && med.dosage),
                    followUpRequired,
                    followUpDate,
                    followUpNotes
                },
                { headers: { dtoken: dToken } }
            )
            if (data.success) {
                toast.success('Consultation notes saved successfully!')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error saving consultation notes:', error)
            toast.error('Failed to save consultation notes')
        } finally {
            setIsLoading(false)
        }
    }

    const completeConsultation = async () => {
        setIsLoading(true)
        try {
            // First save the notes
            await saveConsultationNotes()
            
            // Then complete the consultation
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/doctor/complete-consultation`,
                { appointmentId, doctorId: doctorId },
                { headers: { dtoken: dToken } }
            )
            if (data.success) {
                toast.success('Consultation completed successfully!')
                navigate('/doctor-appointments')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error completing consultation:', error)
            toast.error('Failed to complete consultation')
        } finally {
            setIsLoading(false)
        }
    }

    const addMedication = () => {
        setMedications([...medications, {
            name: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: ''
        }])
    }

    const updateMedication = (index, field, value) => {
        const updatedMedications = [...medications]
        updatedMedications[index][field] = value
        setMedications(updatedMedications)
    }

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index))
    }


    // Function to download consultation report PDF
    const downloadConsultationReportPDF = async () => {
        if (!existingConsultation) {
            toast.error('No consultation notes found to download')
            return
        }

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/doctor/download-consultation-report?appointmentId=${appointmentId}`,
                { 
                    headers: { dtoken: dToken },
                    responseType: 'blob'
                }
            )
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            
            // Generate filename
            const patientName = patientInfo?.name || 'Patient'
            const date = new Date().toISOString().split('T')[0]
            const filename = `Consultation_Report_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`
            
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            
            toast.success('Consultation report downloaded successfully!')
        } catch (error) {
            console.error('Error downloading consultation report:', error)
            toast.error('Failed to download consultation report')
        }
    }

    return (
        <div className='w-full h-screen bg-gray-50 p-4'>
            <div className='max-w-7xl mx-auto h-full'>
                <div className='bg-white rounded-lg shadow-lg h-full flex'>
                    {/* Video Call Section - Left Side */}
                    <div className='flex-1 flex flex-col'>
                        <div className='p-4 border-b'>
                            <h1 className='text-2xl font-bold text-gray-800'>Video Consultation Interface</h1>
                            <p className='text-gray-600'>Secure, HIPAA-compliant video calls with your healthcare provider</p>
                        </div>
                        
                        <div className='flex-1 p-4'>
                            <div className='bg-gray-900 rounded-lg h-full flex items-center justify-center relative'>
                                {/* Video Call Area */}
                                <div className='w-full h-full'>
                                    <iframe
                                        title='Video Conference'
                                        src={jitsiUrl}
                                        allow='camera; microphone; fullscreen; display-capture; autoplay'
                                        className='w-full h-full rounded-lg'
                                    />
                                </div>
                                
                                {/* Video Controls Overlay */}
                                <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3'>
                                    <button className='w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors'>
                                        <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z' clipRule='evenodd' />
                                        </svg>
                                    </button>
                                    <button className='w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors'>
                                        <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z' />
                                        </svg>
                                    </button>
                                    <button className='w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors'>
                                        <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z' clipRule='evenodd' />
                                        </svg>
                                    </button>
                                    <button className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors'>
                                        <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Consultation Panel - Right Side */}
                    <div className='w-96 border-l bg-gray-50 flex flex-col'>
                        {/* Patient Information */}
                        <div className='p-4 border-b bg-white'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-3'>Patient Information</h3>
                            {patientInfo ? (
                                <div className='space-y-2 text-sm'>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Name:</span>
                                        <span className='font-medium'>{patientInfo.name}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Age:</span>
                                        <span className='font-medium'>{patientInfo.age} years</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Gender:</span>
                                        <span className='font-medium'>{patientInfo.gender}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Phone:</span>
                                        <span className='font-medium'>{patientInfo.phone}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Blood Type:</span>
                                        <span className='font-medium'>{patientInfo.bloodType}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>Allergies:</span>
                                        <span className='font-medium'>{patientInfo.allergies}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className='text-gray-500 text-sm'>
                                    {!dToken ? 'Please login to view patient information' : 'Loading patient information...'}
                                </div>
                            )}
                        </div>

                        {/* Consultation Notes */}
                        <div className='flex-1 p-4 overflow-y-auto'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-3'>Consultation Notes</h3>
                            
                            {/* Diagnosis */}
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Diagnosis</label>
                                <input
                                    type='text'
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter diagnosis...'
                                />
                            </div>

                            {/* Symptoms */}
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Symptoms</label>
                                <input
                                    type='text'
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter symptoms (comma separated)...'
                                />
                            </div>

                            {/* Vital Signs */}
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>Vital Signs</label>
                                <div className='grid grid-cols-2 gap-2'>
                                    <input
                                        type='text'
                                        value={vitalSigns.bloodPressure}
                                        onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                        placeholder='BP'
                                    />
                                    <input
                                        type='text'
                                        value={vitalSigns.heartRate}
                                        onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                        placeholder='HR'
                                    />
                                    <input
                                        type='text'
                                        value={vitalSigns.temperature}
                                        onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                        placeholder='Temp'
                                    />
                                    <input
                                        type='text'
                                        value={vitalSigns.weight}
                                        onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
                                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                        placeholder='Weight'
                                    />
                                </div>
                            </div>

                            {/* Medications */}
                            <div className='mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <label className='block text-sm font-medium text-gray-700'>Medications</label>
                                    <button
                                        onClick={addMedication}
                                        className='text-blue-600 hover:text-blue-800 text-sm'
                                    >
                                        + Add
                                    </button>
                                </div>
                                {medications.map((med, index) => (
                                    <div key={index} className='mb-3 p-3 border border-gray-200 rounded-md'>
                                        <div className='flex justify-between items-center mb-2'>
                                            <span className='text-sm font-medium text-gray-700'>Medication {index + 1}</span>
                                            {medications.length > 1 && (
                                                <button
                                                    onClick={() => removeMedication(index)}
                                                    className='text-red-600 hover:text-red-800 text-sm'
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className='space-y-2'>
                                            <input
                                                type='text'
                                                value={med.name}
                                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                                placeholder='Medication name'
                                            />
                                            <div className='grid grid-cols-2 gap-2'>
                                                <input
                                                    type='text'
                                                    value={med.dosage}
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                    className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                                    placeholder='Dosage'
                                                />
                                                <input
                                                    type='text'
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                    className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                                    placeholder='Frequency'
                                                />
                                            </div>
                                            <input
                                                type='text'
                                                value={med.duration}
                                                onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                                placeholder='Duration'
                                            />
                                            <textarea
                                                value={med.instructions}
                                                onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                                placeholder='Instructions'
                                                rows='2'
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Consultation Notes */}
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Notes</label>
                                <textarea
                                    value={consultationNotes}
                                    onChange={(e) => setConsultationNotes(e.target.value)}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter consultation notes...'
                                    rows='4'
                                />
                            </div>

                            {/* Follow-up */}
                            <div className='mb-4'>
                                <div className='flex items-center mb-2'>
                                    <input
                                        type='checkbox'
                                        checked={followUpRequired}
                                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                                        className='mr-2'
                                    />
                                    <label className='text-sm font-medium text-gray-700'>Follow-up required</label>
                                </div>
                                {followUpRequired && (
                                    <div className='space-y-2'>
                                        <input
                                            type='date'
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                        />
                                        <textarea
                                            value={followUpNotes}
                                            onChange={(e) => setFollowUpNotes(e.target.value)}
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                            placeholder='Follow-up notes...'
                                            rows='2'
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='p-4 border-t bg-white space-y-2'>
                            <button
                                onClick={saveConsultationNotes}
                                disabled={isLoading}
                                className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                            >
                                {isLoading ? 'Saving...' : 'Save Notes'}
                            </button>
                            
                            {/* PDF Actions - Only show if consultation notes exist */}
                            {existingConsultation && (
                                <button
                                    onClick={downloadConsultationReportPDF}
                                    disabled={isLoading}
                                    className='w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50'
                                >
                                    📄 Download PDF
                                </button>
                            )}
                            
                            <button
                                onClick={completeConsultation}
                                disabled={isLoading}
                                className='w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
                            >
                                {isLoading ? 'Completing...' : 'Complete Consultation & Issue E-Prescription'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoConsultation
