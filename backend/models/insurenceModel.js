import mongoose from "mongoose";

const insurenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", required: true },

    companyName: {
      type: String,
      required: true,
      enum: [
        "AIA Sri Lanka",
        "Fairfirst Insurance Limited",
        "Allianz Insurance Lanka Ltd",
        "Amana Takaful Life PLC",
        "HNB Assurance PLC",
        "Co-Operative Insurance Comp",
        "Janashakthi Insurance PLC",
        "Sri Lanka Insurance",
        "Ceylinco Life",
      ],
    },

    insuranceId: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const insurenceModel =
  mongoose.models.insurence || mongoose.model("insurence", insurenceSchema);

export default insurenceModel;
