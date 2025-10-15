import axios from 'axios'

const backendUrl = import.meta.env.VITE_BACKEND_URL

// Get patient information for consultation
export const getPatientInfo = async (appointmentId, token) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/doctor/get-patient-info`,
      { appointmentId },
      { headers: { token } }
    )
    return data
  } catch (error) {
    console.error('Error getting patient info:', error)
    throw error
  }
}

// Get existing consultation notes
export const getConsultationNotes = async (appointmentId, token) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/doctor/get-consultation-notes`,
      { appointmentId },
      { headers: { token } }
    )
    return data
  } catch (error) {
    console.error('Error getting consultation notes:', error)
    throw error
  }
}

// Save consultation notes
export const saveConsultationNotes = async (consultationData, token) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/doctor/save-consultation-notes`,
      consultationData,
      { headers: { token } }
    )
    return data
  } catch (error) {
    console.error('Error saving consultation notes:', error)
    throw error
  }
}

// Complete consultation
export const completeConsultation = async (appointmentId, doctorId, token) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/doctor/complete-consultation`,
      { appointmentId, doctorId },
      { headers: { token } }
    )
    return data
  } catch (error) {
    console.error('Error completing consultation:', error)
    throw error
  }
}

// Get all consultations for a doctor
export const getDoctorConsultations = async (doctorId, token) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/doctor/consultations`,
      { 
        headers: { token },
        params: { doctorId }
      }
    )
    return data
  } catch (error) {
    console.error('Error getting doctor consultations:', error)
    throw error
  }
}
