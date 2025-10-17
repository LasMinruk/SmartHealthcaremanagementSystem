import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema({
  diagnosisId: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Diagnosis = mongoose.models.diagnosis || mongoose.model("diagnosis", diagnosisSchema);

export default Diagnosis;
