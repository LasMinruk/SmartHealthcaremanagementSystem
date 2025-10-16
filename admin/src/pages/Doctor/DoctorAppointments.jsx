// src/pages/doctor/DoctorAppointments.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import axios from "axios";

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
  } = useContext(DoctorContext);
  const navigate = useNavigate();
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    if (dToken) getAppointments();
  }, [dToken]);

  // Filter appointments by patient name
  const filteredAppointments = appointments.filter((item) =>
    item.userData.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to view consultation records
  const viewConsultationRecords = (appointment) => {
    setSelectedAppointment(appointment);
    setShowConsultationModal(true);
  };

  // Function to close consultation modal
  const closeConsultationModal = () => {
    setShowConsultationModal(false);
    setSelectedAppointment(null);
  };


  // Function to download consultation report PDF
  const downloadConsultationReportPDF = async () => {
    if (!selectedAppointment?.consultation) {
      toast.error('No consultation notes found to download');
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/doctor/download-consultation-report?appointmentId=${selectedAppointment._id}`,
        { 
          headers: { dtoken: dToken },
          responseType: 'blob'
        }
      );
      
      // Check if response is actually a PDF (blob) or an error (JSON)
      if (response.data.type === 'application/json') {
        // If it's JSON, it means there was an error
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.message || 'Failed to download consultation report');
        return;
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const patientName = selectedAppointment.userData.name;
      const date = new Date().toISOString().split('T')[0];
      const filename = `Consultation_Report_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Consultation report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading consultation report:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle different types of errors
      if (error.response?.data?.message) {
        toast.error(`Failed to download consultation report: ${error.response.data.message}`);
      } else if (error.response?.status === 500) {
        toast.error('Server error while generating PDF. Please try again.');
      } else {
        toast.error('Failed to download consultation report');
      }
    }
  };

  // ✅ PDF Export Function
  const exportPDF = () => {
    if (!filteredAppointments || filteredAppointments.length === 0) {
      alert("No appointments to export!");
      return;
    }

    const doc = new jsPDF();
    const title = "Doctor Appointment Report";
    const date = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);

    const tableColumn = [
      "#",
      "Patient Name",
      "Payment",
      "Age",
      "Date & Time",
      "Fees",
      "Status",
    ];

    const tableRows = filteredAppointments.map((item, index) => {
      const status = item.cancelled
        ? "Cancelled"
        : item.isCompleted
        ? "Completed"
        : "Pending";

      return [
        index + 1,
        item.userData?.name || "N/A",
        item.payment ? "Online" : "Cash",
        calculateAge(item.userData?.dob),
        `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
        `${currency}${item.amount}`,
        status,
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("Doctor_Appointments_Report.pdf");
  };

  return (
    <div className="w-full max-w-6xl m-5">
      {/* Header & Search Bar */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <p className="text-lg font-medium">All Appointments</p>

        <div className="flex gap-3">
          {/* Modern Search Bar */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 transition-all"
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
      </div>

      {/* Appointments List */}
      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Records</p>
          <p>Action</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap justify-between max-sm:gap-5 sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
          >
            <p className="max-sm:hidden">{index + 1}</p>

            <div
              className="flex items-center gap-2 cursor-pointer hover:text-primary"
              onClick={() =>
                navigate(`/doctor/patient/${item.userId}`, {
                  state: { patientName: item.userData.name },
                })
              }
            >
              <img
                src={item.userData.image}
                className="w-8 h-8 rounded-full"
                alt=""
              />
              <p>{item.userData.name}</p>
            </div>

            <div>
              <p className="text-xs inline border border-primary px-2 rounded-full">
                {item.payment ? "Online" : "Cash"}
              </p>
            </div>
            <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
            <p>
              {currency}
              {item.amount}
            </p>

            {/* Consultation Records Column */}
            <div className="flex items-center gap-2">
              {item.consultation ? (
                <button
                  onClick={() => viewConsultationRecords(item)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-all"
                >
                  📋 View Records
                </button>
              ) : (
                <span className="text-gray-400 text-xs">No Records</span>
              )}
            </div>

            {item.cancelled ? (
              <p className="text-red-400 text-xs font-medium">Cancelled</p>
            ) : item.isCompleted ? (
              <p className="text-green-500 text-xs font-medium">Completed</p>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/consultation/${item._id}`)}
                  className="px-3 py-1 text-sm border rounded hover:bg-primary hover:text-white transition-all"
                >
                  Start Consultation
                </button>
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-8 cursor-pointer"
                  src={assets.cancel_icon}
                  alt="Cancel"
                />
                <img
                  onClick={() => completeAppointment(item._id)}
                  className="w-8 cursor-pointer"
                  src={assets.tick_icon}
                  alt="Complete"
                />
              </div>
            )}
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <p className="text-center text-gray-500 py-6">No appointments found.</p>
        )}
      </div>

      {/* Consultation Records Modal */}
      {showConsultationModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Consultation Records - {selectedAppointment.userData.name}
                </h2>
                <button
                  onClick={closeConsultationModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedAppointment.consultation ? (
                <div className="space-y-6">
                  {/* Patient & Appointment Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Patient:</span>
                        <span className="ml-2">{selectedAppointment.userData.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Age:</span>
                        <span className="ml-2">{calculateAge(selectedAppointment.userData.dob)} years</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Date:</span>
                        <span className="ml-2">{slotDateFormat(selectedAppointment.slotDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Time:</span>
                        <span className="ml-2">{selectedAppointment.slotTime}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          selectedAppointment.consultation.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedAppointment.consultation.status}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Created:</span>
                        <span className="ml-2">
                          {new Date(selectedAppointment.consultation.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {selectedAppointment.consultation.diagnosis && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Diagnosis</h3>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedAppointment.consultation.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Consultation Notes */}
                  {selectedAppointment.consultation.consultationNotes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Consultation Notes</h3>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {selectedAppointment.consultation.consultationNotes}
                      </p>
                    </div>
                  )}

                  {/* Medications */}
                  {selectedAppointment.consultation.medications && selectedAppointment.consultation.medications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Prescribed Medications</h3>
                      <div className="space-y-3">
                        {selectedAppointment.consultation.medications.map((med, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-blue-800">{med.name}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-blue-700">Dosage:</span>
                                <span className="ml-2 text-blue-600">{med.dosage}</span>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Frequency:</span>
                                <span className="ml-2 text-blue-600">{med.frequency}</span>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Duration:</span>
                                <span className="ml-2 text-blue-600">{med.duration}</span>
                              </div>
                              {med.instructions && (
                                <div className="col-span-2">
                                  <span className="font-medium text-blue-700">Instructions:</span>
                                  <p className="text-blue-600 mt-1">{med.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Information */}
                  {selectedAppointment.consultation.followUpRequired && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Follow-up Required</h3>
                      {selectedAppointment.consultation.followUpDate && (
                        <p className="text-yellow-700 mb-2">
                          <span className="font-medium">Follow-up Date:</span> {new Date(selectedAppointment.consultation.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                      {selectedAppointment.consultation.followUpNotes && (
                        <p className="text-yellow-700">
                          <span className="font-medium">Notes:</span> {selectedAppointment.consultation.followUpNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t">
                    {/* PDF Actions */}
                    <button
                      onClick={downloadConsultationReportPDF}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
                    >
                      📄 Download PDF
                    </button>
                    
                    {/* Other Actions */}
                    <div className="flex gap-3">
                      {!selectedAppointment.isCompleted && (
                        <button
                          onClick={() => {
                            closeConsultationModal();
                            navigate(`/consultation/${selectedAppointment._id}`);
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
                        >
                          Continue Consultation
                        </button>
                      )}
                      <button
                        onClick={closeConsultationModal}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultation Records</h3>
                  <p className="text-gray-500 mb-4">No consultation notes have been recorded for this appointment yet.</p>
                  
                  {!selectedAppointment.isCompleted && (
                    <button
                      onClick={() => {
                        closeConsultationModal();
                        navigate(`/consultation/${selectedAppointment._id}`);
                      }}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
                    >
                      Start Consultation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
