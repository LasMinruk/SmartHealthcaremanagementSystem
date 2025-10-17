import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLaboratoryPharmacy from "../pages/Admin/AdminLaboratoryPharmacy";
import { AdminContext } from "../context/AdminContext";
import { LabPharmacyContext } from "../context/LabPharmacyContext";
import axios from "axios";
import { toast } from "react-toastify";
import { LabPharmacyApi } from "../api/labPharmacyApi";

jest.mock("axios");
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("../api/labPharmacyApi");

const mockPatients = [
  { _id: "p1", name: "John Doe", email: "john@example.com", image: "/img1.jpg" },
  { _id: "p2", name: "Jane Smith", email: "jane@example.com", image: "/img2.jpg" },
];

const mockLabTests = [
  { patientId: "p1", status: "pending" },
  { patientId: "p2", status: "completed" },
];

const mockPrescriptions = [
  { patientId: "p1", status: "pending" },
  { patientId: "p2", status: "completed" },
];

const renderWithContexts = (aToken = "admin-token", lbToken = "") => {
  return render(
    <AdminContext.Provider value={{ aToken }}>
      <LabPharmacyContext.Provider value={{ lbToken }}>
        <AdminLaboratoryPharmacy />
      </LabPharmacyContext.Provider>
    </AdminContext.Provider>
  );
};

describe("AdminLaboratoryPharmacy Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header and loading state", () => {
    renderWithContexts();
    expect(screen.getByText(/Laboratory & Pharmacy Management/i)).toBeInTheDocument();
  });

  test("fetches patients and highlights on load", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, appointments: [
        { userId: "p1", userData: mockPatients[0] },
        { userId: "p2", userData: mockPatients[1] }
      ] },
    });
    LabPharmacyApi.getAllLabTests.mockResolvedValue({ success: true, labTests: mockLabTests });
    LabPharmacyApi.getAllPrescriptions.mockResolvedValue({ success: true, prescriptions: mockPrescriptions });

    renderWithContexts();

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  test("handles error when fetching patients fails", async () => {
    axios.get.mockRejectedValueOnce({ response: { data: { message: "Error fetching" } } });

    renderWithContexts();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error fetching");
    });
  });

  test("filters patients by search term", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, appointments: [
        { userId: "p1", userData: mockPatients[0] },
        { userId: "p2", userData: mockPatients[1] }
      ] },
    });
    LabPharmacyApi.getAllLabTests.mockResolvedValue({ success: true, labTests: [] });
    LabPharmacyApi.getAllPrescriptions.mockResolvedValue({ success: true, prescriptions: [] });

    renderWithContexts();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search by patient name/i);
      fireEvent.change(searchInput, { target: { value: "Jane" } });
      expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  test("selects a patient and switches tabs", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, appointments: [
        { userId: "p1", userData: mockPatients[0] }
      ] },
    });
    LabPharmacyApi.getAllLabTests.mockResolvedValue({ success: true, labTests: [] });
    LabPharmacyApi.getAllPrescriptions.mockResolvedValue({ success: true, prescriptions: [] });
    LabPharmacyApi.getPatientLabAndRx.mockResolvedValue({
      success: true,
      labTests: [{ test: "Blood" }],
      prescriptions: [{ medicine: "Aspirin" }],
    });

    renderWithContexts();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/John Doe/i));
    });

    // Verify patient detail section
    await waitFor(() => {
      expect(screen.getByText(/John Doe's Records/i)).toBeInTheDocument();
    });

    // Switch to pharmacy tab
    fireEvent.click(screen.getByText(/Pharmacy/i));
    expect(screen.getByText(/Pharmacy/i).className).toContain("bg-blue-600");
  });

  test("exports PDF triggers jsPDF save", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, appointments: [{ userId: "p1", userData: mockPatients[0] }] },
    });
    LabPharmacyApi.getAllLabTests.mockResolvedValue({ success: true, labTests: [] });
    LabPharmacyApi.getAllPrescriptions.mockResolvedValue({ success: true, prescriptions: [] });

    // Mock jsPDF save
    const saveMock = jest.fn();
    jest.mock("jspdf", () => {
      return jest.fn().mockImplementation(() => ({ save: saveMock, text: jest.fn() }));
    });

    renderWithContexts();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Export PDF/i));
      expect(saveMock).toHaveBeenCalled();
    });
  });

  test("back button returns to patient list", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, appointments: [{ userId: "p1", userData: mockPatients[0] }] },
    });
    LabPharmacyApi.getAllLabTests.mockResolvedValue({ success: true, labTests: [] });
    LabPharmacyApi.getAllPrescriptions.mockResolvedValue({ success: true, prescriptions: [] });
    LabPharmacyApi.getPatientLabAndRx.mockResolvedValue({
      success: true,
      labTests: [],
      prescriptions: [],
    });

    renderWithContexts();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/John Doe/i));
    });

    const backBtn = screen.getByText(/← Back to Patients/i);
    fireEvent.click(backBtn);

    expect(screen.getByText(/Patients/i)).toBeInTheDocument();
  });
});
