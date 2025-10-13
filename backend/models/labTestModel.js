import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  testName: { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "scheduled", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  scheduledDate: { type: String },
  resultFile: { type: String },
  resultNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

labTestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const labTestModel =
  mongoose.models.labTest || mongoose.model("labTest", labTestSchema);
export default labTestModel;
