import express from 'express';
import { 
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
} from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

// Consultation and notes routes
doctorRouter.post("/save-consultation-notes", authDoctor, saveConsultationNotes)
doctorRouter.post("/get-consultation-notes", authDoctor, getConsultationNotes)
doctorRouter.post("/get-patient-info", authDoctor, getPatientInfoForConsultation)
doctorRouter.post("/complete-consultation", authDoctor, completeConsultation)
doctorRouter.get("/consultations", authDoctor, getDoctorConsultations)

// PDF and email routes
doctorRouter.get("/download-consultation-report", authDoctor, downloadConsultationReport)

export default doctorRouter;