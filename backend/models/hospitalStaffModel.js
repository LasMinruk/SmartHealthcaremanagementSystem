import mongoose from "mongoose";

const hospitalStaffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  names: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, { timestamps: true });

const HospitalStaff = mongoose.models.hospitalstaff || mongoose.model("hospitalstaff", hospitalStaffSchema);

export default HospitalStaff;
