import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MyAppointments = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState("");
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insuranceId, setInsuranceId] = useState("");

  const insuranceCompanies = [
    "AIA Sri Lanka",
    "Fairfirst Insurance Limited",
    "Allianz Insurance Lanka Ltd",
    "Amana Takaful Life PLC",
    "HNB Assurance PLC",
    "Co-Operative Insurance Comp",
    "Janashakthi Insurance PLC",
    "Sri Lanka Insurance",
    "Ceylinco Life",
  ];

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Format Date (20_01_2000 => 20 Jan 2000)
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2];
  };

  // Get User Appointments
  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Cancel Appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else toast.error(data.message);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Payment (Stripe)
  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-stripe`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        window.location.replace(data.session_url);
      } else toast.error(data.message);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Export Appointments PDF
  const exportAppointmentsPDF = () => {
    if (appointments.length === 0) {
      toast.info("No appointments to export!");
      return;
    }

    const doc = new jsPDF();
    const title = "My Appointments Report";
    const date = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);

    const tableColumn = [
      "#", "Doctor Name", "Speciality", "Date", "Time", "Status", "Payment",
    ];

    const tableRows = appointments.map((item, index) => {
      const status = item.cancelled
        ? "Cancelled"
        : item.isCompleted
        ? "Completed"
        : "Active";
      const paymentStatus = item.payment ? "Paid" : "Pending";

      return [
        index + 1,
        item.docData?.name || "N/A",
        item.docData?.speciality || "-",
        slotDateFormat(item.slotDate),
        item.slotTime,
        status,
        paymentStatus,
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("My_Appointments_Report.pdf");
  };

  // Submit Insurance Form
const handleInsuranceSubmit = async (e) => {
  e.preventDefault();

  if (!insuranceCompany || !insuranceId) {
    toast.error("Please fill all insurance details!");
    return;
  }

  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("User ID not found. Please log in again!");
      return;
    }

    const { data } = await axios.post(
      `${backendUrl}/api/user/insurence`,
      {
        userId, // Added userId
        appointmentId: selectedAppointment,
        companyName: insuranceCompany,
        insuranceId,
      },
      { headers: { token } }
    );

    if (data.success) {
      toast.success("Insurance claim submitted successfully!");
      setShowInsuranceForm(false);
      setInsuranceCompany("");
      setInsuranceId("");
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to submit insurance claim!");
  }
};

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  return (
    <div>
      {/* Header with Export Button */}
      <div className="flex justify-between items-center mt-12 border-b pb-3">
        <p className="text-lg font-medium text-gray-600">My Appointments</p>
        <button
          onClick={exportAppointmentsPDF}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-teal-600 transition-all"
        >
          Export PDF
        </button>
      </div>

      {/* Appointments List */}
      <div>
        {appointments.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
          >
            <div>
              <img className="w-36 bg-[#EAEFFF]" src={item.docData.image} alt="" />
            </div>

            <div className="flex-1 text-sm text-[#5E5E5E]">
              <p className="text-[#262626] text-base font-semibold">
                {item.docData.name}
              </p>
              <p>{item.docData.speciality}</p>
              <p className="text-[#464646] font-medium mt-1">Address:</p>
              <p>{item.docData.address.line1}</p>
              <p>{item.docData.address.line2}</p>
              <p className="mt-1">
                <span className="text-sm text-[#3C3C3C] font-medium">
                  Date & Time:
                </span>{" "}
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>

            <div className="flex gap-2">
              {!item.cancelled && item.payment && !item.isCompleted && (
                <button
                  onClick={() => navigate(`/video/${item._id}`)}
                  className="text-[#696969] px-4 py-2 border rounded hover:bg-primary hover:text-white transition-all"
                >
                  Join Video
                </button>
              )}
            </div>

            {/* Payment Options */}
            <div className="flex flex-col gap-2 justify-end text-sm text-center">
              {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                <>
                  <button
                    onClick={() => setPayment(item._id)}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Pay Now
                  </button>
                </>
              )}

              {/* Show Payment Options */}
              {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => appointmentStripe(item._id)}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 flex items-center justify-center transition-all"
                  >
                    <img className="max-w-20 max-h-5" src={assets.stripe_logo} alt="" />
                  </button>

                  <button
                    onClick={() => {
                      setShowInsuranceForm(true);
                      setSelectedAppointment(item._id);
                    }}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-blue-100 transition-all"
                  >
                    Insurance Claim
                  </button>
                </div>
              )}

              {item.payment && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border rounded text-[#696969] bg-[#EAEFFF]">
                  Paid
                </button>
              )}

              {item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Completed
                </button>
              )}

              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all"
                >
                  Cancel Appointment
                </button>
              )}

              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment Cancelled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insurance Form Modal */}
      {showInsuranceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Submit Insurance Claim
            </h2>

            <form onSubmit={handleInsuranceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Insurance Company
                </label>
                <select
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Company</option>
                  {insuranceCompanies.map((company, idx) => (
                    <option key={idx} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Insurance ID
                </label>
                <input
                  type="text"
                  value={insuranceId}
                  onChange={(e) => setInsuranceId(e.target.value)}
                  placeholder="Enter your Insurance ID"
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowInsuranceForm(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
