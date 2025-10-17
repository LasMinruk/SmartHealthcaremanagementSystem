import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to generate consultation report PDF
export const generateConsultationReportPDF = (consultationData) => {
  const { consultation, appointment, doctor, patient } = consultationData;
  
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set up colors - matching prescription format
  const primaryColor = [44, 90, 160]; // Blue color like prescription
  const secondaryColor = [52, 73, 94]; // Dark gray
  const lightGray = [248, 249, 250]; // Light gray background
  
  // Header with border line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(3);
  doc.line(15, 35, 195, 35);
  
  // Clinic name
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Smart Healthcare Management System', 105, 25, { align: 'center' });
  
  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text('Your Health, Our Priority', 105, 30, { align: 'center' });
  
  // Prescription title - moved down to avoid overlap
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL PRESCRIPTION', 105, 45, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 55;
  
  // Date information (top right)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 195, yPosition, { align: 'right' });
  yPosition += 15;
  
  // Patient and Doctor Information in two columns
  const leftX = 15;
  const rightX = 110;
  const boxHeight = 45;
  
  // Patient Information Box (Left)
  doc.setFillColor(...lightGray);
  doc.rect(leftX, yPosition, 90, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(leftX, yPosition, 90, boxHeight, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', leftX + 5, yPosition + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, leftX + 5, yPosition + 15);
  doc.text(`Age: ${patient.age} years`, leftX + 5, yPosition + 20);
  doc.text(`Gender: ${patient.gender}`, leftX + 5, yPosition + 25);
  doc.text(`Phone: ${patient.phone}`, leftX + 5, yPosition + 30);
  doc.text(`Email: ${patient.email}`, leftX + 5, yPosition + 35);
  
  // Doctor Information Box (Right)
  doc.setFillColor(...lightGray);
  doc.rect(rightX, yPosition, 90, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(rightX, yPosition, 90, boxHeight, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Doctor Information', rightX + 5, yPosition + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: Dr. ${doctor.name}`, rightX + 5, yPosition + 15);
  doc.text(`Speciality: ${doctor.speciality}`, rightX + 5, yPosition + 20);
  doc.text(`Degree: ${doctor.degree}`, rightX + 5, yPosition + 25);
  doc.text(`Experience: ${doctor.experience}`, rightX + 5, yPosition + 30);
  if (doctor.address) {
    doc.text(`Address: ${doctor.address.line1 || ''}`, rightX + 5, yPosition + 35);
  }
  
  yPosition += boxHeight + 20;
  
  // Consultation Notes Section
  if (consultation.consultationNotes) {
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Consultation Notes', 15, yPosition);
    
    // Section underline
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(2);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 15;
    
    // Notes box
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, 180, 25, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(4);
    doc.line(15, yPosition, 15, yPosition + 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(consultation.consultationNotes, 170);
    doc.text(notesLines, 20, yPosition + 8);
    yPosition += 35;
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Diagnosis Section
  if (consultation.diagnosis) {
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnosis', 15, yPosition);
    
    // Section underline
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(2);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 15;
    
    // Diagnosis box
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, 180, 20, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(4);
    doc.line(15, yPosition, 15, yPosition + 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(consultation.diagnosis, 170);
    doc.text(diagnosisLines, 20, yPosition + 8);
    yPosition += 30;
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
  
  // Prescribed Medications Section
  if (consultation.medications && consultation.medications.length > 0) {
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Prescribed Medications', 15, yPosition);
    
    // Section underline
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(2);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 15;
    
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
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 8
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { cellWidth: 40 }
      },
      alternateRowStyles: {
        fillColor: lightGray
      }
    });
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // Check if we need a new page for follow-up
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Follow-up Information Section
  if (consultation.followUpRequired) {
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Follow-up', 15, yPosition);
    
    // Section underline
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(2);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 15;
    
    // Follow-up box
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, 180, 25, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(4);
    doc.line(15, yPosition, 15, yPosition + 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let followUpText = 'Follow-up is required for this patient.';
    if (consultation.followUpDate) {
      followUpText += `\nFollow-up Date: ${new Date(consultation.followUpDate).toLocaleDateString()}`;
    }
    if (consultation.followUpNotes) {
      followUpText += `\nNotes: ${consultation.followUpNotes}`;
    }
    
    const followUpLines = doc.splitTextToSize(followUpText, 170);
    doc.text(followUpLines, 20, yPosition + 8);
    yPosition += 35;
  }
  
  // Footer with Doctor Signature
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add doctor signature on the last page
    if (i === pageCount) {
      // Move to bottom of page for signature
      const signatureY = 250;
      
      // Doctor signature section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Signature line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(105, signatureY, 195, signatureY);
      
      // Doctor name and title
      doc.text(`Dr. ${doctor.name}`, 105, signatureY + 8);
      doc.text(doctor.speciality, 105, signatureY + 15);
      
      // Footer line
      doc.setDrawColor(233, 236, 239);
      doc.setLineWidth(2);
      doc.line(15, 280, 195, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(153, 153, 153);
      doc.text(`Prescription ID: ${consultation._id}`, 195, 285, { align: 'right' });
    }
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
  return `Prescription_${cleanPatientName}_${date}.pdf`;
};

export default {
  generateConsultationReportPDF,
  generatePDFFilename
};
