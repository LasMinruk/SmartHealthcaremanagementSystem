// src/pages/patient/PatientLabPharmacyPage.jsx
import React from "react";
import PatientLabAndRx from "./PatientLabAndRx";

const useUserId = () => localStorage.getItem("userId") || ""; // adapt to your auth

export default function PatientLabPharmacyPage() {
  const patientId = useUserId();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Laboratory & Pharmacy</h1>
      <PatientLabAndRx patientId={patientId} />
    </div>
  );
}
