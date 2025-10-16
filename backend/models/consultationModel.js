import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema({
  appointmentId: { 
    type: String, 
    required: true,
    ref: 'appointment'
  },
  doctorId: { 
    type: String, 
    required: true,
    ref: 'doctor'
  },
  patientId: { 
    type: String, 
    required: true,
    ref: 'user'
  },
  consultationNotes: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  symptoms: [{
    type: String
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: String,
    temperature: String,
    weight: String,
    height: String,
    oxygenSaturation: String
  },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'cancelled'],
    default: 'in-progress'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
consultationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
consultationSchema.index({ appointmentId: 1 });
consultationSchema.index({ doctorId: 1 });
consultationSchema.index({ patientId: 1 });
consultationSchema.index({ createdAt: -1 });

const consultationModel = 
  mongoose.models.consultation || 
  mongoose.model("consultation", consultationSchema);

export default consultationModel;
