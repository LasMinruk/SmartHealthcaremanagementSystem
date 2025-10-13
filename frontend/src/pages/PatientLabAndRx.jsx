// src/components/patient/PatientLabAndRx.jsx
import React, { useEffect, useState } from "react";
import { LabPharmacyApi } from "../api/labPharmacyApi";

const useToken = () => localStorage.getItem("token") || "";

export default function PatientLabAndRx({ patientId }) {
  const token = useToken();
  const [data, setData] = useState({ labTests: [], prescriptions: [] });

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      const res = await LabPharmacyApi.getPatientLabAndRx({ token, patientId });
      console.log("Fetched patient lab & rx data:", res);
      if (res.success) setData({ labTests: res.labTests || [], prescriptions: res.prescriptions || [] });
    };
    load();
  }, [patientId, token]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold mb-2">My Lab Tests</h2>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-2">Test</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.labTests.map((t) => (
                <tr key={t._id} className="border-b">
                  <td className="py-2 px-2">{t.testName}</td>
                  <td className="py-2 px-2">{t.status}</td>
                  <td className="py-2 px-2">
                    {t.resultFile ? (
                      <a className="text-blue-600 underline" href={t.resultFile} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : "Pending"}
                  </td>
                </tr>
              ))}
              {data.labTests.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-500">No lab tests.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">My Prescriptions</h2>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-2">Issued</th>
                <th className="py-2 px-2">Medicines</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.prescriptions.map((p)=>(
                <tr key={p._id} className="border-b align-top">
                  <td className="py-2 px-2">{new Date(p.issuedDate).toLocaleString()}</td>
                  <td className="py-2 px-2">
                    <ul className="list-disc ml-4">
                      {(p.medications || []).map((m,i)=>(
                        <li key={i}><b>{m.name}</b> — {m.dosage} {m.frequency ? `• ${m.frequency}`:""} {m.duration ? `• ${m.duration}`:""}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2 px-2">{p.status}</td>
                </tr>
              ))}
              {data.prescriptions.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-500">No prescriptions.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
