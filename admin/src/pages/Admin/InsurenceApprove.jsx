import React, { useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const backendUrl = "http://localhost:4000";

const InsuranceApprove = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [insuranceClaims, setInsuranceClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // Fetch all insurance claims
  const getAllInsuranceClaims = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/all-insurence`, {
        headers: { aToken }
      });

      if (data.success) {
        setInsuranceClaims(data.data);
      } else {
        toast.error(data.message || "Failed to fetch insurance claims!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      console.error("Fetch Insurance Error:", error);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Load appointments
  const loadAppointments = async () => {
    if (aToken) {
      await getAllAppointments();
    }
  };

  useEffect(() => {
    if (aToken) {
      getAllInsuranceClaims();
      loadAppointments();
    }
  }, [aToken]);

  // Merge appointment with its insurance claim by appointmentId
const mergedAppointments = appointments
  .filter(app =>
    insuranceClaims.some(c => c.appointmentId === app._id) // match by plain string ID
  )
  .map(app => {
    const claim = insuranceClaims.find(c => c.appointmentId === app._id);
    return { ...app, insurance: claim };
  })
  .filter(app =>
    app.userData.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export merged appointments to PDF
  const exportPDF = () => {
    if (!mergedAppointments.length) {
      toast.error('No appointments to export!');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Appointments with Insurance Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ['#', 'Patient', 'Age', 'Doctor', 'Payment', 'Status', 'Insurance Company', 'Insurance ID', 'Claim Status'];
    const tableRows = mergedAppointments.map((item, index) => [
      index + 1,
      item.userData.name,
      calculateAge(item.userData.dob),
      item.docData.name,
      `${currency}${item.amount}`,
      item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending',
      item.insurance?.companyName || '-',
      item.insurance?.insuranceId || '-',
      item.insurance?.status || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save('Appointments_with_Insurance_Report.pdf');
  };

  return (
    <div className='w-full max-w-6xl m-5'>
      {/* Header */}
      <div className='flex flex-wrap justify-between items-center mb-3 gap-3'>
        <p className='text-lg font-medium'>Appointments with Insurance</p>

        <div className='relative w-full sm:w-64'>
          <input
            type='text'
            placeholder='Search by patient name...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-4 py-2 rounded-full shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-400'
          />
          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
        </div>

        <button
          onClick={exportPDF}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-teal-600 transition-all'
        >
          Export PDF
        </button>
      </div>

      {/* Appointments Table with Insurance */}
<div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-auto'>
  {loadingClaims ? (
    <p className='text-gray-500 text-center py-6'>Loading insurance claims...</p>
  ) : mergedAppointments.length === 0 ? (
    <p className='text-gray-500 text-center py-6'>No appointments with insurance found.</p>
  ) : (
    <>
      {/* Table Header */}
      <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_2fr_2fr_1.5fr_1.5fr_1fr] py-4 px-6 border-b bg-gray-50 font-semibold text-gray-700'>
        <p>#</p>
        <p>Patient</p>
        <p>Age</p>
        <p>Doctor</p>
        <p>Insurance Company</p>
        <p>Insurance ID</p>
        <p>Payment Status</p>
        <p>Action</p>
      </div>

      {/* Table Rows */}
      {mergedAppointments.map((item, index) => {
        const statusColor = (status) => {
          if (status === 'pending') return 'text-yellow-500';
          if (status === 'complete') return 'text-green-500';
          if (status === 'rejected') return 'text-red-500';
          return 'text-gray-500';
        };

        return (
          <div
            key={item._id}
            className='flex flex-col sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_2fr_2fr_1.5fr_1.5fr_1fr] items-center gap-2 py-3 px-4 sm:px-6 border-b hover:bg-gray-50 transition-colors duration-150'
          >
            {/* Index */}
            <p className='max-sm:hidden font-medium'>{index + 1}</p>

            {/* Patient */}
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} alt='' className='w-8 h-8 rounded-full object-cover' />
              <p className='font-medium'>{item.userData.name}</p>
            </div>

            {/* Age */}
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>

            {/* Doctor */}
            <div className='flex items-center gap-2'>
              <img src={item.docData.image} alt='' className='w-8 h-8 rounded-full object-cover bg-gray-200' />
              <p className='font-medium'>{item.docData.name}</p>
            </div>

            {/* Insurance Company */}
            <p className='truncate font-medium'>{item.insurance?.companyName || '-'}</p>

            {/* Insurance ID */}
            <p className='truncate'>{item.insurance?.insuranceId || '-'}</p>

            {/* Payment Status */}
            <p className={`${statusColor(item.payment)} font-medium text-sm capitalize`}>
              {item.payment || 'pending'}
            </p>

            {/* Action */}
            <select
              value={item.payment || 'pending'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                try {
                  const { data } = await axios.put(
                    `${backendUrl}/api/user/update-payment/${item._id}`,
                    { payment: newStatus },
                    { headers: { aToken } }
                  );

                  if (data.success) {
                    toast.success(`Payment status changed to ${newStatus}`);
                    getAllAppointments();
                  } else {
                    toast.error(data.message || 'Failed to update payment status');
                  }
                } catch (err) {
                  toast.error('Error updating payment status');
                  console.error(err);
                }
              }}
              className='border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
            >
              <option value='pending'>Pending</option>
              <option value='complete'>Complete</option>
              <option value='rejected'>Rejected</option>
            </select>
          </div>
        );
      })}
    </>
  )}
</div>



    </div>
  );
};

export default InsuranceApprove;