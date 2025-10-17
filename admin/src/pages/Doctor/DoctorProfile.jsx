import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const DoctorProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData } =
    useContext(DoctorContext);
  const { currency, backendUrl } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken]);

  // Save updated profile
  const updateProfile = async () => {
    try {
      if (!profileData) return;

      // If type is Private, require fees
      if (profileData.type === "Private") {
        if (
          profileData.fees === undefined ||
          profileData.fees === null ||
          profileData.fees === ""
        ) {
          return toast.error(
            "Please enter appointment fees for Private doctor"
          );
        }
        if (
          Number.isNaN(Number(profileData.fees)) ||
          Number(profileData.fees) < 0
        ) {
          return toast.error("Please enter a valid fees amount");
        }
      }

      setSaving(true);

      // Build update payload: include type and include fees only if Private
      const updateData = {
        address: profileData.address,
        about: profileData.about,
        available: profileData.available,
        type: profileData.type,
      };

      if (profileData.type === "Private") {
        // ensure numeric
        updateData.fees = Number(profileData.fees);
      }

      const { data } = await axios.post(
        backendUrl + "/api/doctor/update-profile",
        updateData,
        { headers: { dToken } }
      );

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        await getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  // Cancel edits and reload original profile data
  const cancelEdit = async () => {
    setIsEdit(false);
    await getProfileData();
  };

  if (!profileData) return null;

  return (
    <div className="m-5">
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Image */}
          <div className="flex flex-col items-center gap-4">
            <img
              src={profileData.image}
              alt={profileData.name}
              className="w-full max-w-[260px] rounded-lg shadow-sm bg-primary/10 object-cover"
            />
            <p className="text-center text-sm text-gray-500">
              Member since{" "}
              <span className="text-gray-700">
                {new Date(profileData.date).toLocaleDateString()}
              </span>
            </p>
          </div>

          {/* Middle: Basic Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-3xl font-medium text-gray-700">
                  {profileData.name}
                </p>
                <div className="flex items-center gap-3 mt-2 text-gray-600">
                  <p>
                    {profileData.degree} · {profileData.speciality}
                  </p>
                  <span className="inline-block py-0.5 px-3 text-xs rounded-full border text-gray-600">
                    {profileData.experience}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Availability shown as badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profileData.available
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {profileData.available ? "Available" : "Unavailable"}
                </div>

                {/* Edit / Save buttons */}
                {!isEdit ? (
                  <button
                    onClick={() => setIsEdit(true)}
                    className="px-4 py-2 border border-primary rounded-full text-sm hover:bg-primary hover:text-white transition-all"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={updateProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border rounded-full text-sm hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className="mt-5">
              <p className="text-sm font-medium text-[#262626]">About</p>
              <div className="mt-2">
                {isEdit ? (
                  <textarea
                    rows={6}
                    value={profileData.about || ""}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        about: e.target.value,
                      }))
                    }
                    className="w-full border rounded p-3 resize-none focus:outline-primary"
                    placeholder="Write something about yourself..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 max-w-[900px]">
                    {profileData.about}
                  </p>
                )}
              </div>
            </div>

            {/* Fees & Type & Address */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-700">Doctor Type</p>
                {isEdit ? (
                  <select
                    value={profileData.type || "Government"}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="border rounded px-3 py-2"
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                  </select>
                ) : (
                  <div className="text-sm text-gray-600">
                    {profileData.type}
                  </div>
                )}
              </div>

              {/* Fees (only show when Private) */}
              {profileData.type === "Private" && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-700">
                    Appointment Fee
                  </p>
                  {isEdit ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{currency}</span>
                      <input
                        type="number"
                        min="0"
                        value={profileData.fees ?? ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            fees: e.target.value,
                          }))
                        }
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Enter fees"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-800">
                      {currency} {profileData.fees}
                    </div>
                  )}
                </div>
              )}

              {/* Address (spans rest) */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Address</p>
                <div className="mt-2 text-sm text-gray-600">
                  {isEdit ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={profileData.address?.line1 || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line1: e.target.value },
                          }))
                        }
                        className="border rounded px-3 py-2"
                        placeholder="Address line 1"
                      />
                      <input
                        type="text"
                        value={profileData.address?.line2 || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line2: e.target.value },
                          }))
                        }
                        className="border rounded px-3 py-2"
                        placeholder="Address line 2"
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{profileData.address?.line1}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {profileData.address?.line2}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Availability toggle (only editable while in edit mode) */}
            <div className="mt-6 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!profileData.available}
                  onChange={() =>
                    isEdit &&
                    setProfileData((prev) => ({
                      ...prev,
                      available: !prev.available,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Available for appointments
                </span>
              </label>
              {!isEdit && (
                <p className="text-xs text-gray-400 ml-2">
                  Toggle availability using Edit
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
