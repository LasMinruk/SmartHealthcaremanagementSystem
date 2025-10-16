import labTestModel from "../models/labTestModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import patientModel from "../models/patientModel.js";
import doctorModel from "../models/doctorModel.js";
import { v2 as cloudinary } from "cloudinary";

/**
 * Doctor requests new lab test for patient
 */
const requestLabTest = async (req, res) => {
  try {
    const { doctorId, patientId, testName, description, scheduledDate } = req.body;

    const newTest = new labTestModel({
      doctorId,
      patientId,
      testName,
      description,
      scheduledDate,
      status: "scheduled",
    });

    await newTest.save();
    res.json({ success: true, message: "Lab test requested successfully", test: newTest });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Laboratory uploads test result
 */
const uploadLabResult = async (req, res) => {
  try {
    const { labTestId, resultNotes } = req.body;
    const file = req.file;

    if (!file) return res.json({ success: false, message: "No file provided" });

    const uploaded = await cloudinary.uploader.upload(file.path, { resource_type: "auto" });

    await labTestModel.findByIdAndUpdate(labTestId, {
      resultFile: uploaded.secure_url,
      resultNotes,
      status: "completed",
    });

    res.json({ success: true, message: "Lab result uploaded successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Doctor prescribes medication
 */
const createPrescription = async (req, res) => {
  try {
    const { doctorId, patientId, medications, notes } = req.body;

    const newPrescription = new prescriptionModel({
      doctorId,
      patientId,
      medications,
      notes,
      status: "pending",
    });

    await newPrescription.save();
    res.json({ success: true, message: "Prescription created", prescription: newPrescription });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Pharmacy updates prescription status
 */
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId, status } = req.body;

    const validStatuses = ["pending", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    await prescriptionModel.findByIdAndUpdate(prescriptionId, { status });
    res.json({ success: true, message: "Prescription status updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Patient view lab results and prescriptions
 */
const getPatientLabAndPrescriptionData = async (req, res) => {
  try {
    const { patientId } = req.body;

    const labTests = await labTestModel.find({ patientId });
    const prescriptions = await prescriptionModel.find({ patientId });

    res.json({
      success: true,
      labTests,
      prescriptions,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Doctor dashboard for lab & pharmacy summary
 */
const getDoctorLabPharmacySummary = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const tests = await labTestModel.find({ doctorId });
    const prescriptions = await prescriptionModel.find({ doctorId });

    const summary = {
      totalTests: tests.length,
      completedTests: tests.filter((t) => t.status === "completed").length,
      pendingPrescriptions: prescriptions.filter((p) => p.status === "pending").length,
      deliveredPrescriptions: prescriptions.filter((p) => p.status === "delivered").length,
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Get all lab tests with pending/scheduled status (for Admin view)
 */
const getAllLabTests = async (req, res) => {
  console.log("Fetching all lab tests for admin view");
  try {
    // Fetch only lab tests that are pending or scheduled
    const labTests = await labTestModel
      .find({ status: { $in: ["pending", "scheduled"] } })
      .select("patientId doctorId status testName scheduledDate createdAt")
      .populate("doctorId", "name email")
      .populate("patientId", "name email");

    res.json({ success: true, labTests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Get all prescriptions with pending status (for Admin view)
 */
const getAllPrescriptions = async (req, res) => {
  try {
    // Fetch only prescriptions that are pending
    const prescriptions = await prescriptionModel
      .find({ status: "pending" })
      .select("patientId doctorId status issuedDate medications createdAt")
      .populate("doctorId", "name email")
      .populate("patientId", "name email");

    res.json({ success: true, prescriptions });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export {
  requestLabTest,
  uploadLabResult,
  createPrescription,
  updatePrescriptionStatus,
  getPatientLabAndPrescriptionData,
  getDoctorLabPharmacySummary,
  getAllLabTests,
  getAllPrescriptions 
};
