import axios from "axios";
const API_BASE = 'http://localhost:4000' || "";
const LABPHARM_BASE = `${API_BASE}/api/labpharmacy`;

const authHeaders = (token) => ({
  "Authorization": `Bearer ${token}`,
});

const jsonHeaders = (token) => ({
  ...authHeaders(token),
  "Content-Type": "application/json",
});

export const LabPharmacyApi = {
  // ---- LAB ----
  async requestLabTest({ token, doctorId, patientId, testName, description, scheduledDate }) {
    const res = await fetch(`${LABPHARM_BASE}/lab/request`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ doctorId, patientId, testName, description, scheduledDate }),
    });
    return res.json();
  },

  async uploadLabResult({ token, labTestId, file, resultNotes }) {
    const form = new FormData();
    form.append("file", file);
    form.append("labTestId", labTestId);
    form.append("resultNotes", resultNotes || "");

    const res = await fetch(`${LABPHARM_BASE}/lab/upload`, {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    });
    return res.json();
  },

  // ---- PHARMACY ----
  async createPrescription({ token, doctorId, patientId, medications, notes }) {
    const res = await fetch(`${LABPHARM_BASE}/pharmacy/prescribe`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ doctorId, patientId, medications, notes }),
    });
    return res.json();
  },

  async updatePrescriptionStatus({ token, prescriptionId, status }) {
    const res = await fetch(`${LABPHARM_BASE}/pharmacy/update-status`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ prescriptionId, status }),
    });
    return res.json();
  },

  // ---- VIEWS ----
  async getPatientLabAndRx({ token, patientId }) {
    const res = await fetch(`${LABPHARM_BASE}/patient/view`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ patientId }),
    });
    return res.json();
  },

  async getDoctorSummary({ token, doctorId }) {
    const res = await fetch(`${LABPHARM_BASE}/doctor/summary`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ doctorId }),
    });
    return res.json();
  },

  getAllLabTests: async ({ token }) => {
  try {
    const res = await axios.get(`${LABPHARM_BASE}/labs`, {
      headers: { token },
    });
    return res.data;
  } catch (err) {
    return { success: false, message: err.message };
  }
},

getAllPrescriptions: async ({ token }) => {
  try {
    const res = await axios.get(`${LABPHARM_BASE}/prescriptions`, {
      headers: { token },
    });
    return res.data;
  } catch (err) {
    return { success: false, message: err.message };
  }
},

};
