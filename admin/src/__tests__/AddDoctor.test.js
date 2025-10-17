import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddDoctor from '../pages/Admin/AddDoctor'
import { AppContext } from '../context/AppContext'
import { AdminContext } from '../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

jest.mock('axios')
jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() }
}))

const mockContext = (component) => {
  return render(
    <AppContext.Provider value={{ backendUrl: 'http://localhost:4000' }}>
      <AdminContext.Provider value={{ aToken: 'mock-token' }}>
        {component}
      </AdminContext.Provider>
    </AppContext.Provider>
  )
}

describe('AddDoctor Component', () => {
  beforeEach(() => {
    axios.post.mockClear()
    toast.error.mockClear()
    toast.success.mockClear()
  })

  test('renders correctly', () => {
    mockContext(<AddDoctor />)
    expect(screen.getByText('Add Doctor')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
  })

  test('shows error if image is not selected', () => {
    mockContext(<AddDoctor />)
    fireEvent.click(screen.getByText(/Add doctor/i))
    expect(toast.error).toHaveBeenCalledWith('Image Not Selected')
  })

  test('shows error if doctor type is Private and fees missing', () => {
    mockContext(<AddDoctor />)

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@mail.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123456' } })
    fireEvent.change(screen.getByDisplayValue('Government'), { target: { value: 'Private' } })

    const fakeFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText(/Upload doctor/i)
    fireEvent.change(fileInput, { target: { files: [fakeFile] } })

    fireEvent.click(screen.getByText(/Add doctor/i))
    expect(toast.error).toHaveBeenCalledWith('Please enter fees for Private doctor')
  })

  test('submits form correctly for Government doctor', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Doctor added' } })

    mockContext(<AddDoctor />)

    const fakeFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Upload doctor/i), { target: { files: [fakeFile] } })
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Dr. Test' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@mail.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('Address 1'), { target: { value: '123 Street' } })
    fireEvent.change(screen.getByPlaceholderText('Address 2'), { target: { value: 'City' } })
    fireEvent.change(screen.getByPlaceholderText('Degree'), { target: { value: 'MBBS' } })

    fireEvent.click(screen.getByText(/Add doctor/i))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Doctor added')
    })
  })
})
