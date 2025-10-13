import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { LabPharmacyApi } from "../../api/labPharmacyApi";
import { Dialog, Transition } from "@headlessui/react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";

const useToken = () =>
  localStorage.getItem("dToken") || localStorage.getItem("token") || "";
const useDoctorId = () =>
  localStorage.getItem("userId") || localStorage.getItem("doctorId") || "";

// convert image URLs to downloadable PDFs
const downloadImageAsPDF = async (url, filename = "lab-report.pdf") => {
  const pdf = new jsPDF();
  const img = await fetch(url)
    .then((res) => res.blob())
    .then((blob) => URL.createObjectURL(blob));
  pdf.addImage(img, "JPEG", 10, 10, 180, 250);
  pdf.save(filename);
};

const DoctorPatientDetails = () => {
  const { id: patientId } = useParams();
  const token = useToken();
  const doctorId = useDoctorId();
  const { state } = useLocation();
  const patientName = state?.patientName || "Patient";

  const [activeTab, setActiveTab] = useState("lab");
  const [patientData, setPatientData] = useState({
    labTests: [],
    prescriptions: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMeds, setSelectedMeds] = useState(null);
  const [loading, setLoading] = useState(false);

  const canLoad = useMemo(() => Boolean(patientId), [patientId]);

  const fetchData = async () => {
    if (!canLoad) return;
    setLoading(true);
    const res = await LabPharmacyApi.getPatientLabAndRx({ token, patientId });
    if (res.success)
      setPatientData({
        labTests: res.labTests || [],
        prescriptions: res.prescriptions || [],
      });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token, patientId, refreshKey, canLoad]);

  const handleReload = () => setRefreshKey((k) => k + 1);

  const CreateLabOrderForm = () => {
    const [testName, setTestName] = useState("");
    const [description, setDescription] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().split("T")[0];
    const canSubmit = testName && description && patientId;

    const submit = async (e) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSubmitting(true);
      const res = await LabPharmacyApi.requestLabTest({
        token,
        doctorId,
        patientId,
        testName,
        description,
        scheduledDate,
      });
      setSubmitting(false);
      if (res.success) {
        handleReload();
        setTestName("");
        setDescription("");
        setScheduledDate("");
      } else {
        alert(res.message);
      }
    };

    return (
      <form onSubmit={submit} className="border rounded p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3 text-gray-700">
          Create New Lab Test Order
        </h2>

        <div className="mb-3">
          <label className="text-sm font-medium block mb-1">Doctor ID</label>
          <input
            value={doctorId}
            disabled
            className="border rounded w-full px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        <label className="text-sm font-medium block mb-1">
          Test Name<span className="text-red-500">*</span>
        </label>
        <input
          className="border rounded w-full px-3 py-2 mb-3"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          required
        />

        <label className="text-sm font-medium block mb-1">
          Description<span className="text-red-500">*</span>
        </label>
        <textarea
          className="border rounded w-full px-3 py-2 mb-3"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label className="text-sm font-medium block mb-1">Scheduled Date</label>
        <input
          type="date"
          className="border rounded w-full px-3 py-2 mb-4"
          min={today}
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />

        <button
          disabled={!canSubmit || submitting}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          Create Order
        </button>
      </form>
    );
  };

  const CreatePrescriptionForm = () => {
    const [notes, setNotes] = useState("");
    const [medications, setMeds] = useState([
      { name: "", dosage: "", frequency: "", duration: "" },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const addRow = () =>
      setMeds((a) => [
        ...a,
        { name: "", dosage: "", frequency: "", duration: "" },
      ]);
    const setField = (idx, key, val) =>
      setMeds((a) => a.map((m, i) => (i === idx ? { ...m, [key]: val } : m)));
    const removeRow = (idx) => setMeds((a) => a.filter((_, i) => i !== idx));

    const canCreate = medications.every((m) => m.name) && patientId;

    const create = async (e) => {
      e.preventDefault();
      if (!canCreate) return;
      setSubmitting(true);
      const res = await LabPharmacyApi.createPrescription({
        token,
        doctorId,
        patientId,
        medications,
        notes,
      });
      setSubmitting(false);
      if (res.success) {
        handleReload();
        setNotes("");
        setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]);
      } else {
        alert(res.message);
      }
    };

    return (
      <form onSubmit={create} className="border rounded p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3 text-gray-700">
          Create Prescription
        </h2>

        <div className="mb-3">
          <label className="text-sm font-medium block mb-1">Doctor ID</label>
          <input
            value={doctorId}
            disabled
            className="border rounded w-full px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="space-y-3 mb-3">
          <label className="text-sm font-medium block mb-1">
            Medicine List
          </label>
          {medications.map((m, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                className="border rounded px-3 py-2"
                placeholder="Medicine name"
                value={m.name}
                onChange={(e) => setField(idx, "name", e.target.value)}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Dosage"
                value={m.dosage}
                onChange={(e) => setField(idx, "dosage", e.target.value)}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Frequency"
                value={m.frequency}
                onChange={(e) => setField(idx, "frequency", e.target.value)}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Duration"
                value={m.duration}
                onChange={(e) => setField(idx, "duration", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="px-3 py-2 rounded bg-red-100 text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-2 rounded bg-gray-100"
          >
            + Add medicine
          </button>
        </div>

        <label className="text-sm font-medium block mb-1">Notes</label>
        <textarea
          className="border rounded w-full px-3 py-2 mb-3"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          disabled={!canCreate || submitting}
          className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          Create Prescription
        </button>
      </form>
    );
  };

  return (
    <div className="p-6">
      <header className="mb-6 border-b pb-3">
        <h1 className="text-2xl font-semibold text-gray-800">
          Patient Details
        </h1>
        <p className="text-sm text-gray-500">
          Manage lab tests and prescriptions for this patient.
        </p>
      </header>

      {/* Back & Title section */}
      <div className="mt-6 lg:w-[935px]">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-4 text-blue-600 hover:underline"
        >
          ← Back to Patients
        </button>

        <h2 className="text-xl font-semibold mb-4">{patientName}'s Records</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-blue-100 m-auto rounded-full p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("lab")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "lab"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Lab Tests
        </button>
        <button
          onClick={() => setActiveTab("pres")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "pres"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Prescriptions
        </button>
      </div>

      {activeTab === "lab" && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all lg:items-stretch lg:w-[935px]">
          <div className="flex flex-col h-full w-full">
            <CreateLabOrderForm />
          </div>

          <div className="border rounded p-4 bg-white shadow-sm flex flex-col h-full lg:h-auto">
            <h2 className="font-semibold mb-3 text-gray-700">Lab Reports</h2>
            {loading ? (
              <div className="flex-1 flex justify-center items-center">
                <span className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">Test</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData.labTests.map((t) => (
                      <tr key={t._id} className="border-b">
                        <td className="py-2 px-2">{t.testName}</td>
                        <td className="py-2 px-2 capitalize">{t.status}</td>
                        <td className="py-2 px-2">
                          {t.resultFile ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => setSelectedReport(t.resultFile)}
                                className="text-blue-600 underline"
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  downloadImageAsPDF(
                                    t.resultFile,
                                    `${t.testName}.pdf`
                                  )
                                }
                                className="text-indigo-600 underline"
                              >
                                Download
                              </button>
                            </div>
                          ) : (
                            "Pending"
                          )}
                        </td>
                      </tr>
                    ))}
                    {patientData.labTests.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-gray-500"
                        >
                          No lab results available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "pres" && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
          <CreatePrescriptionForm />
          <div className="border rounded p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-3 text-gray-700">Prescriptions</h2>
            {patientData.prescriptions.length === 0 ? (
              <p className="text-gray-500 text-sm">No prescriptions found.</p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">Issued</th>
                      <th className="py-2 px-2">Medicines</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData.prescriptions.map((p) => (
                      <tr key={p._id} className="border-b align-top">
                        <td className="py-2 px-2">
                          {new Date(p.issuedDate).toLocaleString()}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => setSelectedMeds(p.medications)}
                            className="text-blue-600 underline"
                          >
                            View
                          </button>
                        </td>
                        <td className="py-2 px-2 capitalize">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Lab Lightbox */}
      <Dialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      >
        <Dialog.Panel className="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Lab Report</h2>
            <button
              className="text-gray-500 hover:text-red-500"
              onClick={() => setSelectedReport(null)}
            >
              ✕
            </button>
          </div>
          {selectedReport && (
            <iframe
              src={selectedReport}
              title="Lab Report"
              className="w-full h-[70vh] border rounded"
            />
          )}
        </Dialog.Panel>
      </Dialog>

      {/* Prescription Details Modal */}
      <Dialog
        open={!!selectedMeds}
        onClose={() => setSelectedMeds(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      >
        <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-3">Prescription Details</h2>
          <ul className="list-disc ml-5 text-sm">
            {selectedMeds?.map((m, i) => (
              <li key={i}>
                <strong>{m.name}</strong> — {m.dosage} • {m.frequency} •{" "}
                {m.duration}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right">
            <button
              onClick={() => setSelectedMeds(null)}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default DoctorPatientDetails;
