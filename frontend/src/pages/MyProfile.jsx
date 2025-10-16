import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { FaFileDownload } from "react-icons/fa";
import { LuImageUp } from "react-icons/lu";

const BLOOD_TYPES = [
  "Not Selected",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const MyProfile = () => {
  const navigate = useNavigate();
  const { token, backendUrl, userData, setUserData, loadUserProfileData } =
    useContext(AppContext);

  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'records'
  const [isEdit, setIsEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null); // file object when user chooses a new image
  const [loadingSave, setLoadingSave] = useState(false);

  // form local state to avoid mutating global userData until saved
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: { line1: "", line2: "" },
    gender: "Not Selected",
    dob: "",
    bloodClass: "Not Selected",
    weight: "",
    height: "",
    allergiesText: "", // comma separated string for UI
    image: "", // preview url or existing
  });

  // populate form when userData arrives or changes
  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || { line1: "", line2: "" },
        gender: userData.gender || "Not Selected",
        dob: userData.dob || "",
        bloodClass: userData.bloodClass || "Not Selected",
        weight:
          userData.weight !== undefined && userData.weight !== null
            ? String(userData.weight)
            : "",
        height:
          userData.height !== undefined && userData.height !== null
            ? String(userData.height)
            : "",
        allergiesText: Array.isArray(userData.allergies)
          ? userData.allergies.join(", ")
          : (userData.allergies || "").toString(),
        image: userData.image || "",
      });
      setImageFile(null);
      setIsEdit(false);
    }
  }, [userData]);

  // Handle input changes
  const onChange = (key, value) => {
    if (key.startsWith("address.")) {
      const field = key.split(".")[1];
      setForm((p) => ({ ...p, address: { ...p.address, [field]: value } }));
    } else {
      setForm((p) => ({ ...p, [key]: value }));
    }
  };

  // Save profile to backend
  const updateUserProfileData = async () => {
    try {
      setLoadingSave(true);

      // minimal validation
      if (!form.name || !form.phone) {
        toast.error("Please provide name and phone.");
        setLoadingSave(false);
        return;
      }

      const fd = new FormData();
      fd.append("userId", userData._id);
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append(
        "address",
        JSON.stringify(form.address || { line1: "", line2: "" })
      );
      fd.append("gender", form.gender);
      fd.append("dob", form.dob || "");
      fd.append("bloodClass", form.bloodClass || "Not Selected");
      fd.append("weight", form.weight ? Number(form.weight) : 0);
      fd.append("height", form.height ? Number(form.height) : 0);

      // allergies: convert comma-separated string to array string
      const allergiesArray = form.allergiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      fd.append("allergies", JSON.stringify(allergiesArray));

      if (imageFile) {
        fd.append("image", imageFile);
      }

      // call backend
      const { data } = await axios.post(
        backendUrl + "/api/user/update-profile",
        fd,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Update response:", data);

      if (data.success) {
        toast.success(data.message || "Profile updated");
        // Reload fresh profile from server
        await loadUserProfileData();
        setIsEdit(false);
        setImageFile(null);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error?.response?.data?.message || error.message || "Server error"
      );
    } finally {
      setLoadingSave(false);
    }
  };

  // Export to PDF
  const exportProfilePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("User Profile Report", 14, 20);

    if (form.image) {
      const img = new Image();
      img.src = form.image;
      // try-catch in case image not allowed; add if exists
      try {
        doc.addImage(img, "JPEG", 150, 10, 40, 40);
      } catch (e) {}
    }

    doc.setLineWidth(0.5);
    doc.line(14, 30, 195, 30);

    autoTable(doc, {
      startY: 50,
      head: [["Field", "Information"]],
      body: [
        ["Full Name", form.name || "N/A"],
        ["Email", form.email || "N/A"],
        ["Phone", form.phone || "N/A"],
        ["Gender", form.gender || "N/A"],
        ["Date of Birth", form.dob || "N/A"],
        ["Blood Class", form.bloodClass || "N/A"],
        ["Weight (kg)", form.weight || "N/A"],
        ["Height (cm)", form.height || "N/A"],
        ["Allergies", form.allergiesText || "None"],
        ["Address Line 1", form.address?.line1 || "N/A"],
        ["Address Line 2", form.address?.line2 || "N/A"],
      ],
    });

    const date = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.height - 10);

    const safeName = (form.name || "profile").replace(/\s+/g, "_");
    doc.save(`${safeName}_Profile.pdf`);
  };

  // handle image input change
  const onImageChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setImageFile(f);
      setForm((p) => ({ ...p, image: URL.createObjectURL(f) }));
    }
  };

  if (!userData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">My Profile</h1>
          <p className="text-sm text-[#5E5E5E] mt-1">
            Manage your personal details and medical records
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {/* Tab buttons */}
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "details"
                  ? "bg-white shadow-sm text-primary"
                  : "text-[#6b6b6b]"
              }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "records"
                  ? "bg-white shadow-sm text-primary"
                  : "text-[#6b6b6b]"
              }`}
            >
              Medical Records
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left column: Profile card */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            {isEdit ? (
              <label htmlFor="imageInput" className="relative cursor-pointer">
                <img
                  src={form.image || assets.upload_icon}
                  alt="avatar"
                  className="w-36 h-36 rounded object-cover opacity-95"
                />
                <div className="absolute bottom-2 right-2 bg-white hover:bg-primary rounded-full p-1 shadow transition-all">
                  <LuImageUp className="text-gray-600 hover:text-white transition-all" />
                </div>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <img
                src={form.image || assets.upload_icon}
                alt="avatar"
                className="w-36 h-36 rounded object-cover"
              />
            )}

            {/* Name */}
            {isEdit ? (
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="text-xl font-semibold text-center bg-gray-50 px-3 py-2 rounded w-full"
              />
            ) : (
              <p className="text-xl font-semibold text-center text-[#262626]">
                {form.name}
              </p>
            )}

            <p className="text-sm text-blue-500">{form.email}</p>

            {/* Action buttons */}
            <div className="w-full mt-3 flex gap-2">
              {isEdit ? (
                <>
                  <button
                    onClick={updateUserProfileData}
                    className="flex-1 border border-primary px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
                    disabled={loadingSave}
                  >
                    {loadingSave ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      // revert unsaved changes
                      setForm({
                        name: userData.name || "",
                        email: userData.email || "",
                        phone: userData.phone || "",
                        address: userData.address || { line1: "", line2: "" },
                        gender: userData.gender || "Not Selected",
                        dob: userData.dob || "",
                        bloodClass: userData.bloodClass || "Not Selected",
                        weight:
                          userData.weight !== undefined &&
                          userData.weight !== null
                            ? String(userData.weight)
                            : "",
                        height:
                          userData.height !== undefined &&
                          userData.height !== null
                            ? String(userData.height)
                            : "",
                        allergiesText: Array.isArray(userData.allergies)
                          ? userData.allergies.join(", ")
                          : (userData.allergies || "").toString(),
                        image: userData.image || "",
                      });
                      setImageFile(null);
                      setIsEdit(false);
                    }}
                    className="px-4 py-2 border rounded-full hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEdit(true)}
                    className="flex-1 border border-primary px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* brief contact */}
          <div className="mt-4 text-sm text-[#5E5E5E]">
            <p className="font-medium">Contact</p>
            <p className="mt-1">
              Phone:{" "}
              <span className="text-blue-500">{form.phone || "N/A"}</span>
            </p>
            <p className="mt-1">
              Address:{" "}
              <span className="block text-gray-500">
                {form.address?.line1}{" "}
                {form.address?.line2 && (
                  <>
                    <br />
                    {form.address.line2}
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Right column: Tabs content */}
        <div className="bg-white p-6 rounded-lg shadow-sm min-h-[320px]">
          {activeTab === "details" && (
            <div className="text-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#262626] mb-4">
                  Profile Details
                </h3>

                {/* Export PDF */}
                <button
                  onClick={exportProfilePDF}
                  className="px-3 py-1.5 border border-green-500 rounded-md hover:bg-green-500 hover:text-white transition-all text-sm"
                  title="Export profile as PDF"
                >
                  <FaFileDownload className="inline" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Full Name
                  </label>
                  {isEdit ? (
                    <input
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.name || "-"}</p>
                  )}
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Email
                  </label>
                  <p className="pt-2 text-blue-500">{form.email}</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Phone
                  </label>
                  {isEdit ? (
                    <input
                      value={form.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.phone || "-"}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Gender
                  </label>
                  {isEdit ? (
                    <select
                      value={form.gender}
                      onChange={(e) => onChange("gender", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    >
                      <option value="Not Selected">Not Selected</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="pt-2">{form.gender || "-"}</p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Birthday
                  </label>
                  {isEdit ? (
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => onChange("dob", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.dob || "-"}</p>
                  )}
                </div>

                {/* Blood Class */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Blood Class
                  </label>
                  {isEdit ? (
                    <select
                      value={form.bloodClass}
                      onChange={(e) => onChange("bloodClass", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    >
                      {BLOOD_TYPES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="pt-2">{form.bloodClass || "-"}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Weight (kg)
                  </label>
                  {isEdit ? (
                    <input
                      type="number"
                      min="0"
                      value={form.weight}
                      onChange={(e) => onChange("weight", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.weight || "-"}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="block font-medium text-gray-600">
                    Height (cm)
                  </label>
                  {isEdit ? (
                    <input
                      type="number"
                      min="0"
                      value={form.height}
                      onChange={(e) => onChange("height", e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.height || "-"}</p>
                  )}
                </div>

                {/* Allergies */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-600">
                    Allergies (comma separated)
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      value={form.allergiesText}
                      onChange={(e) =>
                        onChange("allergiesText", e.target.value)
                      }
                      placeholder="e.g. Peanuts, Dust"
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.allergiesText || "None"}</p>
                  )}
                </div>

                {/* Address line1 */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-600">
                    Address Line 1
                  </label>
                  {isEdit ? (
                    <input
                      value={form.address?.line1}
                      onChange={(e) =>
                        onChange("address.line1", e.target.value)
                      }
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.address?.line1 || "-"}</p>
                  )}
                </div>

                {/* Address line2 */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-600">
                    Address Line 2
                  </label>
                  {isEdit ? (
                    <input
                      value={form.address?.line2}
                      onChange={(e) =>
                        onChange("address.line2", e.target.value)
                      }
                      className="w-full bg-gray-50 px-3 py-2 rounded"
                    />
                  ) : (
                    <p className="pt-2">{form.address?.line2 || "-"}</p>
                  )}
                </div>
              </div>

              {/* Action buttons at bottom of details tab (duplicate for easier UX) */}
              <div className="mt-6 flex gap-3">
                {isEdit ? (
                  <>
                    <button
                      onClick={updateUserProfileData}
                      disabled={loadingSave}
                      className="px-6 py-2 border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
                    >
                      {loadingSave ? "Saving..." : "Save information"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEdit(false);
                        setForm((f) => ({ ...f }));
                      }}
                      className="px-6 py-2 border rounded-full hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEdit(true)}
                      className="px-6 py-2 border border-primary rounded-full hover:bg-primary hover:text-white transition-all"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div>
              <h3 className="text-lg font-semibold text-[#262626] mb-4">
                My Medical Records
              </h3>

              <p className="text-sm text-[#5E5E5E] mb-4">
                You can view and manage your medical profile and history on the
                medical records page.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 border rounded-lg p-4 bg-gray-50">
                  <p className="font-medium mb-2">Medical Profile</p>
                  <p className="text-sm text-[#6b6b6b]">
                    View detailed medical records, past visits, prescriptions
                    and uploaded documents.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-[#8a8a8a]">Quick Links</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/medical-profile#history")}
                    className="text-center p-3 border rounded hover:bg-primary hover:text-white transition-all"
                  >
                    Visit History
                  </button>
                  <button
                    onClick={() => navigate("/medical-profile#documents")}
                    className="text-center p-3 border rounded hover:bg-primary hover:text-white transition-all"
                  >
                    Documents
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
