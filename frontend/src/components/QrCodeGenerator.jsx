import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrCodeGenerator = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const qrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);

  const fetchQrData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/qr-code`, {
        headers: { token },
      });
      if (response.data.success) {
        const viewUrl = `${window.location.origin}/qr-details/${response.data.data.qrIdentifier}`;
        setQrData({ ...response.data.data, viewUrl });
      } else {
        toast.error("Failed to fetch QR Code data.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching QR data.");
    }
  };

  const handleOpenModal = () => {
    fetchQrData();
    setModalOpen(true);
  };

  const handleDownload = () => {
    const svg = qrCodeRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "MyHealthQRCode.png";
        downloadLink.href = pngFile;
        downloadLink.click();

        // CORRECTED: Automatically scroll to the scanner after download
        setTimeout(() => {
          scannerContainerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300); // A small delay for a better user experience
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };
  
  useEffect(() => {
    let scanner;
    if (modalOpen && scannerContainerRef.current) {
      if (!scannerContainerRef.current.hasChildNodes()) {
        scanner = new Html5QrcodeScanner(
          'qr-scanner',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        const onScanSuccess = (decodedText) => {
          setScannedData(decodedText);
          if (scanner) {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
          }
        };
        const onScanError = (error) => { /* Required but can be empty */ };
        scanner.render(onScanSuccess, onScanError);
      }
      return () => {
        if (scanner && scanner.getState() !== 3) {
          scanner.clear().catch(error => console.error("Failed to clear scanner on cleanup", error));
        }
      };
    }
  }, [modalOpen]);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="fixed z-10 px-4 py-2 text-white transition-all rounded-full shadow-lg bottom-24 right-5 bg-primary hover:bg-blue-700"
      >
        Generate QR
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">Your Health QR Code</h2>
            {qrData ? (
              <div className="text-center">
                <div ref={qrCodeRef} className="inline-block p-4 bg-white">
                  <QRCode value={qrData.viewUrl} size={256} />
                </div>
                <div className="p-3 my-4 text-left bg-gray-100 rounded">
                  <p><strong>Patient:</strong> {qrData.userId.name}</p>
                  <p><strong>Disease:</strong> {qrData.disease}</p>
                  <p><strong>Medicine:</strong> {qrData.medicine}</p>
                  <p><strong>Doctor:</strong> {qrData.doctorDetails}</p>
                </div>
                <div id="qr-scanner" ref={scannerContainerRef} className="w-full my-4"></div>
                {scannedData && (
                  <div className="p-3 mt-4 bg-green-100 rounded">
                    <p className="font-semibold">Scanned Result:</p>
                    <a href={scannedData} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">{scannedData}</a>
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  <button onClick={handleDownload} className="px-4 py-2 text-white bg-green-500 rounded">Download</button>
                  <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-white bg-gray-500 rounded">Close</button>
                </div>
              </div>
            ) : (
              <p>Loading QR Code...</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QrCodeGenerator;