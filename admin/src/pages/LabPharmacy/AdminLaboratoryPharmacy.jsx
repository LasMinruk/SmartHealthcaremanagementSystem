import React, { useEffect, useState, useMemo } from "react";
import UploadLabResultDialog from "./UploadLabResultDialog";
import LabOrdersTable from "./LabOrdersTable";
import PrescriptionsTable from "./PrescriptionsTable";
import { LabPharmacyApi } from "../../api/labPharmacyApi";
import axios from "axios";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const useToken = () =>
  localStorage.getItem("aToken") || localStorage.getItem("token") || "";

const AdminLaboratoryPharmacy = () => {
  const token = useToken();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientData, setPatientData] = useState({
    labTests: [],
    prescriptions: [],
  });
  const [allLabTests, setAllLabTests] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("lab");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canLoad = useMemo(
    () => Boolean(selectedPatient?._id),
    [selectedPatient]
  );

  // Fetch all patients and highlights
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingPatients(true);
        const { data } = await axios.get(`${backendUrl}/api/admin/appointments`, {
          headers: { aToken: token },
        });
        if (!data.success) return toast.error(data.message);

        const uniquePatients = [
          ...new Map(data.appointments.map((a) => [a.userId, a.userData])).values(),
        ];
        setPatients(uniquePatients);

        // Fetch all labs and prescriptions for highlight
        const [labsRes, presRes] = await Promise.all([
          LabPharmacyApi.getAllLabTests({ token }),
          LabPharmacyApi.getAllPrescriptions({ token }),
        ]);
        if (labsRes.success) setAllLabTests(labsRes.labTests || []);
        if (presRes.success) setAllPrescriptions(presRes.prescriptions || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchAllData();
  }, [token, refreshKey]);

  // Fetch single patient’s records when selected
  useEffect(() => {
    const fetchData = async () => {
      if (!canLoad) return;
      try {
        setLoadingPatientData(true);
        const res = await LabPharmacyApi.getPatientLabAndRx({
          token,
          patientId: selectedPatient._id,
        });
        if (res.success) {
          setPatientData({
            labTests: res.labTests || [],
            prescriptions: res.prescriptions || [],
          });
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingPatientData(false);
      }
    };
    fetchData();
  }, [token, selectedPatient, refreshKey, canLoad]);

  const handleUploaded = () => setRefreshKey((k) => k + 1);
  const handleChanged = () => setRefreshKey((k) => k + 1);

  const getPatientHighlight = (p) => {
    const hasNewLab = allLabTests.some(
      (t) => t.patientId === p._id && ["pending", "scheduled"].includes(t.status)
    );
    const hasNewRx = allPrescriptions.some(
      (r) => r.patientId === p._id && r.status === "pending"
    );
    return hasNewLab || hasNewRx;
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export PDF for all patients
  const exportPDF = () => {
    if (filteredPatients.length === 0) {
      return toast.error("No patients available to export.");
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Patients Lab & Pharmacy Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["#", "Patient", "Email", "Lab Tests", "Prescriptions"];
    const tableRows = filteredPatients.map((p, index) => [
      index + 1,
      p.name,
      p.email,
      allLabTests.filter((t) => t.patientId === p._id).length,
      allPrescriptions.filter((r) => r.patientId === p._id).length,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("Patients_Report.pdf");
  };

  return (
    <div className="p-6">
      <header className="mb-6 text-center border-b pb-3">
        <h1 className="text-2xl font-semibold text-gray-800">
          Laboratory & Pharmacy Management
        </h1>
        <p className="text-sm text-gray-500">
          View all patients and manage lab results & prescriptions.
        </p>
      </header>

      {/* Search & Export */}
      {!selectedPatient && (
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-teal-600 transition-all"
          >
            Export PDF
          </button>
        </div>
      )}

      {/* Patients Grid */}
      {!selectedPatient && (
        <div className="mt-4">
          <h2 className="font-medium mb-3 text-gray-700">Patients</h2>
          {loadingPatients ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPatients.map((p) => {
                const highlight = getPatientHighlight(p);
                return (
                  <div
                    key={p._id}
                    onClick={() => setSelectedPatient(p)}
                    className={`relative p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                      highlight ? "bg-yellow-50" : "bg-white"
                    }`}
                  >
                    {highlight && (
                      <span className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                    )}
                    <img
                      src={p.image}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover mb-2"
                    />
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                );
              })}
              {filteredPatients.length === 0 && (
                <p className="text-gray-500 text-sm col-span-full text-center">
                  No patients found.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patient Detail Tabs */}
      {selectedPatient && (
        <div className="mt-6 lg:w-[935px]">
          <button
            onClick={() => setSelectedPatient(null)}
            className="text-sm mb-4 text-blue-600 hover:underline"
          >
            ← Back to Patients
          </button>

          <h2 className="text-xl font-semibold mb-4">{selectedPatient.name}'s Records</h2>

          <div className="flex bg-blue-100 rounded-full m-auto p-1 w-fit mb-6">
            <button
              onClick={() => setActiveTab("lab")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "lab" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Laboratory
            </button>
            <button
              onClick={() => setActiveTab("pharmacy")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "pharmacy" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Pharmacy
            </button>
          </div>

          {loadingPatientData ? (
            <div className="flex justify-center py-20">
              <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <>
              {activeTab === "lab" && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
                  <UploadLabResultDialog
                    labTests={patientData.labTests}
                    onUploaded={handleUploaded}
                  />
                  <LabOrdersTable labTests={patientData.labTests} />
                </section>
              )}
              {activeTab === "pharmacy" && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
                  <PrescriptionsTable
                    patientId={selectedPatient._id}
                    prescriptions={patientData.prescriptions}
                    onChanged={handleChanged}
                  />
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLaboratoryPharmacy;
