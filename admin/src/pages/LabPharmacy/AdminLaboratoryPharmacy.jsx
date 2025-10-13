import React, { useEffect, useState, useMemo } from "react";
import UploadLabResultDialog from "./UploadLabResultDialog";
import LabOrdersTable from "./LabOrdersTable";
import PrescriptionsTable from "./PrescriptionsTable";
import { LabPharmacyApi } from "../../api/labPharmacyApi";
import axios from "axios";
import { toast } from "react-toastify";

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

  const canLoad = useMemo(
    () => Boolean(selectedPatient?._id),
    [selectedPatient]
  );

  // Fetch all patients, labs, and prescriptions once
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingPatients(true);

        // Fetch appointments → unique patients
        const { data } = await axios.get(
          `${backendUrl}/api/admin/appointments`,
          {
            headers: { aToken: token },
          }
        );
        if (!data.success) return toast.error(data.message);

        const uniquePatients = [
          ...new Map(
            data.appointments.map((a) => [a.userId, a.userData])
          ).values(),
        ];
        setPatients(uniquePatients);

        // Fetch all labs and prescriptions for highlight
        const [labsRes, presRes] = await Promise.all([
          LabPharmacyApi.getAllLabTests({ token }),
          LabPharmacyApi.getAllPrescriptions({ token }),
        ]);
        console.log("lab test", labsRes);
        console.log("prescription", presRes);
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
      (t) =>
        t.patientId === p._id && ["pending", "scheduled"].includes(t.status)
    );

    const hasNewRx = allPrescriptions.some(
      (r) => r.patientId === p._id && r.status === "pending"
    );

    return hasNewLab || hasNewRx;
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
              {patients.map((p) => {
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
              {patients.length === 0 && (
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

          <h2 className="text-xl font-semibold mb-4">
            {selectedPatient.name}'s Records
          </h2>

          <div className="flex bg-blue-100 rounded-full m-auto p-1 w-fit mb-6">
            <button
              onClick={() => setActiveTab("lab")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "lab"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Laboratory
            </button>
            <button
              onClick={() => setActiveTab("pharmacy")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "pharmacy"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-blue-600"
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
