import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CiSearch } from "react-icons/ci";

const DoctorsList = () => {
  const {
    doctors = [],
    changeAvailability,
    aToken,
    getAllDoctors,
  } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState("Government"); // 'Government' | 'Private'

  // Load all doctors on token
  useEffect(() => {
    if (aToken) getAllDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aToken]);

  // Filter doctors by search term and active tab
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const byTab = doctors.filter(
      (d) => (d.type || "Government") === activeTab // fallback if type missing
    );

    const bySearch = term
      ? byTab.filter((doctor) => doctor.name.toLowerCase().includes(term))
      : byTab;

    setFilteredDoctors(bySearch);
  }, [searchTerm, doctors, activeTab]);

  // Export filtered doctors to PDF (only current tab + search)
  const exportPDF = () => {
    if (!filteredDoctors || filteredDoctors.length === 0) {
      alert("No doctors data available to export!");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${activeTab} Doctors`, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["#", "Name", "Speciality", "Type", "Available"];
    const tableRows = filteredDoctors.map((doctor, index) => [
      index + 1,
      doctor.name,
      doctor.speciality,
      doctor.type || "N/A",
      doctor.available ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`${activeTab}_Doctors_List.pdf`);
  };

  return (
    <div className="max-h-[90vh] m-auto overflow-y-scroll">
      {/* Header with Search, Tabs & PDF */}
      <div className="flex justify-between items-center mb-5 gap-4">
        <h1 className="text-lg font-medium">All Doctors</h1>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          <div className="flex flex-wrap gap-2 items-center ml-0 sm:ml-4">
            {/* Modern Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search doctors by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 md:w-80 px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CiSearch size={20} />
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-teal-600 transition-all shadow-md"
        >
          Export PDF
        </button>
      </div>

      {/* Tabs (exact style provided) */}
      <div className="flex bg-blue-100 rounded-full m-auto p-1 w-fit mb-0">
        <button
          onClick={() => setActiveTab("Government")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "Government"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Government
        </button>
        <button
          onClick={() => setActiveTab("Private")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "Private"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Private
        </button>
      </div>

      {/* Doctors List */}
      <div className="w-full flex flex-wrap gap-4 pt-5 gap-y-6">
        {filteredDoctors.map((item, index) => (
          <div
            className="border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
            key={item._id || index}
          >
            <img
              className="bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full h-40 object-cover"
              src={item.image}
              alt={item.name}
            />
            <div className="p-4">
              <p className="text-[#262626] text-lg font-medium">{item.name}</p>
              <p className="text-[#5C5C5C] text-sm">{item.speciality}</p>
              <p className="mt-1 text-xs text-gray-500">{item.type}</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <input
                  onChange={() => changeAvailability(item._id)}
                  type="checkbox"
                  checked={item.available}
                />
                <p>Available</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No doctors message */}
      {filteredDoctors.length === 0 && (
        <p className="text-gray-500 mt-4 text-center">No doctors found.</p>
      )}
    </div>
  );
};

export default DoctorsList;
