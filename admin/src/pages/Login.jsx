import axios from "axios";
import React, { useContext, useState } from "react";
import { DoctorContext } from "../context/DoctorContext";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const { setDToken, setDoctorId, setDName } = useContext(DoctorContext);
  const { setAToken } = useContext(AdminContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (activeTab === "Admin") {
        const { data } = await axios.post(`${backendUrl}/api/admin/login`, {
          email,
          password,
        });
        if (data.success) {
          setAToken(data.token);
          localStorage.setItem("aToken", data.token);
          toast.success("Admin logged in");
        } else toast.error(data.message);
      } else if (activeTab === "Doctor") {
        const { data } = await axios.post(`${backendUrl}/api/doctor/login`, {
          email,
          password,
        });
        if (data.success) {
          setDToken(data.token);
          setDoctorId(data.userId);
          setDName(data.name || "Doctor");
          localStorage.setItem("dToken", data.token);
          localStorage.setItem("doctorId", data.userId);
          localStorage.setItem("dName", data.name || "Doctor");
          toast.success("Doctor logged in");
        } else toast.error(data.message);
      } else {
        // Lab & Pharmacy login
        const { data } = await axios.post(
          `${backendUrl}/api/labpharmacy/login`,
          { email, password }
        );
        if (data.success) {
          localStorage.setItem("lbtoken", data.token);
          toast.success("Lab/Pharmacy logged in Successfully.");
          navigate("/laboratory-pharmacy");
        } else toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded-xl shadow-lg text-[#5E5E5E]">
        {/* Tabs Navigation */}
        <div className="flex bg-blue-100 m-auto rounded-full p-1 w-fit mb-6">
          {["Admin", "Doctor", "Lab/Pharmacy"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <p className="text-2xl font-semibold text-center mb-6">
          <span className="text-primary">{activeTab}</span> Login
        </p>

        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#DADADA] rounded w-full p-2 mt-1"
            />
          </div>

          <div className="relative">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#DADADA] rounded w-full p-2 mt-1 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-[36px] text-gray-600"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7a11.08 11.08 0 0 1 2.06-3.94" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button className="bg-primary text-white w-full py-2 rounded-md text-base mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
