import React, { useEffect, useContext, useState } from 'react';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CiSearch } from "react-icons/ci";

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  // Load appointments
  useEffect(() => {
    if (aToken) getAllAppointments();
  }, [aToken]);

  // Filter appointments based on search term
  useEffect(() => {
    setFilteredAppointments(
      appointments.filter((item) =>
        item.userData.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, appointments]);

  // Export PDF
  const exportPDF = () => {
    if (!filteredAppointments || filteredAppointments.length === 0) {
      alert('No appointments to export!');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('All Appointments Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ['#', 'Patient', 'Age', 'Date & Time', 'Doctor', 'Fees', 'Status'];
    const tableRows = filteredAppointments.map((item, index) => [
      index + 1,
      item.userData.name,
      calculateAge(item.userData.dob),
      `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
      item.docData.name,
      `${currency}${item.amount}`,
      item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending',
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save('All_Appointments_Report.pdf');
  };

  return (
    <div className='w-full max-w-6xl m-5'>
      {/* Header with Search & PDF */}
      <div className='flex flex-wrap justify-between items-center mb-3 gap-3'>
        <p className='text-lg font-medium'>All Appointments</p>

        {/* Modern Search Bar */}
        <div className='relative w-full sm:w-64'>
          <input
            type='text'
            placeholder='Search by patient name...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-400'
          />
          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
            <CiSearch size={20} />
          </span>
        </div>

        <button
          onClick={exportPDF}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-teal-600 transition-all'
        >
          Export PDF
        </button>
      </div>

      {/* Appointments Table */}
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div
            className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
            key={index}
          >
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt='' />{' '}
              <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
            <div className='flex items-center gap-2'>
              <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt='' />{' '}
              <p>{item.docData.name}</p>
            </div>
            <p>
              {currency}
              {item.amount}
            </p>
            {item.cancelled ? (
              <p className='text-red-400 text-xs font-medium'>Cancelled</p>
            ) : item.isCompleted ? (
              <p className='text-green-500 text-xs font-medium'>Completed</p>
            ) : (
              <img
                onClick={() => cancelAppointment(item._id)}
                className='w-10 cursor-pointer'
                src={assets.cancel_icon}
                alt=''
              />
            )}
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <p className='text-gray-500 mt-4 text-center'>No appointments found.</p>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
