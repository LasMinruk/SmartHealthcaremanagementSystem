import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, getAllDoctors } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Load all doctors on token
  useEffect(() => {
    if (aToken) getAllDoctors();
  }, [aToken]);

  // Filter doctors by search term
  useEffect(() => {
    setFilteredDoctors(
      doctors.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, doctors]);

  // Export filtered doctors to PDF
  const exportPDF = () => {
    if (!filteredDoctors || filteredDoctors.length === 0) {
      alert('No doctors data available to export!');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Doctors List', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ['#', 'Name', 'Speciality', 'Available'];
    const tableRows = filteredDoctors.map((doctor, index) => [
      index + 1,
      doctor.name,
      doctor.speciality,
      doctor.available ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save('Doctors_List.pdf');
  };

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      {/* Header with Search & PDF */}
      <div className='flex flex-wrap justify-between items-center mb-5 gap-4'>
        <h1 className='text-lg font-medium'>All Doctors</h1>
        <div className='flex flex-wrap gap-2 items-center'>
          {/* Modern Search Bar */}
          <div className='relative'>
            <input
              type='text'
              placeholder='Search doctors by name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-64 md:w-80 px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-400'
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
              🔍
            </span>
          </div>
          <button
            onClick={exportPDF}
            className='px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-teal-600 transition-all shadow-md'
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Doctors List */}
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {filteredDoctors.map((item, index) => (
          <div
            className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:shadow-lg transition-all'
            key={index}
          >
            <img
              className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full h-40 object-cover'
              src={item.image}
              alt={item.name}
            />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-2 text-sm'>
                <input
                  onChange={() => changeAvailability(item._id)}
                  type='checkbox'
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
        <p className='text-gray-500 mt-4 text-center'>No doctors found.</p>
      )}
    </div>
  );
};

export default DoctorsList;
