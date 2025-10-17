import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AllAppointments from '../pages/Admin/AllAppointments';
import { AppContext } from '../context/AppContext';
import { AdminContext } from '../context/AdminContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock jsPDF and autoTable
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      setFontSize: jest.fn(),
      text: jest.fn(),
      save: jest.fn(),
    })),
  };
});

jest.mock('jspdf-autotable', () => jest.fn());

// Mock cancel icon (dummy src)
jest.mock('../../assets/assets', () => ({
  assets: { cancel_icon: 'cancel_icon.png' },
}));

const mockAppointments = [
  {
    _id: '1',
    userData: { name: 'John Doe', dob: '1990-01-01', image: 'user1.png' },
    docData: { name: 'Dr. Smith', image: 'doc1.png' },
    slotDate: '2025-10-17',
    slotTime: '10:00',
    amount: 50,
    cancelled: false,
    isCompleted: false,
  },
  {
    _id: '2',
    userData: { name: 'Jane Roe', dob: '1985-05-05', image: 'user2.png' },
    docData: { name: 'Dr. Who', image: 'doc2.png' },
    slotDate: '2025-10-18',
    slotTime: '11:00',
    amount: 100,
    cancelled: true,
    isCompleted: false,
  },
];

const mockContext = (overrides = {}) => {
  const cancelAppointment = jest.fn();
  const getAllAppointments = jest.fn();
  const calculateAge = (dob) => new Date().getFullYear() - new Date(dob).getFullYear();
  const slotDateFormat = (date) => new Date(date).toLocaleDateString();
  const currency = '$';

  return render(
    <AppContext.Provider value={{ slotDateFormat, calculateAge, currency, ...overrides.appContext }}>
      <AdminContext.Provider
        value={{ aToken: 'mock-token', appointments: mockAppointments, cancelAppointment, getAllAppointments, ...overrides.adminContext }}
      >
        <AllAppointments />
      </AdminContext.Provider>
    </AppContext.Provider>
  );
};

describe('AllAppointments Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------------- Positive Cases ---------------- */
  test('renders appointments and table headers', () => {
    mockContext();

    expect(screen.getByText('All Appointments')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Roe')).toBeInTheDocument();
  });

  test('filters appointments based on search term', () => {
    mockContext();

    fireEvent.change(screen.getByPlaceholderText(/Search by patient name/i), { target: { value: 'John' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Roe')).not.toBeInTheDocument();
  });

  test('calls cancelAppointment when cancel icon clicked', () => {
    const cancelMock = jest.fn();
    mockContext({ adminContext: { cancelAppointment: cancelMock } });

    const cancelIcon = screen.getAllByRole('img', { name: '' })[2]; // first cancel icon
    fireEvent.click(cancelIcon);

    expect(cancelMock).toHaveBeenCalledWith('1');
  });

  test('exports PDF successfully when appointments exist', () => {
    mockContext();
    fireEvent.click(screen.getByText(/Export PDF/i));
    expect(jsPDF).toHaveBeenCalled();
    expect(autoTable).toHaveBeenCalled();
  });

  /* ---------------- Negative Cases ---------------- */
  test('shows "No appointments found" if search does not match', () => {
    mockContext();
    fireEvent.change(screen.getByPlaceholderText(/Search by patient name/i), { target: { value: 'Nonexistent' } });
    expect(screen.getByText('No appointments found.')).toBeInTheDocument();
  });

  test('alerts user when exporting PDF with no appointments', () => {
    window.alert = jest.fn();
    mockContext({ adminContext: { appointments: [] } });

    fireEvent.click(screen.getByText(/Export PDF/i));
    expect(window.alert).toHaveBeenCalledWith('No appointments to export!');
  });

  test('getAllAppointments called on mount if aToken exists', () => {
    const getAllAppointmentsMock = jest.fn();
    mockContext({ adminContext: { getAllAppointments: getAllAppointmentsMock } });

    expect(getAllAppointmentsMock).toHaveBeenCalled();
  });
});
