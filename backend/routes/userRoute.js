import express from "express";
import {
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
  getConsultationHistory,
  getPatientConsultationReport,
  getQrCodeData,
  updateQrCodeData,
  updateAppointmentPayment,
  getAllInsurances,
} from "../controllers/userController.js";
import upload from "../middleware/multer.js";
import authUser from "../middleware/authUser.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/payment-stripe", authUser, paymentStripe);
userRouter.post("/verifyStripe", authUser, verifyStripe);
userRouter.post("/insurence", authUser, submitInsurence);
userRouter.get("/all-insurence", authUser, getAllInsurances);
userRouter.put("/update-payment/:id", updateAppointmentPayment);
userRouter.get("/consultation-history", authUser, getConsultationHistory);
userRouter.post("/consultation-report", authUser, getPatientConsultationReport);
userRouter.get("/qr-code", authUser, getQrCodeData);
userRouter.post("/qr-code/update", authUser, updateQrCodeData);

export default userRouter;
