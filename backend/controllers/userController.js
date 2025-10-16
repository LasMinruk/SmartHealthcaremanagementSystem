import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import insurenceModel from "../models/insurenceModel.js";
import consultationModel from "../models/consultationModel.js";
import qrCodeModel from "../models/qrCodeModel.js";
import {
  generateConsultationReportPDF,
  generatePDFFilename,
} from "../services/pdfService.js";
import { v2 as cloudinary } from "cloudinary";
import stripe from "stripe";
import patientModel from "../models/patientModel.js";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
} from "../services/emailService.js";

// Stripe Payment Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { name, email, password: hashedPassword };
    const newUser = new patientModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token, userId: user._id });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await patientModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token, userId: user._id });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await patientModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile data
const updateProfile = async (req, res) => {
  try {
    let {
      userId,
      name,
      phone,
      address,
      dob,
      gender,
      bloodClass,
      weight,
      height,
      allergies,
    } = req.body;
    const imageFile = req.file;

    if (!name || !phone) {
      return res.json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Ensure correct types
    weight = Number(weight) || 0;
    height = Number(height) || 0;
    allergies = JSON.parse(allergies || "[]");
    address = JSON.parse(address || "{}");

    // Prevent enum rejection
    if (bloodClass === "Not Selected") bloodClass = "";

    const updateData = {
      name,
      phone,
      dob,
      gender,
      bloodClass,
      weight,
      height,
      allergies,
      address,
    };

    // Upload image only if new image is provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    await patientModel.findByIdAndUpdate(userId, updateData);

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor Not Available" });
    }

    let slots_booked = docData.slots_booked;

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot Not Available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await patientModel.findById(userId).select("-password");
    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Send appointment confirmation email
    try {
      const emailResult = await sendAppointmentConfirmationEmail(appointmentData);
      if (emailResult.success) {
        console.log('Appointment confirmation email sent successfully');
      } else {
        console.error('Failed to send appointment confirmation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending appointment confirmation email:', emailError);
      // Don't fail the appointment booking if email fails
    }

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Send appointment cancellation email
    try {
      const emailResult = await sendAppointmentCancellationEmail(
        appointmentData
      );
      if (emailResult.success) {
        console.log("Appointment cancellation email sent successfully");
      } else {
        console.error(
          "Failed to send appointment cancellation email:",
          emailResult.error
        );
      }
    } catch (emailError) {
      console.error(
        "Error sending appointment cancellation email:",
        emailError
      );
      // Don't fail the appointment cancellation if email fails
    }

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Stripe Payment (only)
const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { origin } = req.headers;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment cancelled or not found",
      });
    }

    const currency = (process.env.CURRENCY || "lkr").toLowerCase();

    const line_items = [
      {
        price_data: {
          currency,
          product_data: { name: "Appointment Fees" },
          unit_amount: appointmentData.amount * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
      cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
    });

    return res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.error("Stripe Payment Error:", error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;

    if (success === "true") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });
      return res.json({ success: true, message: "Payment Successful" });
    }

    res.json({ success: false, message: "Payment Failed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const submitInsurence = async (req, res) => {
  try {
    const { userId, appointmentId, companyName, insuranceId } = req.body;

    if (!companyName || !insuranceId || !appointmentId) {
      return res.json({ success: false, message: "All fields are required!" });
    }

    // Check if appointment exists
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found!" });
    }

    // Create insurance claim
    const newClaim = new insurenceModel({
      userId,
      appointmentId,
      companyName,
      insuranceId,
    });

    await newClaim.save();

    // Update appointment payment status to "pending"
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { payment: "pending" },
      { new: true } // return updated document
    );

    console.log("Payment status updated to pending:", updatedAppointment.payment);

    return res.json({
      success: true,
      message: "Insurance claim submitted successfully! Payment set to pending.",
      data: newClaim,
      updatedAppointment,
    });
  } catch (error) {
    console.error("Insurance Submit Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};




const getAllInsurances = async (req, res) => {
  try {
    const insurances = await insurenceModel.find(); // simple fetch all

    res.status(200).json({
      success: true,
      data: insurances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insurances",
      error: error.message,
    });
  }
};
const updateAppointmentPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment } = req.body;

    const validStatuses = ["pending", "complete", "rejected"];
    if (!validStatuses.includes(payment)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const appointment = await appointmentModel.findByIdAndUpdate(
      id,
      { payment },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${payment}`,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating payment status" });
  }
};

// API to get patient consultation history
const getConsultationHistory = async (req, res) => {
  try {
    const { userId } = req.body;

    const consultations = await consultationModel
      .find({ patientId: userId })
      .populate("doctorId", "name speciality")
      .populate("appointmentId", "slotDate slotTime")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get patient consultation report PDF
const getPatientConsultationReport = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.userId; // Get from token

    console.log("Getting consultation report for:", { appointmentId, userId });

    // Get consultation data with all related information
    const consultation = await consultationModel
      .findOne({
        appointmentId,
        patientId: userId,
      })
      .populate("patientId", "name email phone dob gender address")
      .populate("doctorId", "name speciality degree experience address");

    console.log("Found consultation:", consultation ? "Yes" : "No");

    if (!consultation) {
      return res.json({ success: false, message: "Consultation not found" });
    }

    // Get appointment data
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Prepare data for PDF generation
    const consultationData = {
      consultation,
      appointment,
      doctor: consultation.doctorId,
      patient: {
        ...consultation.patientId.toObject(),
        age: consultation.patientId.dob
          ? calculateAge(consultation.patientId.dob)
          : "Not specified",
      },
    };

    // Generate PDF
    const pdfDoc = generateConsultationReportPDF(consultationData);
    const pdfBuffer = pdfDoc.output("arraybuffer");

    // Generate filename
    const filename = generatePDFFilename(
      consultationData.patient.name,
      appointment.slotDate
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.byteLength);

    // Send PDF buffer
    res.send(Buffer.from(pdfBuffer));
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

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const getQrCodeData = async (req, res) => {
  try {
    const { userId } = req.body;
    let qrData = await qrCodeModel
      .findOne({ userId })
      .populate("userId", "name email");

    if (!qrData) {
      const qrIdentifier = uuidv4();
      qrData = new qrCodeModel({
        userId,
        qrIdentifier,
        disease: "Sample Disease",
        medicine: "Sample Medicine",
        doctorDetails: "Dr. John Doe (General Physician)",
      });
      await qrData.save();
      qrData = await qrCodeModel
        .findOne({ userId })
        .populate("userId", "name email");
    }

    res.json({ success: true, data: qrData });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching QR code data",
      });
  }
};

const updateQrCodeData = async (req, res) => {
  try {
    const { userId, disease, medicine, doctorDetails } = req.body;
    const qrData = await qrCodeModel.findOneAndUpdate(
      { userId },
      { disease, medicine, doctorDetails },
      { new: true }
    );

    if (!qrData) {
      return res
        .status(404)
        .json({ success: false, message: "QR Code data not found." });
    }

    res.json({
      success: true,
      message: "QR Code updated successfully",
      data: qrData,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while updating QR code data",
      });
  }
};

export {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentStripe,
  verifyStripe,
  submitInsurence,
  getAllInsurances,
  updateAppointmentPayment,
  getConsultationHistory,
  getPatientConsultationReport,
  getQrCodeData,
  updateQrCodeData,
};
