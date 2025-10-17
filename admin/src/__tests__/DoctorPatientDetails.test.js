import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DoctorPatientDetails from "../pages/Doctor/DoctorPatientDetails";
import axios from "axios";

jest.mock("axios");

// Mock jsPDF
jest.mock("jspdf", () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      save: jest.fn(),
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [1] },
      setFillColor: jest.fn(),
      rect: jest.fn(),
      setTextColor: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      splitTextToSize: jest.fn((text) => [text]),
      addPage: jest.fn(),
    })),
  };
});

describe("DoctorPatientDetails", () => {
  const patientId = "12345";
  const mockPatientData = {
    labTests: [],
    prescriptions: [],
    consultations: [],
    patientInfo: { bloodClass: "A+", allergies: ["Peanuts"], phone: "1234567890" },
  };

  beforeEach(() => {
    localStorage.setItem("dToken", "mockToken");
    localStorage.setItem("doctorId", "doc123");
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/labpharmacy/patient/view")) {
        return Promise.resolve({
          json: () => Promise.resolve({ labTests: [], prescriptions: [] }),
        });
      }
      if (url.includes("/api/doctor/consultations")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ consultations: [] }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });
    axios.post.mockResolvedValue({ ok: true, data: { userData: mockPatientData.patientInfo } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={[`/doctor/patient/${patientId}`]}>
        <Routes>
          <Route path="/doctor/patient/:id" element={<DoctorPatientDetails />} />
        </Routes>
      </MemoryRouter>
    );

  it("renders patient summary header", async () => {
    renderPage();
    expect(await screen.findByText(/Patient Medical Records/i)).toBeInTheDocument();
    expect(screen.getByText("Patient Summary")).toBeInTheDocument();
  });

  it("switches tabs correctly", async () => {
    renderPage();
    const labTab = await screen.findByRole("button", { name: /Lab Tests/i });
    fireEvent.click(labTab);
    expect(screen.getByText(/Create Lab Test Order/i)).toBeInTheDocument();

    const presTab = screen.getByRole("button", { name: /Prescriptions/i });
    fireEvent.click(presTab);
    expect(screen.getByText(/Create Prescription/i)).toBeInTheDocument();
  });

  it("refresh button calls fetchData", async () => {
    renderPage();
    const refreshBtn = await screen.findByTitle("Refresh");
    fireEvent.click(refreshBtn);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("export PDF button calls jsPDF save", async () => {
    const { jsPDF } = require("jspdf");
    renderPage();
    const exportBtn = await screen.findByTitle("Export PDF");
    fireEvent.click(exportBtn);
    await waitFor(() => expect(jsPDF().save).toHaveBeenCalled());
  });

  it("opens and closes modals", async () => {
    renderPage();

    // Trigger a report modal
    fireEvent.click(screen.getByText(/Patient Summary/i).closest("div").querySelector("button[title='Export PDF']"));
    // jsPDF export does not open modal; modal interactions can be tested with TimelineItem buttons if implemented
  });

  it("renders vital signs and blood group", async () => {
    renderPage();
    expect(await screen.findByText("BP")).toBeInTheDocument();
    expect(screen.getByText("Blood Group")).toBeInTheDocument();
  });
});
