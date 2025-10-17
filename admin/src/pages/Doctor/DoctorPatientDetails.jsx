import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { jsPDF } from "jspdf";
import axios from "axios";

const API_BASE = "http://localhost:4000";

const useToken = () =>
  localStorage.getItem("dToken") || localStorage.getItem("token") || "";
const useDoctorId = () =>
  localStorage.getItem("userId") || localStorage.getItem("doctorId") || "";

// Safe JSON parse helper
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    console.warn("safeJson: failed to parse JSON", err);
    return null;
  }
};

// Enhanced PDF generation with complete medical record
const generateComprehensivePDF = (patientData, patientName, patientId) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Helper to add new page if needed
  const checkAndAddPage = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 35, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont(undefined, "bold");
  pdf.text(`Medical Record of ${patientName}`, pageWidth / 2, 20, { align: "center" });
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: "center" });
  
  yPos = 50;
  pdf.setTextColor(0, 0, 0);

  // Patient Summary Section
  pdf.setFillColor(243, 244, 246);
  pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, "F");
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("Patient Summary", margin + 5, yPos);
  yPos += 15;

  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  
  const summaryData = [
    ["Patient ID:", patientId],
    ["Name:", patientName],
    ["Blood Group:", patientData.patientInfo?.bloodClass || patientData.patientInfo?.bloodType || "Not specified"],
    ["Contact:", patientData.patientInfo?.phone || "Not specified"],
    ["Email:", patientData.patientInfo?.email || "Not specified"],
    ["Address:", patientData.patientInfo?.address || "Not specified"],
    ["Allergies:", patientData.patientInfo?.allergies?.join?.(", ") || "None reported"],
    ["Weight:", patientData.patientInfo?.weight ? `${patientData.patientInfo.weight} kg` : "Not specified"],
    ["Height:", patientData.patientInfo?.height ? `${patientData.patientInfo.height} cm` : "Not specified"],
  ];

  summaryData.forEach(([label, value]) => {
    checkAndAddPage(10);
    pdf.setFont(undefined, "bold");
    pdf.text(label, margin + 5, yPos);
    pdf.setFont(undefined, "normal");
    pdf.text(String(value), margin + 50, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Latest Consultation Section
  const latestConsultation = patientData.consultations?.[0];
  if (latestConsultation) {
    checkAndAddPage(40);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, "F");
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Latest Consultation", margin + 5, yPos);
    yPos += 15;

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");

    const consultationData = [
      ["Date:", new Date(latestConsultation.createdAt).toLocaleString()],
      ["Diagnosis:", latestConsultation.diagnosis || "Not specified"],
      ["Status:", latestConsultation.status || "In progress"],
    ];

    consultationData.forEach(([label, value]) => {
      checkAndAddPage(10);
      pdf.setFont(undefined, "bold");
      pdf.text(label, margin + 5, yPos);
      pdf.setFont(undefined, "normal");
      const lines = pdf.splitTextToSize(String(value), pageWidth - margin - 55);
      lines.forEach(line => {
        checkAndAddPage(7);
        pdf.text(line, margin + 50, yPos);
        yPos += 7;
      });
    });

    // Vital Signs
    if (latestConsultation.vitalSigns) {
      checkAndAddPage(15);
      pdf.setFont(undefined, "bold");
      pdf.text("Vital Signs:", margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");

      const vitals = latestConsultation.vitalSigns;
      const vitalData = [
        ["BP:", vitals.bloodPressure || "-"],
        ["Heart Rate:", vitals.heartRate || "-"],
        ["Temperature:", vitals.temperature || "-"],
        ["O2 Saturation:", vitals.oxygenSaturation || "-"],
      ];

      vitalData.forEach(([label, value]) => {
        checkAndAddPage(7);
        pdf.text(`  ${label} ${value}`, margin + 10, yPos);
        yPos += 6;
      });
    }

    // Symptoms
    if (latestConsultation.symptoms?.length > 0) {
      checkAndAddPage(15);
      pdf.setFont(undefined, "bold");
      pdf.text("Symptoms:", margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      latestConsultation.symptoms.forEach(symptom => {
        checkAndAddPage(7);
        pdf.text(`  • ${symptom}`, margin + 10, yPos);
        yPos += 6;
      });
    }

    // Consultation Notes
    if (latestConsultation.consultationNotes) {
      checkAndAddPage(15);
      pdf.setFont(undefined, "bold");
      pdf.text("Consultation Notes:", margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      const notes = pdf.splitTextToSize(latestConsultation.consultationNotes, pageWidth - margin - 15);
      notes.forEach(line => {
        checkAndAddPage(7);
        pdf.text(line, margin + 10, yPos);
        yPos += 6;
      });
    }

    // Medications
    if (latestConsultation.medications?.length > 0) {
      checkAndAddPage(20);
      yPos += 5;
      pdf.setFont(undefined, "bold");
      pdf.text("Prescribed Medications:", margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");

      latestConsultation.medications.forEach((med, idx) => {
        checkAndAddPage(25);
        pdf.text(`${idx + 1}. ${med.name}`, margin + 10, yPos);
        yPos += 6;
        pdf.text(`   Dosage: ${med.dosage}, Frequency: ${med.frequency}`, margin + 10, yPos);
        yPos += 6;
        pdf.text(`   Duration: ${med.duration}`, margin + 10, yPos);
        yPos += 6;
        if (med.instructions) {
          const instructions = pdf.splitTextToSize(`   Instructions: ${med.instructions}`, pageWidth - margin - 15);
          instructions.forEach(line => {
            checkAndAddPage(6);
            pdf.text(line, margin + 10, yPos);
            yPos += 6;
          });
        }
        yPos += 3;
      });
    }

    // Follow-up
    if (latestConsultation.followUpRequired) {
      checkAndAddPage(20);
      yPos += 5;
      pdf.setFont(undefined, "bold");
      pdf.text("Follow-up Required:", margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      if (latestConsultation.followUpDate) {
        pdf.text(`  Date: ${new Date(latestConsultation.followUpDate).toLocaleDateString()}`, margin + 10, yPos);
        yPos += 6;
      }
      if (latestConsultation.followUpNotes) {
        const notes = pdf.splitTextToSize(`  Notes: ${latestConsultation.followUpNotes}`, pageWidth - margin - 15);
        notes.forEach(line => {
          checkAndAddPage(6);
          pdf.text(line, margin + 10, yPos);
          yPos += 6;
        });
      }
    }

    yPos += 10;
  }

  // Lab Tests Section
  if (patientData.labTests?.length > 0) {
    checkAndAddPage(30);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, "F");
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Lab Tests", margin + 5, yPos);
    yPos += 15;

    pdf.setFontSize(10);
    patientData.labTests.forEach((test, idx) => {
      checkAndAddPage(25);
      pdf.setFont(undefined, "bold");
      pdf.text(`${idx + 1}. ${test.testName}`, margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`   Status: ${test.status}`, margin + 10, yPos);
      yPos += 6;
      if (test.scheduledDate) {
        pdf.text(`   Scheduled: ${new Date(test.scheduledDate).toLocaleDateString()}`, margin + 10, yPos);
        yPos += 6;
      }
      if (test.description) {
        const desc = pdf.splitTextToSize(`   Description: ${test.description}`, pageWidth - margin - 15);
        desc.forEach(line => {
          checkAndAddPage(6);
          pdf.text(line, margin + 10, yPos);
          yPos += 6;
        });
      }
      if (test.resultNotes) {
        const notes = pdf.splitTextToSize(`   Result Notes: ${test.resultNotes}`, pageWidth - margin - 15);
        notes.forEach(line => {
          checkAndAddPage(6);
          pdf.text(line, margin + 10, yPos);
          yPos += 6;
        });
      }
      yPos += 5;
    });
    yPos += 5;
  }

  // Prescriptions Section
  if (patientData.prescriptions?.length > 0) {
    checkAndAddPage(30);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, "F");
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Prescription History", margin + 5, yPos);
    yPos += 15;

    pdf.setFontSize(10);
    patientData.prescriptions.forEach((prescription, idx) => {
      checkAndAddPage(30);
      pdf.setFont(undefined, "bold");
      pdf.text(`Prescription #${idx + 1}`, margin + 5, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`   Date: ${new Date(prescription.issuedDate).toLocaleString()}`, margin + 10, yPos);
      yPos += 6;
      pdf.text(`   Status: ${prescription.status}`, margin + 10, yPos);
      yPos += 6;

      if (prescription.medications?.length > 0) {
        pdf.setFont(undefined, "bold");
        pdf.text("   Medications:", margin + 10, yPos);
        yPos += 6;
        pdf.setFont(undefined, "normal");

        prescription.medications.forEach((med) => {
          checkAndAddPage(15);
          pdf.text(`     • ${med.name} - ${med.dosage}`, margin + 15, yPos);
          yPos += 6;
          pdf.text(`       ${med.frequency}, ${med.duration}`, margin + 15, yPos);
          yPos += 6;
        });
      }

      if (prescription.notes) {
        checkAndAddPage(10);
        const notes = pdf.splitTextToSize(`   Notes: ${prescription.notes}`, pageWidth - margin - 15);
        notes.forEach(line => {
          checkAndAddPage(6);
          pdf.text(line, margin + 10, yPos);
          yPos += 6;
        });
      }
      yPos += 8;
    });
  }

  // Footer on last page
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${totalPages} | Confidential Medical Record`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return pdf;
};

// Download image as PDF helper
const downloadImageAsPDF = async (url, filename = "lab-report.pdf") => {
  try {
    const pdf = new jsPDF();
    const res = await fetch(url);
    const blob = await res.blob();
    const img = URL.createObjectURL(blob);
    pdf.addImage(img, "JPEG", 10, 10, 180, 250);
    pdf.save(filename);
  } catch (err) {
    console.error("PDF download failed", err);
    alert("Failed to download file.");
  }
};

const DoctorPatientDetails = () => {
  const { id: patientId } = useParams();
  const token = useToken();
  const doctorId = useDoctorId();
  const { state } = useLocation();
  const navigate = useNavigate();
  const patientName = state?.patientName || "Patient";

  const [activeTab, setActiveTab] = useState("medical");
  const [patientData, setPatientData] = useState({
    labTests: [],
    prescriptions: [],
    consultations: [],
    patientInfo: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMeds, setSelectedMeds] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loading, setLoading] = useState(false);

  const canLoad = useMemo(() => Boolean(patientId), [patientId]);

  const ensureArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  };

  // Fetch data
  const fetchData = async () => {
    if (!canLoad) return;
    setLoading(true);
    try {
      const labRes = await fetch(`${API_BASE}/api/labpharmacy/patient/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const labData = await safeJson(labRes);
      const labTests = ensureArray(labData?.labTests) || [];
      const prescriptions = ensureArray(labData?.prescriptions) || [];

      let consultations = [];
      try {
        const consRes = await fetch(`${API_BASE}/api/doctor/consultations`, {
          method: "GET",
          headers: { "Content-Type": "application/json", dtoken: token },
        });
        if (consRes.ok) {
          const parsed = await safeJson(consRes);
          consultations = ensureArray(parsed?.consultations || parsed);
        }
      } catch (err) {
        console.warn("Failed to fetch consultations:", err);
      }

      consultations = consultations.filter((c) => {
        const pid = c?.patientId?.toString?.() || c?.patient?._id;
        return pid && pid.toString() === patientId.toString();
      });

      let patientInfo = null;
      try {
        const profileRes = await axios.post(`${API_BASE}/api/doctor/get-user-medical-record`, {
          headers: { "Content-Type": "application/json", token, dtoken: token },
          data: { userId: patientId },
        });
        
        if (profileRes.ok) {
          const parsed = await safeJson(profileRes);
          patientInfo = parsed?.userData || parsed?.patientInfo || parsed || null;
        }
        console.log("Patient profile response:", profileRes);
      } catch (err) {
        console.warn("Failed to fetch patient profile:", err);
      }

      setPatientData({ labTests, prescriptions, consultations, patientInfo });
    } catch (err) {
      console.error(err);
      alert("Failed to load patient data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token, patientId, refreshKey, canLoad]);

  const handleReload = () => setRefreshKey((k) => k + 1);

  const exportMedicalRecord = () => {
    try {
      const pdf = generateComprehensivePDF(patientData, patientName, patientId);
      pdf.save(`${patientName.replace(/\s+/g, "_")}_Medical_Record.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    }
  };

  const latestConsultation = ensureArray(patientData.consultations)[0] || null;
  const lastDiagnosis = latestConsultation?.diagnosis || "No diagnosis recorded";
  const latestVitals = latestConsultation?.vitalSigns || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <header className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Medical Records</h1>
            <p className="text-gray-600">Comprehensive health information for {patientName}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            ← Back to Patients
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full p-2 shadow-lg inline-flex gap-2">
          {[
            { id: "medical", label: "Medical Record", icon: "📋" },
            { id: "lab", label: "Lab Tests", icon: "🔬" },
            { id: "pres", label: "Prescriptions", icon: "💊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Medical Record Tab */}
      {activeTab === "medical" && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Summary Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Patient Summary</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportMedicalRecord}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200"
                  title="Export PDF"
                >
                  📄
                </button>
                <button
                  onClick={handleReload}
                  className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  title="Refresh"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <InfoField label="Name" value={patientName} />
              <InfoField label="Patient ID" value={patientId} mono />
              <InfoField label="Last Diagnosis" value={lastDiagnosis} />
              
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Latest Vital Signs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <VitalSign label="BP" value={latestVitals?.bloodPressure} />
                  <VitalSign label="HR" value={latestVitals?.heartRate} />
                  <VitalSign label="Temp" value={latestVitals?.temperature} />
                  <VitalSign label="O2" value={latestVitals?.oxygenSaturation} />
                  <VitalSign label="Weight" value={latestVitals?.weight} />
                  <VitalSign label="Height" value={latestVitals?.height} />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <InfoField label="Blood Group" value={patientData.patientInfo?.bloodClass || patientData.patientInfo?.bloodType} />
                <InfoField label="Allergies" value={patientData.patientInfo?.allergies?.join?.(", ")} />
                <InfoField label="Contact" value={patientData.patientInfo?.phone} />
                <InfoField label="Email" value={patientData.patientInfo?.email} />
                <InfoField label="Address" value={patientData.patientInfo?.address} />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h4>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Consultations" value={ensureArray(patientData.consultations).length} color="blue" />
                  <StatCard label="Lab Tests" value={ensureArray(patientData.labTests).length} color="purple" />
                  <StatCard label="Prescriptions" value={ensureArray(patientData.prescriptions).length} color="green" />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Consultation Highlight */}
            {latestConsultation && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Latest Consultation</h3>
                <ConsultationCard consultation={latestConsultation} detailed onClick={() => setSelectedConsultation(latestConsultation)} />
              </div>
            )}

            {/* Medical Timeline */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Medical Timeline</h3>
              <div className="space-y-4">
                {buildTimeline(patientData).map((item, idx) => (
                  <TimelineItem key={idx} item={item} onViewReport={setSelectedReport} onViewMeds={setSelectedMeds} onViewConsultation={setSelectedConsultation} />
                ))}
                {buildTimeline(patientData).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No medical events recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Tests Tab */}
      {activeTab === "lab" && !loading && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreateLabOrderForm doctorId={doctorId} patientId={patientId} token={token} onSuccess={handleReload} />
          <LabTestsTable labTests={patientData.labTests} onViewReport={setSelectedReport} />
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "pres" && !loading && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreatePrescriptionForm doctorId={doctorId} patientId={patientId} token={token} onSuccess={handleReload} />
          <PrescriptionsTable prescriptions={patientData.prescriptions} onViewMeds={setSelectedMeds} />
        </div>
      )}

      {/* Modals */}
      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      <MedicationsModal medications={selectedMeds} onClose={() => setSelectedMeds(null)} />
      <ConsultationModal consultation={selectedConsultation} onClose={() => setSelectedConsultation(null)} />
    </div>
  );
};

// Helper Components
const InfoField = ({ label, value, mono = false }) => (
  <div className="mb-3">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-sm font-medium text-gray-800 ${mono ? "font-mono text-xs" : ""}`}>
      {value || "Not specified"}
    </div>
  </div>
);

const VitalSign = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-sm font-semibold text-gray-800">{value || "-"}</div>
  </div>
);

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };
  
  return (
    <div className={`${colors[color]} border rounded-lg p-2 text-center`}>
      <div className="text-xs mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};

const ConsultationCard = ({ consultation, detailed = false, onClick }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={onClick}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-gray-800">{consultation.diagnosis || "Consultation"}</h4>
        <p className="text-xs text-gray-500">{new Date(consultation.createdAt).toLocaleString()}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        consultation.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}>
        {consultation.status}
      </span>
    </div>
    
    {detailed && (
      <div className="space-y-2 text-sm">
        {consultation.symptoms?.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Symptoms:</span>
            <span className="ml-2 text-gray-600">{consultation.symptoms.join(", ")}</span>
          </div>
        )}
        {consultation.consultationNotes && (
          <div>
            <span className="font-medium text-gray-700">Notes:</span>
            <p className="text-gray-600 mt-1">{consultation.consultationNotes}</p>
          </div>
        )}
        {consultation.medications?.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Medications:</span>
            <ul className="ml-4 mt-1 text-gray-600">
              {consultation.medications.slice(0, 3).map((med, i) => (
                <li key={i}>• {med.name} - {med.dosage}</li>
              ))}
              {consultation.medications.length > 3 && <li>• +{consultation.medications.length - 3} more...</li>}
            </ul>
          </div>
        )}
      </div>
    )}
    <div className="mt-3 text-xs text-blue-600 font-medium">Click for full details →</div>
  </div>
);

const TimelineItem = ({ item, onViewReport, onViewMeds, onViewConsultation }) => {
  const icons = { consultation: "👨‍⚕️", lab: "🔬", prescription: "💊" };
  const colors = { consultation: "bg-blue-100 text-blue-700", lab: "bg-purple-100 text-purple-700", prescription: "bg-green-100 text-green-700" };
  
  return (
    <div className="flex gap-4 hover:bg-gray-50 p-4 rounded-lg transition-all duration-200">
      <div className={`${colors[item.type]} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
        {icons[item.type]}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-800">{item.title}</h4>
            <p className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</p>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">{item.type}</span>
        </div>
        
        {item.type === "consultation" && (
          <div className="text-sm text-gray-600">
            <p className="mb-1"><strong>Diagnosis:</strong> {item.raw.diagnosis || "-"}</p>
            {item.raw.symptoms?.length > 0 && (
              <p className="mb-1"><strong>Symptoms:</strong> {item.raw.symptoms.join(", ")}</p>
            )}
            <button
              onClick={() => onViewConsultation(item.raw)}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View Details →
            </button>
          </div>
        )}
        
        {item.type === "lab" && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Status: <span className="font-medium capitalize">{item.raw.status}</span></span>
            {item.raw.resultFile && (
              <div className="flex gap-2">
                <button onClick={() => onViewReport(item.raw.resultFile)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Report
                </button>
                <button onClick={() => downloadImageAsPDF(item.raw.resultFile, `${item.raw.testName}.pdf`)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Download
                </button>
              </div>
            )}
          </div>
        )}
        
        {item.type === "prescription" && (
          <div>
            <p className="text-sm text-gray-600 mb-2">{item.raw.medications?.length || 0} medication(s) prescribed</p>
            <button onClick={() => onViewMeds(item.raw.medications)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Medications →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CreateLabOrderForm = ({ doctorId, patientId, token, onSuccess }) => {
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const submit = async (e) => {
    e.preventDefault();
    if (!testName || !description) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/labpharmacy/lab/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, patientId, testName, description, scheduledDate }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTestName("");
        setDescription("");
        setScheduledDate("");
        onSuccess();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to create lab order");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Create Lab Test Order</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Test Name *</label>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Scheduled Date</label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={today}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
        
        <button
          disabled={submitting}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
        >
          {submitting ? "Creating..." : "Create Lab Order"}
        </button>
      </form>
    </div>
  );
};

const LabTestsTable = ({ labTests, onViewReport }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Lab Reports</h2>
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="py-3 px-4 font-semibold text-gray-700">Test Name</th>
            <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
            <th className="py-3 px-4 font-semibold text-gray-700">Result</th>
          </tr>
        </thead>
        <tbody>
          {labTests.map((t) => (
            <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">{t.testName}</td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  t.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {t.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {t.resultFile ? (
                  <div className="flex gap-3">
                    <button onClick={() => onViewReport(t.resultFile)} className="text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </button>
                    <button onClick={() => downloadImageAsPDF(t.resultFile, `${t.testName}.pdf`)} className="text-indigo-600 hover:text-indigo-800 font-medium">
                      Download
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500">Pending</span>
                )}
              </td>
            </tr>
          ))}
          {labTests.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-gray-500">No lab tests found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const CreatePrescriptionForm = ({ doctorId, patientId, token, onSuccess }) => {
  const [notes, setNotes] = useState("");
  const [medications, setMeds] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const addRow = () => setMeds((a) => [...a, { name: "", dosage: "", frequency: "", duration: "" }]);
  const setField = (idx, key, val) => setMeds((a) => a.map((m, i) => (i === idx ? { ...m, [key]: val } : m)));
  const removeRow = (idx) => setMeds((a) => a.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (!medications.every((m) => m.name)) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/labpharmacy/pharmacy/prescribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, patientId, medications, notes }),
      });
      const data = await res.json();
      
      if (data.success) {
        setNotes("");
        setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]);
        onSuccess();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to create prescription");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Create Prescription</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Medications</label>
          {medications.map((m, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Medicine name"
                value={m.name}
                onChange={(e) => setField(idx, "name", e.target.value)}
                required
              />
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Dosage"
                value={m.dosage}
                onChange={(e) => setField(idx, "dosage", e.target.value)}
              />
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Frequency"
                value={m.frequency}
                onChange={(e) => setField(idx, "frequency", e.target.value)}
              />
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Duration"
                value={m.duration}
                onChange={(e) => setField(idx, "duration", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addRow} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200">
            + Add Medicine
          </button>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        <button
          disabled={submitting}
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
        >
          {submitting ? "Creating..." : "Create Prescription"}
        </button>
      </form>
    </div>
  );
};

const PrescriptionsTable = ({ prescriptions, onViewMeds }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Prescriptions</h2>
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="py-3 px-4 font-semibold text-gray-700">Issued Date</th>
            <th className="py-3 px-4 font-semibold text-gray-700">Medications</th>
            <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((p) => (
            <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">{new Date(p.issuedDate).toLocaleDateString()}</td>
              <td className="py-3 px-4">
                <button onClick={() => onViewMeds(p.medications)} className="text-blue-600 hover:text-blue-800 font-medium">
                  View ({p.medications?.length || 0} items)
                </button>
              </td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === "delivered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
          {prescriptions.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-gray-500">No prescriptions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ReportModal = ({ report, onClose }) => (
  <Dialog open={!!report} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <Dialog.Panel className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Lab Report</h2>
        <button className="text-gray-500 hover:text-red-500 text-2xl" onClick={onClose}>×</button>
      </div>
      {report && <iframe src={report} title="Lab Report" className="w-full h-[70vh] border rounded-lg" />}
    </Dialog.Panel>
  </Dialog>
);

const MedicationsModal = ({ medications, onClose }) => (
  <Dialog open={!!medications} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <Dialog.Panel className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Prescription Details</h2>
      <div className="space-y-3 max-h-96 overflow-auto">
        {medications?.map((m, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800">{m.name}</h3>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <p><strong>Dosage:</strong> {m.dosage}</p>
              <p><strong>Frequency:</strong> {m.frequency}</p>
              <p><strong>Duration:</strong> {m.duration}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
          Close
        </button>
      </div>
    </Dialog.Panel>
  </Dialog>
);

const ConsultationModal = ({ consultation, onClose }) => (
  <Dialog open={!!consultation} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <Dialog.Panel className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Consultation Details</h2>
        <button className="text-gray-500 hover:text-red-500 text-2xl" onClick={onClose}>×</button>
      </div>
      
      {consultation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Date</label>
              <p className="text-gray-800">{new Date(consultation.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-800 capitalize">{consultation.status}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Diagnosis</label>
            <p className="text-gray-800">{consultation.diagnosis || "Not specified"}</p>
          </div>
          
          {consultation.symptoms?.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">Symptoms</label>
              <ul className="list-disc ml-5 text-gray-800">
                {consultation.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          
          {consultation.vitalSigns && (
            <div>
              <label className="text-sm font-medium text-gray-600">Vital Signs</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {Object.entries(consultation.vitalSigns).map(([key, value]) => (
                  value && <div key={key} className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {consultation.consultationNotes && (
            <div>
              <label className="text-sm font-medium text-gray-600">Consultation Notes</label>
              <p className="text-gray-800 bg-gray-50 p-3 rounded mt-1">{consultation.consultationNotes}</p>
            </div>
          )}
          
          {consultation.medications?.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">Medications</label>
              <div className="space-y-2 mt-2">
                {consultation.medications.map((med, i) => (
                  <div key={i} className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-semibold text-gray-800">{med.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Dosage: {med.dosage} • Frequency: {med.frequency} • Duration: {med.duration}</p>
                      {med.instructions && <p className="mt-1">Instructions: {med.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {consultation.followUpRequired && (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <label className="text-sm font-medium text-gray-600">Follow-up Required</label>
              {consultation.followUpDate && (
                <p className="text-gray-800 mt-1">Date: {new Date(consultation.followUpDate).toLocaleDateString()}</p>
              )}
              {consultation.followUpNotes && (
                <p className="text-gray-800 mt-1">{consultation.followUpNotes}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-right">
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
          Close
        </button>
      </div>
    </Dialog.Panel>
  </Dialog>
);

const buildTimeline = (patientData) => {
  const items = [];
  
  patientData.consultations?.forEach((c) => {
    items.push({
      type: "consultation",
      date: c.createdAt || c.updatedAt,
      title: c.diagnosis || "Consultation",
      raw: c,
    });
  });
  
  patientData.labTests?.forEach((l) => {
    items.push({
      type: "lab",
      date: l.updatedAt || l.createdAt || l.scheduledDate,
      title: `Lab: ${l.testName}`,
      raw: l,
    });
  });
  
  patientData.prescriptions?.forEach((p) => {
    items.push({
      type: "prescription",
      date: p.issuedDate || p.updatedAt,
      title: "Prescription",
      raw: p,
    });
  });
  
  return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

export default DoctorPatientDetails;