import mongoose from "mongoose";

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'patient',
    required: true,
    unique: true
  },
  qrIdentifier: {
    type: String,
    required: true,
    unique: true
  },
  disease: {
    type: String,
    default: 'Not Specified'
  },
  medicine: {
    type: String,
    default: 'Not Specified'
  },
  doctorDetails: {
    type: String,
    default: 'Not Specified'
  },
}, { timestamps: true });

const qrCodeModel = mongoose.models.qrcode || mongoose.model("qrcode", qrCodeSchema);

export default qrCodeModel;