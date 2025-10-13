import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  medications: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
    },
  ],
  notes: { type: String },
  status: {
    type: String,
    enum: ["pending", "ready", "delivered", "cancelled"],
    default: "pending",
  },
  issuedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

prescriptionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const prescriptionModel =
  mongoose.models.prescription ||
  mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
