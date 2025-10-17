import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'patient',
    required: true
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  slotDate: {
    type: Date,
    required: true
  },
  slotTime: {
    type: String, // e.g., "14:30"
    required: true
  },
  userData: {
    type: String,
    default: 'Not Provided'
  },
  docData: {
    type: String,
    default: 'Not Provided'
  },
  amount: {
    type: Number,
    default: 0.0
  },
  date: {
    type: Date,
    default: Date.now
  },
  callHeld: {
    type: Boolean,
    default: false
  },
  payment: {
    type: String,
    default: 'Pending'
  },
  isComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const MedicalRecord = mongoose.models.medicalrecord || mongoose.model("medicalrecord", medicalRecordSchema);

export default MedicalRecord;
