// src/pages/doctor/DoctorDashboard.jsx
import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DoctorDashboard = () => {
  const {
    dToken,
    dashData,
    getDashData,
    cancelAppointment,
    completeAppointment,
  } = useContext(DoctorContext);
  const { slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  // 🧾 Export Dashboard Data to PDF
  const exportDashboardPDF = () => {
    if (!dashData) {
      alert("No dashboard data to export!");
      return;
    }

    const doc = new jsPDF();
    const title = "Doctor Dashboard Report";
    const date = new Date().toLocaleString();

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);

    // Summary section (without title)
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Earnings: ${currency}${dashData.earnings}`, 14, 42);
    doc.text(`Appointments: ${dashData.appointments}`, 14, 48);
    doc.text(`Active Patients: ${dashData.patients}`, 14, 54);

    // Add space before the table
    const tableY = 66;

    // Table Title: "Latest Bookings"
    doc.setFontSize(13);
    doc.text("Latest Bookings:", 14, tableY);

    // Table for Latest Bookings
    const tableColumn = ["#", "Patient Name", "Date", "Status"];
    const tableRows = dashData.latestAppointments.slice(0, 5).map((item, index) => {
      const status = item.cancelled
        ? "Cancelled"
        : item.isCompleted
        ? "Completed"
        : "Pending";
      return [
        index + 1,
        item.userData?.name || "N/A",
        slotDateFormat(item.slotDate),
        status,
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableY + 6,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("Doctor_Dashboard_Report.pdf");
  };

  return (
    dashData && (
      <div className="m-5">
        {/* Header + Export Button */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-700">
            Doctor Dashboard
          </h2>
          {/* ✅ Export PDF Button to right with spacing */}
          <button
            onClick={exportDashboardPDF}
            className="ml-auto px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-all"
          >
            Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.earning_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                Rs : {dashData.earnings}
              </p>
              <p className="text-gray-400">Earnings</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.appointments_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.appointments}
              </p>
              <p className="text-gray-400">Appointments</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.patients_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.patients}
              </p>
              <p className="text-gray-400">Active Patients</p>
            </div>
          </div>
        </div>

        {/* Latest Bookings Section */}
        <div className="bg-white mt-10 rounded border">
          <div className="flex items-center gap-2.5 px-4 py-4 rounded-t border-b">
            <img src={assets.list_icon} alt="" />
            <p className="font-semibold">Latest Bookings</p>
          </div>

          <div className="pt-4">
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div
                className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
                key={index}
              >
                <img
                  className="rounded-full w-10"
                  src={item.userData.image}
                  alt=""
                />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">
                    {item.userData.name}
                  </p>
                  <p className="text-gray-600">
                    Booking on {slotDateFormat(item.slotDate)}
                  </p>
                </div>
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">Completed</p>
                ) : (
                  <div className="flex">
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.cancel_icon}
                      alt="Cancel"
                    />
                    <img
                      onClick={() => completeAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.tick_icon}
                      alt="Complete"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;
