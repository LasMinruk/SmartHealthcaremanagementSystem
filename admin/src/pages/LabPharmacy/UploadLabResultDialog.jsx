import React, { useMemo, useState } from "react";
import { LabPharmacyApi } from "../../api/labPharmacyApi";
import { toast } from "react-toastify";

const useToken = () => localStorage.getItem("aToken") || localStorage.getItem("token") || "";

const UploadLabResultDialog = ({ labTests = [], onUploaded }) => {
  const token = useToken();
  const [labTestId, setLabTestId] = useState("");
  const [resultFile, setResultFile] = useState(null);
  const [resultNotes, setResultNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pendingOrInProgress = useMemo(
    () => labTests.filter((t) => t.status !== "completed"),
    [labTests]
  );

  const canSubmit = labTestId && resultFile;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const res = await LabPharmacyApi.uploadLabResult({
        token,
        labTestId,
        file: resultFile,
        resultNotes,
      });

      if (res.success) {
        toast.success("Lab result uploaded successfully!");
        onUploaded?.();
        setLabTestId("");
        setResultFile(null);
        setResultNotes("");
      } else {
        toast.error(res.message || "Upload failed.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="border rounded p-4 bg-white shadow-sm">
      <h2 className="font-semibold mb-3 text-gray-700">Upload Lab Result</h2>

      <label className="text-sm block mb-1">Select Lab Test</label>
      <select
        className="border rounded w-full px-3 py-2 mb-3"
        value={labTestId}
        onChange={(e) => setLabTestId(e.target.value)}
      >
        <option value="">-- Choose --</option>
        {pendingOrInProgress.map((t) => (
          <option key={t._id} value={t._id}>
            {t.testName} ({t.status})
          </option>
        ))}
      </select>

      <label className="text-sm block mb-1">Result File (PDF/Image)</label>
      <input
        className="border rounded w-full px-3 py-2 mb-3"
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => setResultFile(e.target.files?.[0] || null)}
      />

      <label className="text-sm block mb-1">Result Notes (optional)</label>
      <textarea
        className="border rounded w-full px-3 py-2 mb-4"
        rows={3}
        value={resultNotes}
        onChange={(e) => setResultNotes(e.target.value)}
      />

      <button
        disabled={!canSubmit || submitting}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        )}
        Upload
      </button>
    </form>
  );
};

export default UploadLabResultDialog;
