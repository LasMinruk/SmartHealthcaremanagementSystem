// src/pages/doctor/DoctorAppointments.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  useEffect(() => {
    if (dToken) getAppointments();
  }, [dToken]);

  // Filter appointments by patient name
  const filteredAppointments = appointments.filter((item) =>
    item.userData.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap justify-between max-sm:gap-5 sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
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

            {item.cancelled ? (
              <p className="text-red-400 text-xs font-medium">Cancelled</p>
            ) : item.isCompleted ? (
              <p className="text-green-500 text-xs font-medium">Completed</p>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/video/${item._id}`)}
                  className="px-3 py-1 text-sm border rounded hover:bg-primary hover:text-white transition-all"
                >
                  Join Video
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
    </div>
  );
};

export default DoctorAppointments;
