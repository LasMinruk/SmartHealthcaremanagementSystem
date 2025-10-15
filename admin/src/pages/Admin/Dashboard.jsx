import React, { useContext, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  const exportPDF = () => {
    if (!dashData) {
      alert('No data available to export!');
      return;
    }

    const doc = new jsPDF();
    const title = 'Dashboard Report';
    const date = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);

    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Doctors: ${dashData.doctors}`, 14, 40);
    doc.text(`Appointments: ${dashData.appointments}`, 14, 48);
    doc.text(`Patients: ${dashData.patients}`, 14, 56);

    // Add table for latest bookings
    const tableColumn = ['#', 'Doctor', 'Date', 'Status'];
    const tableRows = dashData.latestAppointments.slice(0, 5).map((item, index) => [
      index + 1,
      item.docData.name,
      slotDateFormat(item.slotDate),
      item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending',
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save('Dashboard_Report.pdf');
  };

  return dashData && (
    <div className='m-5'>
      <div className='flex justify-between items-center flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>

        <button
          onClick={exportPDF}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-teal-600 transition-all'
        >
          Export PDF
        </button>
      </div>

      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={item.docData.image} alt="" />
              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
              </div>
              {item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              ) : item.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className='w-10 cursor-pointer'
                  src={assets.cancel_icon}
                  alt=""
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
