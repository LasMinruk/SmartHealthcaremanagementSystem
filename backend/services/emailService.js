import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other email services
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
};

// Email template for appointment confirmation
const createAppointmentEmailTemplate = (appointmentData) => {
  const { userData, docData, slotDate, slotTime, amount } = appointmentData;
  
  // Format the date for better readability
  const [day, month, year] = slotDate.split('_');
  const formattedDate = `${day}/${month}/${year}`;
  
  return {
    subject: 'Appointment Confirmation - Smart Healthcare Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .appointment-details {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .important-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Appointment Confirmed</h1>
            <p>Smart Healthcare Management System</p>
          </div>
          
          <p>Dear <strong>${userData.name}</strong>,</p>
          
          <p>Your appointment has been successfully booked! Here are the details:</p>
          
          <div class="appointment-details">
            <h3>📅 Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span class="detail-value">Dr. ${docData.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Speciality:</span>
              <span class="detail-value">${docData.speciality}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${slotTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Consultation Fee:</span>
              <span class="detail-value">₹${amount}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${docData.address?.line1 || 'Hospital Address'}</span>
            </div>
          </div>
          
          <div class="important-note">
            <h4>⚠️ Important Notes:</h4>
            <ul>
              <li>Please arrive 15 minutes before your scheduled appointment time</li>
              <li>Bring a valid ID and any relevant medical documents</li>
              <li>If you need to cancel or reschedule, please contact us at least 24 hours in advance</li>
              <li>For any queries, contact our support team</li>
            </ul>
          </div>
          
          <p>Thank you for choosing our healthcare services. We look forward to seeing you!</p>
          
          <div class="footer">
            <p>Best regards,<br>
            Smart Healthcare Management System Team</p>
            <p><em>This is an automated email. Please do not reply to this email.</em></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Appointment Confirmation - Smart Healthcare Management System
      
      Dear ${userData.name},
      
      Your appointment has been successfully booked! Here are the details:
      
      Doctor: Dr. ${docData.name}
      Speciality: ${docData.speciality}
      Date: ${formattedDate}
      Time: ${slotTime}
      Consultation Fee: ₹${amount}
      Location: ${docData.address?.line1 || 'Hospital Address'}
      
      Important Notes:
      - Please arrive 15 minutes before your scheduled appointment time
      - Bring a valid ID and any relevant medical documents
      - If you need to cancel or reschedule, please contact us at least 24 hours in advance
      - For any queries, contact our support team
      
      Thank you for choosing our healthcare services. We look forward to seeing you!
      
      Best regards,
      Smart Healthcare Management System Team
      
      This is an automated email. Please do not reply to this email.
    `
  };
};

// Function to send appointment confirmation email
export const sendAppointmentConfirmationEmail = async (appointmentData) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = createAppointmentEmailTemplate(appointmentData);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointmentData.userData.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send appointment cancellation email
export const sendAppointmentCancellationEmail = async (appointmentData) => {
  try {
    const transporter = createTransporter();
    
    const [day, month, year] = appointmentData.slotDate.split('_');
    const formattedDate = `${day}/${month}/${year}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointmentData.userData.email,
      subject: 'Appointment Cancelled - Smart Healthcare Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; background-color: #f44336; color: white; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
            .appointment-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Appointment Cancelled</h1>
              <p>Smart Healthcare Management System</p>
            </div>
            
            <p>Dear <strong>${appointmentData.userData.name}</strong>,</p>
            
            <p>Your appointment has been cancelled. Here are the details of the cancelled appointment:</p>
            
            <div class="appointment-details">
              <h3>📅 Cancelled Appointment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">Dr. ${appointmentData.docData.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Speciality:</span>
                <span class="detail-value">${appointmentData.docData.speciality}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${appointmentData.slotTime}</span>
              </div>
            </div>
            
            <p>If you need to book a new appointment, please visit our website or contact our support team.</p>
            
            <div class="footer">
              <p>Best regards,<br>
              Smart Healthcare Management System Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Appointment Cancelled - Smart Healthcare Management System
        
        Dear ${appointmentData.userData.name},
        
        Your appointment has been cancelled. Here are the details of the cancelled appointment:
        
        Doctor: Dr. ${appointmentData.docData.name}
        Speciality: ${appointmentData.docData.speciality}
        Date: ${formattedDate}
        Time: ${appointmentData.slotTime}
        
        If you need to book a new appointment, please visit our website or contact our support team.
        
        Best regards,
        Smart Healthcare Management System Team
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Appointment cancellation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending appointment cancellation email:', error);
    return { success: false, error: error.message };
  }
};


// Helper function to format appointment date
const formatAppointmentDate = (slotDate) => {
  if (!slotDate) return 'N/A';
  const [day, month, year] = slotDate.split('_');
  return `${day}/${month}/${year}`;
};

export default {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
};
