import React from "react";

const LabOrdersTable = ({ labTests = [] }) => {
  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <h2 className="font-semibold text-gray-700 mb-3">Recent Lab Orders</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b text-left text-gray-700 font-medium">
              <th className="py-2 px-2">Test</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Scheduled</th>
              <th className="py-2 px-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {labTests.map((t) => (
              <tr key={t._id} className="border-b">
                <td className="py-2 px-2">{t.testName}</td>
                <td className="py-2 px-2">{t.status}</td>
                <td className="py-2 px-2">{t.scheduledDate || "-"}</td>
                <td className="py-2 px-2">
                  {t.resultFile ? (
                    <a
                      className="text-blue-600 underline"
                      href={t.resultFile}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {labTests.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No lab orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabOrdersTable;
