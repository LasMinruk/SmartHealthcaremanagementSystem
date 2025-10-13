import express from "express";
import multer from "multer";
import {
  requestLabTest,
  uploadLabResult,
  createPrescription,
  updatePrescriptionStatus,
  getPatientLabAndPrescriptionData,
  getDoctorLabPharmacySummary,
  getAllLabTests,
  getAllPrescriptions,
} from "../controllers/labPharmacyController.js";

const upload = multer({ dest: "uploads/" });
const labPharmacyRouter = express.Router();

// Doctor creates lab test request
labPharmacyRouter.post("/lab/request", requestLabTest);

// Laboratory uploads test result
labPharmacyRouter.post("/lab/upload", upload.single("file"), uploadLabResult);

// Doctor creates prescription
labPharmacyRouter.post("/pharmacy/prescribe", createPrescription);

// Pharmacy updates prescription status
labPharmacyRouter.post("/pharmacy/update-status", updatePrescriptionStatus);

// Patient view their tests & prescriptions
labPharmacyRouter.post("/patient/view", getPatientLabAndPrescriptionData);

// Doctor summary dashboard
labPharmacyRouter.post("/doctor/summary", getDoctorLabPharmacySummary);

// --- Admin routes ---
labPharmacyRouter.get("/labs", getAllLabTests);
labPharmacyRouter.get("/prescriptions", getAllPrescriptions);

export default labPharmacyRouter;
