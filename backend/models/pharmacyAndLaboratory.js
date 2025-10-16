import mongoose from "mongoose";

const pharmacyAndLaboratorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const PharmacyAndLaboratory = mongoose.model(
  "PharmacyAndLaboratory",
  pharmacyAndLaboratorySchema
);

export default PharmacyAndLaboratory;
