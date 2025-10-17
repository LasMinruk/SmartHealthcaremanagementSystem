import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VideoConsultation from '../pages/Doctor/VideoConsultation'
import { DoctorContext } from '../context/DoctorContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

jest.mock('axios')
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}))

const mockDoctorContext = {
  dName: 'Dr. Test',
  dToken: 'mock-token',
  doctorId: 'doc123'
}

const renderWithRouter = (appointmentId = 'appt123') => {
  return render(
    <DoctorContext.Provider value={mockDoctorContext}>
      <MemoryRouter initialEntries={[`/video-consultation/${appointmentId}`]}>
        <Routes>
          <Route path='/video-consultation/:appointmentId' element={<VideoConsultation />} />
        </Routes>
      </MemoryRouter>
    </DoctorContext.Provider>
  )
}

describe('VideoConsultation Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders loading state initially', () => {
    renderWithRouter()
    expect(screen.getByText(/Video Consultation Interface/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading patient information/i)).toBeInTheDocument()
  })

  test('loads patient info successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        patientInfo: {
          name: 'John Doe',
          age: 30,
          gender: 'Male',
          phone: '1234567890',
          bloodType: 'O+',
          allergies: 'None'
        }
      }
    })
    axios.post.mockResolvedValueOnce({ data: { success: false } }) // For consultation notes

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
      expect(screen.getByText(/30 years/i)).toBeInTheDocument()
    })
  })

  test('shows error if patient info fails to load', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'))

    renderWithRouter()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load patient information')
    })
  })

  test('can add and remove medications', async () => {
    axios.post.mockResolvedValue({ data: { success: true } })
    renderWithRouter()

    const addBtn = await screen.findByText('+ Add')
    fireEvent.click(addBtn)

    const medicationInputs = screen.getAllByPlaceholderText('Medication name')
    expect(medicationInputs.length).toBeGreaterThan(1)

    const removeBtn = screen.getAllByText('Remove')[0]
    fireEvent.click(removeBtn)

    expect(screen.getAllByPlaceholderText('Medication name').length).toBe(1)
  })

  test('can save consultation notes', async () => {
    axios.post.mockResolvedValue({ data: { success: true } })
    renderWithRouter()

    const saveBtn = screen.getByText('Save Notes')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Consultation notes saved successfully!')
    })
  })

  test('can complete consultation', async () => {
    axios.post.mockResolvedValue({ data: { success: true } })
    renderWithRouter()

    const completeBtn = screen.getByText(/Complete Consultation/i)
    fireEvent.click(completeBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Consultation completed successfully!')
    })
  })
})
