import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const LABPHARM_BASE = `${API_BASE}/api/labpharmacy`;

// Helper to create headers based on token type
const authHeaders = (token, isLabToken = false) => {
  if (isLabToken) {
    return { lbtoken: token };
  }
  return { aToken: token };
};

const jsonHeaders = (token, isLabToken = false) => ({
  ...authHeaders(token, isLabToken),
  "Content-Type": "application/json",
});

export const LabPharmacyApi = {
  // ---- LAB ----
  async requestLabTest({ token, doctorId, patientId, testName, description, scheduledDate, isLabToken = false }) {
    try {
      const res = await fetch(`${LABPHARM_BASE}/lab/request`, {
        method: "POST",
        headers: jsonHeaders(token, isLabToken),
        body: JSON.stringify({ doctorId, patientId, testName, description, scheduledDate }),
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async uploadLabResult({ token, labTestId, file, resultNotes, isLabToken = false }) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("labTestId", labTestId);
      form.append("resultNotes", resultNotes || "");

      const res = await fetch(`${LABPHARM_BASE}/lab/upload`, {
        method: "POST",
        headers: authHeaders(token, isLabToken),
        body: form,
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ---- PHARMACY ----
  async createPrescription({ token, doctorId, patientId, medications, notes, isLabToken = false }) {
    try {
      const res = await fetch(`${LABPHARM_BASE}/pharmacy/prescribe`, {
        method: "POST",
        headers: jsonHeaders(token, isLabToken),
        body: JSON.stringify({ doctorId, patientId, medications, notes }),
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async updatePrescriptionStatus({ token, prescriptionId, status, isLabToken = false }) {
    try {
      const res = await fetch(`${LABPHARM_BASE}/pharmacy/update-status`, {
        method: "POST",
        headers: jsonHeaders(token, isLabToken),
        body: JSON.stringify({ prescriptionId, status }),
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ---- VIEWS ----
  async getPatientLabAndRx({ token, patientId, isLabToken = false }) {
    try {
      const res = await fetch(`${LABPHARM_BASE}/patient/view`, {
        method: "POST",
        headers: jsonHeaders(token, isLabToken),
        body: JSON.stringify({ patientId }),
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async getDoctorSummary({ token, doctorId, isLabToken = false }) {
    try {
      const res = await fetch(`${LABPHARM_BASE}/doctor/summary`, {
        method: "POST",
        headers: jsonHeaders(token, isLabToken),
        body: JSON.stringify({ doctorId }),
      });
      return res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get all lab tests (Admin or Lab/Pharmacy can access)
  getAllLabTests: async ({ token, isLabToken = false }) => {
    try {
      const headers = authHeaders(token, isLabToken);
      const res = await axios.get(`${LABPHARM_BASE}/labs`, { headers });
      return res.data;
    } catch (err) {
      console.error("Error fetching lab tests:", err);
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  },

  // Get all prescriptions (Admin or Lab/Pharmacy can access)
  getAllPrescriptions: async ({ token, isLabToken = false }) => {
    try {
      const headers = authHeaders(token, isLabToken);
      const res = await axios.get(`${LABPHARM_BASE}/prescriptions`, { headers });
      return res.data;
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  },
};