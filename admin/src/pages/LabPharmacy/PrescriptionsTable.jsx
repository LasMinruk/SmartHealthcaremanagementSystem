import React, { useState } from "react";
import { LabPharmacyApi } from "../../api/labPharmacyApi";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";

const useToken = () =>
  localStorage.getItem("aToken") || localStorage.getItem("token") || "";

const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    ready: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium capitalize ${map[status] || ""}`}
    >
      {status}
    </span>
  );
};

const PrescriptionsTable = ({ patientId, prescriptions = [], onChanged }) => {
  const token = useToken();
  const [loadingId, setLoadingId] = useState(null);
  const [disabledButtons, setDisabledButtons] = useState({});
  const [selectedMeds, setSelectedMeds] = useState(null);

  // ✅ Handle status update
  const setStatus = async (id, status) => {
    // Prevent double clicks instantly
    if (disabledButtons[id]) return;

    setDisabledButtons((prev) => ({ ...prev, [id]: true }));
    setLoadingId(id);

    try {
      const res = await LabPharmacyApi.updatePrescriptionStatus({
        token,
        prescriptionId: id,
        status,
      });

      if (res.success) {
        toast.success(`Prescription marked as ${status}.`);
        onChanged?.();
      } else {
        toast.error(res.message || "Update failed.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="border rounded p-4 bg-white shadow-sm lg:w-[935px]">
      <h2 className="font-semibold mb-3 text-gray-700">Prescriptions</h2>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b text-center text-gray-700 font-medium">
              <th className="py-2 px-2">Issued</th>
              <th className="py-2 px-2">Medicines</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50 transition">
                {/* Issued */}
                <td className="py-3 px-2 text-center">
                  {new Date(p.issuedDate).toLocaleString()}
                </td>

                {/* Medicines (View Button) */}
                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => setSelectedMeds(p.medications)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition"
                  >
                    View
                  </button>
                </td>

                {/* Status */}
                <td className="py-3 px-2 text-center">
                  <StatusBadge status={p.status} />
                </td>

                {/* Actions */}
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {["ready", "delivered", "cancelled"].map((st) => {
                      const isDisabled = disabledButtons[p._id];
                      const baseClasses =
                        "px-3 py-1 rounded text-white text-xs flex items-center justify-center gap-2 transition font-medium";

                      const colorClasses = isDisabled
                        ? "bg-gray-200 cursor-not-allowed text-gray-500"
                        : st === "ready"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : st === "delivered"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700";

                      return (
                        <button
                          key={st}
                          onClick={() => !isDisabled && setStatus(p._id, st)}
                          disabled={isDisabled || loadingId === p._id}
                          className={`${baseClasses} ${colorClasses}`}
                        >
                          {loadingId === p._id && !isDisabled && (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          )}
                          Mark {st}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}

            {prescriptions.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-gray-500 text-sm"
                >
                  No prescriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal for viewing medicines */}
      <Dialog
        open={!!selectedMeds}
        onClose={() => setSelectedMeds(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      >
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Prescription Medicines
          </h2>

          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            {selectedMeds?.map((m, i) => (
              <li key={i}>
                <strong>{m.name}</strong> — {m.dosage || "-"} •{" "}
                {m.frequency || "-"} • {m.duration || "-"}
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <button
              onClick={() => setSelectedMeds(null)}
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default PrescriptionsTable;
