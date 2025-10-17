// Utility functions for appointment management testing

describe('Appointment Utility Functions', () => {
  describe('Date Formatting', () => {
    it('should format appointment date correctly', () => {
      const slotDate = '15_12_2024';
      const formattedDate = formatAppointmentDate(slotDate);
      expect(formattedDate).toBe('15 Dec 2024');
    });

    it('should handle different date formats', () => {
      const testCases = [
        { input: '1_1_2024', expected: '1 Jan 2024' },
        { input: '31_12_2024', expected: '31 Dec 2024' },
        { input: '5_6_2024', expected: '5 Jun 2024' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatAppointmentDate(input)).toBe(expected);
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format time correctly', () => {
      const time = '10:00';
      const formattedTime = formatAppointmentTime(time);
      expect(formattedTime).toBe('10:00 AM');
    });

    it('should handle 24-hour format conversion', () => {
      const testCases = [
        { input: '00:00', expected: '12:00 AM' },
        { input: '12:00', expected: '12:00 PM' },
        { input: '13:30', expected: '1:30 PM' },
        { input: '23:59', expected: '11:59 PM' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatAppointmentTime(input)).toBe(expected);
      });
    });
  });

  describe('Slot Availability', () => {
    it('should check if slot is available', () => {
      const doctorSlots = {
        '15_12_2024': ['10:00', '11:00'],
        '16_12_2024': ['09:00']
      };

      expect(isSlotAvailable(doctorSlots, '15_12_2024', '10:00')).toBe(false);
      expect(isSlotAvailable(doctorSlots, '15_12_2024', '12:00')).toBe(true);
      expect(isSlotAvailable(doctorSlots, '17_12_2024', '10:00')).toBe(true);
    });

    it('should handle empty slots object', () => {
      const doctorSlots = {};
      expect(isSlotAvailable(doctorSlots, '15_12_2024', '10:00')).toBe(true);
    });
  });

  describe('Payment Status', () => {
    it('should determine payment status correctly', () => {
      expect(getPaymentStatus('pending')).toBe('Payment Pending');
      expect(getPaymentStatus('complete')).toBe('Payment Complete');
      expect(getPaymentStatus('rejected')).toBe('Payment Failed');
    });

    it('should handle government doctor payments', () => {
      const governmentAppointment = {
        amount: 0,
        payment: 'complete',
        docData: { type: 'Government' }
      };

      expect(getPaymentStatusForAppointment(governmentAppointment)).toBe('Free');
    });
  });

  describe('Appointment Status', () => {
    it('should determine appointment status correctly', () => {
      expect(getAppointmentStatus({ cancelled: true })).toBe('Cancelled');
      expect(getAppointmentStatus({ isCompleted: true })).toBe('Completed');
      expect(getAppointmentStatus({ cancelled: false, isCompleted: false })).toBe('Upcoming');
    });
  });

  describe('Date Validation', () => {
    it('should validate appointment dates', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      expect(isValidAppointmentDate(tomorrow)).toBe(true);
      expect(isValidAppointmentDate(yesterday)).toBe(false);
      expect(isValidAppointmentDate(today)).toBe(true);
    });

    it('should validate time slots', () => {
      expect(isValidTimeSlot('10:00')).toBe(true);
      expect(isValidTimeSlot('25:00')).toBe(false);
      expect(isValidTimeSlot('10:60')).toBe(false);
      expect(isValidTimeSlot('abc')).toBe(false);
    });
  });

  describe('Slot Generation', () => {
    it('should generate available time slots', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const interval = 30; // minutes
      const bookedSlots = ['10:00', '11:30'];

      const availableSlots = generateAvailableSlots(startTime, endTime, interval, bookedSlots);
      
      expect(availableSlots).toContain('09:00');
      expect(availableSlots).toContain('09:30');
      expect(availableSlots).not.toContain('10:00');
      expect(availableSlots).not.toContain('11:30');
      expect(availableSlots).toContain('12:00');
    });
  });

  describe('Appointment Filtering', () => {
    const appointments = [
      { _id: '1', cancelled: false, isCompleted: false, payment: 'pending' },
      { _id: '2', cancelled: true, isCompleted: false, payment: 'pending' },
      { _id: '3', cancelled: false, isCompleted: true, payment: 'complete' },
      { _id: '4', cancelled: false, isCompleted: false, payment: 'complete' }
    ];

    it('should filter upcoming appointments', () => {
      const upcoming = filterUpcomingAppointments(appointments);
      expect(upcoming).toHaveLength(2);
      expect(upcoming.map(a => a._id)).toEqual(['1', '4']);
    });

    it('should filter completed appointments', () => {
      const completed = filterCompletedAppointments(appointments);
      expect(completed).toHaveLength(1);
      expect(completed[0]._id).toBe('3');
    });

    it('should filter cancelled appointments', () => {
      const cancelled = filterCancelledAppointments(appointments);
      expect(cancelled).toHaveLength(1);
      expect(cancelled[0]._id).toBe('2');
    });
  });

  describe('Frontend Specific Utilities', () => {
    it('should format appointment for display', () => {
      const appointment = {
        _id: 'appointment123',
        docData: { name: 'Dr. Smith', speciality: 'Cardiology' },
        slotDate: '15_12_2024',
        slotTime: '10:00',
        amount: 500,
        payment: 'pending'
      };

      const formatted = formatAppointmentForDisplay(appointment);
      
      expect(formatted.id).toBe('appointment123');
      expect(formatted.doctorName).toBe('Dr. Smith');
      expect(formatted.speciality).toBe('Cardiology');
      expect(formatted.formattedDate).toBe('15 Dec 2024');
      expect(formatted.formattedTime).toBe('10:00 AM');
    });

    it('should validate form data', () => {
      const validFormData = {
        doctorId: 'doc123',
        slotDate: '15_12_2024',
        slotTime: '10:00'
      };

      const invalidFormData = {
        doctorId: '',
        slotDate: 'invalid-date',
        slotTime: '25:00'
      };

      expect(validateAppointmentForm(validFormData)).toBe(true);
      expect(validateAppointmentForm(invalidFormData)).toBe(false);
    });
  });
});

