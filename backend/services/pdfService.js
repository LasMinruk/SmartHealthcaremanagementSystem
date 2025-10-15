import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to generate consultation report PDF
export const generateConsultationReportPDF = (consultationData) => {
  const { consultation, appointment, doctor, patient } = consultationData;
  
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor = [22, 160, 133]; // Teal color
  const secondaryColor = [52, 73, 94]; // Dark gray
  const lightGray = [245, 245, 245];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSULTATION REPORT', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Healthcare Management System', 105, 26, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 45;
  
  // Report Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, yPosition);
  doc.text(`Report Time: ${new Date().toLocaleTimeString()}`, 15, yPosition + 5);
  doc.text(`Consultation ID: ${consultation._id}`, 15, yPosition + 10);
  yPosition += 20;
  
  // Doctor Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Doctor Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: Dr. ${doctor.name}`, 15, yPosition);
  doc.text(`Speciality: ${doctor.speciality}`, 15, yPosition + 5);
  doc.text(`Degree: ${doctor.degree}`, 15, yPosition + 10);
  doc.text(`Experience: ${doctor.experience}`, 15, yPosition + 15);
  if (doctor.address) {
    doc.text(`Address: ${doctor.address.line1 || ''}`, 15, yPosition + 20);
  }
  yPosition += 30;
  
  // Patient Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Patient Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${patient.name}`, 15, yPosition);
  doc.text(`Age: ${patient.age} years`, 15, yPosition + 5);
  doc.text(`Gender: ${patient.gender}`, 15, yPosition + 10);
  doc.text(`Phone: ${patient.phone}`, 15, yPosition + 15);
  doc.text(`Email: ${patient.email}`, 15, yPosition + 20);
  if (patient.address) {
    doc.text(`Address: ${patient.address.line1 || ''}`, 15, yPosition + 25);
  }
  yPosition += 35;
  
  // Appointment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Appointment Details', 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${formatAppointmentDate(appointment.slotDate)}`, 15, yPosition);
  doc.text(`Time: ${appointment.slotTime}`, 15, yPosition + 5);
  doc.text(`Consultation Fee: ₹${appointment.amount}`, 15, yPosition + 10);
  doc.text(`Payment Status: ${appointment.payment ? 'Paid' : 'Pending'}`, 15, yPosition + 15);
  yPosition += 25;
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Diagnosis
  if (consultation.diagnosis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Diagnosis', 15, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const diagnosisLines = doc.splitTextToSize(consultation.diagnosis, 180);
    doc.text(diagnosisLines, 15, yPosition);
    yPosition += diagnosisLines.length * 5 + 10;
  }
  
  // Symptoms
  if (consultation.symptoms && consultation.symptoms.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Symptoms', 15, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const symptomsText = consultation.symptoms.join(', ');
    const symptomsLines = doc.splitTextToSize(symptomsText, 180);
    doc.text(symptomsLines, 15, yPosition);
    yPosition += symptomsLines.length * 5 + 10;
  }
  
  // Vital Signs
  if (consultation.vitalSigns) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Vital Signs', 15, yPosition);
    yPosition += 10;
    
    const vitalSignsData = [];
    if (consultation.vitalSigns.bloodPressure) {
      vitalSignsData.push(['Blood Pressure', consultation.vitalSigns.bloodPressure]);
    }
    if (consultation.vitalSigns.heartRate) {
      vitalSignsData.push(['Heart Rate', consultation.vitalSigns.heartRate]);
    }
    if (consultation.vitalSigns.temperature) {
      vitalSignsData.push(['Temperature', consultation.vitalSigns.temperature]);
    }
    if (consultation.vitalSigns.weight) {
      vitalSignsData.push(['Weight', consultation.vitalSigns.weight]);
    }
    if (consultation.vitalSigns.height) {
      vitalSignsData.push(['Height', consultation.vitalSigns.height]);
    }
    if (consultation.vitalSigns.oxygenSaturation) {
      vitalSignsData.push(['Oxygen Saturation', consultation.vitalSigns.oxygenSaturation]);
    }
    
    if (vitalSignsData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Parameter', 'Value']],
        body: vitalSignsData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });
      yPosition = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // Check if we need a new page for medications
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Medications
  if (consultation.medications && consultation.medications.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Prescribed Medications', 15, yPosition);
    yPosition += 10;
    
    const medicationsData = consultation.medications.map(med => [
      med.name,
      med.dosage,
      med.frequency,
      med.duration,
      med.instructions || 'No special instructions'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
      body: medicationsData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { cellWidth: 40 }
      }
    });
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // Check if we need a new page for notes
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Consultation Notes
  if (consultation.consultationNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Consultation Notes', 15, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(consultation.consultationNotes, 180);
    doc.text(notesLines, 15, yPosition);
    yPosition += notesLines.length * 5 + 15;
  }
  
  // Follow-up Information
  if (consultation.followUpRequired) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Follow-up Information', 15, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Follow-up is required for this patient.', 15, yPosition);
    
    if (consultation.followUpDate) {
      doc.text(`Follow-up Date: ${new Date(consultation.followUpDate).toLocaleDateString()}`, 15, yPosition + 5);
    }
    
    if (consultation.followUpNotes) {
      doc.text('Follow-up Notes:', 15, yPosition + 10);
      const followUpLines = doc.splitTextToSize(consultation.followUpNotes, 180);
      doc.text(followUpLines, 15, yPosition + 15);
    }
    yPosition += 25;
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 285, 195, 285);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Smart Healthcare Management System - Consultation Report', 15, 290);
    doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });
  }
  
  return doc;
};

// Helper function to format appointment date
const formatAppointmentDate = (slotDate) => {
  if (!slotDate) return 'N/A';
  const [day, month, year] = slotDate.split('_');
  return `${day}/${month}/${year}`;
};

// Function to generate PDF filename
export const generatePDFFilename = (patientName, appointmentDate) => {
  const date = new Date().toISOString().split('T')[0];
  const cleanPatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  return `Consultation_Report_${cleanPatientName}_${date}.pdf`;
};

export default {
  generateConsultationReportPDF,
  generatePDFFilename
};
