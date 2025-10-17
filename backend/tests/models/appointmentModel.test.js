import mongoose from 'mongoose';
import appointmentModel from '../../models/appointmentModel.js';

describe('Appointment Model', () => {
  const validAppointmentData = {
    userId: '507f1f77bcf86cd799439011',
    docId: '507f1f77bcf86cd799439012',
    slotDate: '15_12_2024',
    slotTime: '10:00',
    userData: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    },
    docData: {
      name: 'Dr. Smith',
      speciality: 'Cardiology',
      fees: 500
    },
    amount: 500,
    date: Date.now(),
    payment: 'pending'
  };

  beforeEach(async () => {
    await appointmentModel.deleteMany({});
  });

  describe('Appointment Creation', () => {
    it('should create a valid appointment', async () => {
      const appointment = new appointmentModel(validAppointmentData);
      const savedAppointment = await appointment.save();

      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.userId).toBe(validAppointmentData.userId);
      expect(savedAppointment.docId).toBe(validAppointmentData.docId);
      expect(savedAppointment.slotDate).toBe(validAppointmentData.slotDate);
      expect(savedAppointment.slotTime).toBe(validAppointmentData.slotTime);
      expect(savedAppointment.amount).toBe(validAppointmentData.amount);
      expect(savedAppointment.payment).toBe(validAppointmentData.payment);
      expect(savedAppointment.cancelled).toBe(false);
      expect(savedAppointment.isCompleted).toBe(false);
    });

    it('should set default values correctly', async () => {
      const appointmentData = { ...validAppointmentData };
      delete appointmentData.cancelled;
      delete appointmentData.isCompleted;
      delete appointmentData.payment;

      const appointment = new appointmentModel(appointmentData);
      const savedAppointment = await appointment.save();

      expect(savedAppointment.cancelled).toBe(false);
      expect(savedAppointment.isCompleted).toBe(false);
      expect(savedAppointment.payment).toBe('rejected');
    });

    it('should validate required fields', async () => {
      const appointment = new appointmentModel({});
      
      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.userId).toBeDefined();
        expect(error.errors.docId).toBeDefined();
        expect(error.errors.slotDate).toBeDefined();
        expect(error.errors.slotTime).toBeDefined();
        expect(error.errors.userData).toBeDefined();
        expect(error.errors.docData).toBeDefined();
        expect(error.errors.amount).toBeDefined();
        expect(error.errors.date).toBeDefined();
      }
    });

    it('should validate payment enum values', async () => {
      const appointmentData = { ...validAppointmentData, payment: 'invalid' };
      const appointment = new appointmentModel(appointmentData);
      
      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.payment).toBeDefined();
      }
    });

    it('should accept valid payment enum values', async () => {
      const validPayments = ['pending', 'rejected', 'complete'];
      
      for (const payment of validPayments) {
        const appointmentData = { ...validAppointmentData, payment };
        const appointment = new appointmentModel(appointmentData);
        const savedAppointment = await appointment.save();
        
        expect(savedAppointment.payment).toBe(payment);
        await appointmentModel.deleteOne({ _id: savedAppointment._id });
      }
    });

    it('should validate amount as number', async () => {
      const appointmentData = { ...validAppointmentData, amount: 'not-a-number' };
      const appointment = new appointmentModel(appointmentData);
      
      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.amount).toBeDefined();
      }
    });

    it('should validate date as number', async () => {
      const appointmentData = { ...validAppointmentData, date: 'not-a-number' };
      const appointment = new appointmentModel(appointmentData);
      
      try {
        await appointment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.date).toBeDefined();
      }
    });
  });

  describe('Appointment Queries', () => {
    beforeEach(async () => {
      // Create test appointments
      const appointments = [
        { ...validAppointmentData, userId: 'user1', docId: 'doc1', slotDate: '15_12_2024' },
        { ...validAppointmentData, userId: 'user1', docId: 'doc2', slotDate: '16_12_2024' },
        { ...validAppointmentData, userId: 'user2', docId: 'doc1', slotDate: '17_12_2024' },
        { ...validAppointmentData, userId: 'user1', docId: 'doc1', cancelled: true }
      ];
      
      await appointmentModel.insertMany(appointments);
    });

    it('should find appointments by userId', async () => {
      const appointments = await appointmentModel.find({ userId: 'user1' });
      expect(appointments).toHaveLength(3);
    });

    it('should find appointments by docId', async () => {
      const appointments = await appointmentModel.find({ docId: 'doc1' });
      expect(appointments).toHaveLength(3);
    });

    it('should find non-cancelled appointments', async () => {
      const appointments = await appointmentModel.find({ cancelled: false });
      expect(appointments).toHaveLength(3);
    });

    it('should find cancelled appointments', async () => {
      const appointments = await appointmentModel.find({ cancelled: true });
      expect(appointments).toHaveLength(1);
    });

    it('should find completed appointments', async () => {
      await appointmentModel.updateOne(
        { userId: 'user1', docId: 'doc1' },
        { isCompleted: true }
      );
      
      const appointments = await appointmentModel.find({ isCompleted: true });
      expect(appointments).toHaveLength(1);
    });
  });

  describe('Appointment Updates', () => {
    let appointment;

    beforeEach(async () => {
      appointment = new appointmentModel(validAppointmentData);
      await appointment.save();
    });

    it('should update appointment cancellation status', async () => {
      const updatedAppointment = await appointmentModel.findByIdAndUpdate(
        appointment._id,
        { cancelled: true },
        { new: true }
      );

      expect(updatedAppointment.cancelled).toBe(true);
    });

    it('should update appointment completion status', async () => {
      const updatedAppointment = await appointmentModel.findByIdAndUpdate(
        appointment._id,
        { isCompleted: true },
        { new: true }
      );

      expect(updatedAppointment.isCompleted).toBe(true);
    });

    it('should update payment status', async () => {
      const updatedAppointment = await appointmentModel.findByIdAndUpdate(
        appointment._id,
        { payment: 'complete' },
        { new: true }
      );

      expect(updatedAppointment.payment).toBe('complete');
    });

    it('should update multiple fields at once', async () => {
      const updatedAppointment = await appointmentModel.findByIdAndUpdate(
        appointment._id,
        { 
          cancelled: true, 
          isCompleted: true, 
          payment: 'complete' 
        },
        { new: true }
      );

      expect(updatedAppointment.cancelled).toBe(true);
      expect(updatedAppointment.isCompleted).toBe(true);
      expect(updatedAppointment.payment).toBe('complete');
    });
  });

  describe('Appointment Deletion', () => {
    let appointment;

    beforeEach(async () => {
      appointment = new appointmentModel(validAppointmentData);
      await appointment.save();
    });

    it('should delete an appointment', async () => {
      await appointmentModel.findByIdAndDelete(appointment._id);
      
      const deletedAppointment = await appointmentModel.findById(appointment._id);
      expect(deletedAppointment).toBeNull();
    });

    it('should delete multiple appointments', async () => {
      // Create multiple appointments with different userIds
      const appointment1 = new appointmentModel({
        ...validAppointmentData,
        userId: 'user1'
      });
      await appointment1.save();

      const appointment2 = new appointmentModel({
        ...validAppointmentData,
        userId: 'user2'
      });
      await appointment2.save();

      // Delete multiple appointments (including the one from beforeEach)
      await appointmentModel.deleteMany({ userId: { $in: ['user1', 'user2', validAppointmentData.userId] } });
      
      const remainingAppointments = await appointmentModel.find({});
      expect(remainingAppointments).toHaveLength(0);
    });
  });
});
