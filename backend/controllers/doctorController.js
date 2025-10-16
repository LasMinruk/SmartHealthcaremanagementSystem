import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import consultationModel from "../models/consultationModel.js";
import { generateConsultationReportPDF, generatePDFFilename } from "../services/pdfService.js";
import patientModel from "../models/patientModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token, userId: user._id, name: user.name })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        // Get consultation data for each appointment
        const appointmentsWithConsultations = await Promise.all(
            appointments.map(async (appointment) => {
                const consultation = await consultationModel.findOne({ 
                    appointmentId: appointment._id 
                }).select('diagnosis consultationNotes medications status createdAt')
                
                return {
                    ...appointment.toObject(),
                    consultation: consultation || null
                }
            })
        )

        res.json({ success: true, appointments: appointmentsWithConsultations })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create or update consultation notes
const saveConsultationNotes = async (req, res) => {
    try {
        const { 
            appointmentId, 
            doctorId, 
            consultationNotes, 
            diagnosis, 
            symptoms, 
            vitalSigns, 
            medications,
            followUpRequired,
            followUpDate,
            followUpNotes
        } = req.body;

        // Get appointment details to get patient ID
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Check if consultation already exists
        let consultation = await consultationModel.findOne({ appointmentId });

        if (consultation) {
            // Update existing consultation
            consultation.consultationNotes = consultationNotes || consultation.consultationNotes;
            consultation.diagnosis = diagnosis || consultation.diagnosis;
            consultation.symptoms = symptoms || consultation.symptoms;
            consultation.vitalSigns = vitalSigns || consultation.vitalSigns;
            consultation.medications = medications || consultation.medications;
            consultation.followUpRequired = followUpRequired !== undefined ? followUpRequired : consultation.followUpRequired;
            consultation.followUpDate = followUpDate || consultation.followUpDate;
            consultation.followUpNotes = followUpNotes || consultation.followUpNotes;
            consultation.updatedAt = Date.now();

            await consultation.save();
        } else {
            // Create new consultation
            consultation = new consultationModel({
                appointmentId,
                doctorId,
                patientId: appointment.userId,
                consultationNotes,
                diagnosis,
                symptoms,
                vitalSigns,
                medications,
                followUpRequired,
                followUpDate,
                followUpNotes
            });

            await consultation.save();
        }

        res.json({ 
            success: true, 
            message: 'Consultation notes saved successfully',
            consultation 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get consultation notes for an appointment
const getConsultationNotes = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const consultation = await consultationModel.findOne({ appointmentId })
            .populate('patientId', 'name email phone')
            .populate('doctorId', 'name speciality');

        if (!consultation) {
            return res.json({ 
                success: true, 
                consultation: null,
                message: 'No consultation notes found' 
            });
        }

        res.json({ 
            success: true, 
            consultation 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get patient information for consultation
const getPatientInfoForConsultation = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        const patient = await patientModel.findById(appointment.userId).select('-password');
        
        res.json({ 
            success: true, 
            patientInfo: {
                name: patient.name,
                age: patient.dob ? calculateAge(patient.dob) : 'Not specified',
                gender: patient.gender,
                phone: patient.phone,
                email: patient.email,
                address: patient.address,
                bloodType: 'Not specified', // You can add this to user model if needed
                allergies: 'None', // You can add this to user model if needed
                medicalHistory: 'No previous records' // You can add this to user model if needed
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to complete consultation and issue e-prescription
const completeConsultation = async (req, res) => {
    try {
        const { appointmentId, doctorId } = req.body;

        // Update consultation status
        await consultationModel.findOneAndUpdate(
            { appointmentId },
            { status: 'completed' }
        );

        // Mark appointment as completed
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            isCompleted: true 
        });

        res.json({ 
            success: true, 
            message: 'Consultation completed successfully' 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all consultations for a doctor
const getDoctorConsultations = async (req, res) => {
    try {
        const { doctorId } = req.body;

        const consultations = await consultationModel.find({ doctorId })
            .populate('patientId', 'name email phone')
            .populate('appointmentId', 'slotDate slotTime')
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            consultations 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Helper function to calculate age
const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};


// API to download consultation report PDF
const downloadConsultationReport = async (req, res) => {
    try {
        const { appointmentId } = req.query;
        console.log('Downloading consultation report for appointment:', appointmentId);

        // Get consultation data with all related information
        const consultation = await consultationModel.findOne({ appointmentId })
            .populate('patientId', 'name email phone dob gender address')
            .populate('doctorId', 'name speciality degree experience address');

        console.log('Found consultation:', consultation ? 'Yes' : 'No');

        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation not found' });
        }

        // Get appointment data
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        console.log('Found appointment:', appointment ? 'Yes' : 'No');

        // Prepare data for PDF generation
        const consultationData = {
            consultation,
            appointment,
            doctor: consultation.doctorId,
            patient: {
                ...consultation.patientId.toObject(),
                age: consultation.patientId.dob ? calculateAge(consultation.patientId.dob) : 'Not specified'
            }
        };

        console.log('Generating PDF...');
        // Generate PDF
        const pdfDoc = generateConsultationReportPDF(consultationData);
        const pdfBuffer = pdfDoc.output('arraybuffer');
        console.log('PDF generated successfully, size:', pdfBuffer.byteLength);
        
        // Generate filename
        const filename = generatePDFFilename(consultationData.patient.name, appointment.slotDate);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.byteLength);

        // Send PDF buffer
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    saveConsultationNotes,
    getConsultationNotes,
    getPatientInfoForConsultation,
    completeConsultation,
    getDoctorConsultations,
    downloadConsultationReport
}