// Helper functions (these would typically be in a separate utils file)
function formatAppointmentDate(slotDate) {
  const [day, month, year] = slotDate.split('_');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
}

function formatAppointmentTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function isSlotAvailable(doctorSlots, slotDate, slotTime) {
  return !doctorSlots[slotDate] || !doctorSlots[slotDate].includes(slotTime);
}

function getPaymentStatus(payment) {
  const statusMap = {
    'pending': 'Payment Pending',
    'complete': 'Payment Complete',
    'rejected': 'Payment Failed'
  };
  return statusMap[payment] || 'Unknown';
}

function getPaymentStatusForAppointment(appointment) {
  if (appointment.docData?.type === 'Government') {
    return 'Free';
  }
  return getPaymentStatus(appointment.payment);
}

function getAppointmentStatus(appointment) {
  if (appointment.cancelled) return 'Cancelled';
  if (appointment.isCompleted) return 'Completed';
  return 'Upcoming';
}

function isValidAppointmentDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function isValidTimeSlot(time) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function generateAvailableSlots(startTime, endTime, interval, bookedSlots = []) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    
    if (!bookedSlots.includes(timeString)) {
      slots.push(timeString);
    }
    
    currentMin += interval;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
}

function filterUpcomingAppointments(appointments) {
  return appointments.filter(apt => !apt.cancelled && !apt.isCompleted);
}

function filterCompletedAppointments(appointments) {
  return appointments.filter(apt => apt.isCompleted);
}

function filterCancelledAppointments(appointments) {
  return appointments.filter(apt => apt.cancelled);
}

function formatAppointmentForDisplay(appointment) {
  return {
    id: appointment._id,
    doctorName: appointment.docData.name,
    speciality: appointment.docData.speciality,
    formattedDate: formatAppointmentDate(appointment.slotDate),
    formattedTime: formatAppointmentTime(appointment.slotTime),
    amount: appointment.amount,
    paymentStatus: getPaymentStatus(appointment.payment)
  };
}

function validateAppointmentForm(formData) {
  if (!formData.doctorId || !formData.slotDate || !formData.slotTime) {
    return false;
  }
  
  if (!isValidTimeSlot(formData.slotTime)) {
    return false;
  }
  
  // Additional validation can be added here
  return true;
}