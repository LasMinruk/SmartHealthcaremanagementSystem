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
  loginLabPharmacy,
} from "../controllers/labPharmacyController.js";
import authLabPharmacy from "../middleware/authLabPharmacy.js";
import authAdminOrLabPharmacy from "../middleware/authAdminOrLabPharmacy.js";

const upload = multer({ dest: "uploads/" });
const labPharmacyRouter = express.Router();

// API for lab/pharmacy login (no auth required)
labPharmacyRouter.post("/login", loginLabPharmacy);

// Doctor creates lab test request
labPharmacyRouter.post("/lab/request", requestLabTest);

// Laboratory uploads test result (requires lab/pharmacy auth)
labPharmacyRouter.post("/lab/upload", authLabPharmacy, upload.single("file"), uploadLabResult);

// Doctor creates prescription
labPharmacyRouter.post("/pharmacy/prescribe", createPrescription);

// Pharmacy updates prescription status (requires lab/pharmacy auth)
labPharmacyRouter.post("/pharmacy/update-status", authLabPharmacy, updatePrescriptionStatus);

// Patient view their tests & prescriptions
labPharmacyRouter.post("/patient/view", getPatientLabAndPrescriptionData);

// Doctor summary dashboard
labPharmacyRouter.post("/doctor/summary", getDoctorLabPharmacySummary);

// --- Admin/Lab routes (both can access) ---
labPharmacyRouter.get("/labs", authAdminOrLabPharmacy, getAllLabTests);
labPharmacyRouter.get("/prescriptions", authAdminOrLabPharmacy, getAllPrescriptions);

export default labPharmacyRouter;