/**
 * SimpleQRScanner Component
 *
 * Simple QR Code scanning for warehouse operations.
 * - Upload QR code images containing container ID
 * - Server checks if container was already scanned by warehouse
 * - If not scanned, adds new scan log
 * - Shows scan results and history
 */

import { useState, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "../context/ThemeContext";
import { scanContainerForWarehouse } from "../../../services/scanApi";
import {
  QRCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoxIcon,
  TruckIcon,
} from "../icons/Icons";

// Upload Icon Component
const UploadIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

// Refresh Icon Component
const RefreshIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const SimpleQRScanner = ({
  shipmentHash = null,
  onScanSuccess = null,
  onScanError = null,
  onAllScanned = null,
  onShipmentCommitted = null,
}) => {
  const { isDarkMode } = useTheme();

  // Refs
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  // State
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [totalContainers, setTotalContainers] = useState(0);
  const [allContainersScanned, setAllContainersScanned] = useState(false);
  const [currentShipment, setCurrentShipment] = useState(null);

  // Initialize QR scanner
  const getScanner = useCallback(() => {
    if (!scannerRef.current) {
      const scannerId = `simple-qr-scanner-${Date.now()}`;
      let scannerElement = document.getElementById(scannerId);
      if (!scannerElement) {
        scannerElement = document.createElement("div");
        scannerElement.id = scannerId;
        scannerElement.style.display = "none";
        document.body.appendChild(scannerElement);
      }
      scannerRef.current = new Html5Qrcode(scannerId);
    }
    return scannerRef.current;
  }, []);

  // Extract container ID from QR data
  const extractContainerId = (qrData) => {
    if (!qrData) return null;

    let containerId = qrData.trim().toUpperCase();

    // Handle JSON format
    if (qrData.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(qrData);
        containerId = (parsed.containerId || "").toUpperCase();
      } catch (e) {
        // Not JSON, use as-is
      }
    }

    // Extract CNT-xxx pattern if embedded
    const containerMatch = containerId.match(/CNT-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
    if (containerMatch) {
      return containerMatch[0].toUpperCase();
    }

    return containerId;
  };

  // Process scanned QR code
  const processQRCode = async (qrData) => {
    console.log("Processing QR code data:", qrData);

    const containerId = extractContainerId(qrData);

    if (!containerId) {
      setScanResult({
        success: false,
        message: "Could not extract container ID from QR code",
        type: "error",
      });
      return;
    }

    console.log("Extracted container ID:", containerId);
    setIsScanning(true);
    setScanResult(null);

    try {
      // Call API to scan container
      const response = await scanContainerForWarehouse(containerId);
      console.log("API Response:", response);

      const logEntry = {
        containerId,
        timestamp: new Date().toISOString(),
        ...response,
      };

      if (response.success) {
        // Update scan count from the response progress data
        const newScannedCount = response.progress?.scanned || scannedCount + 1;
        const newTotalContainers =
          response.progress?.total ||
          response.shipment?.numberOfContainers ||
          totalContainers;
        const isComplete = response.progress?.isComplete || false;

        setScannedCount(newScannedCount);
        setTotalContainers(newTotalContainers);
        setAllContainersScanned(isComplete);

        // Store shipment info
        if (response.shipment) {
          setCurrentShipment(response.shipment);
        }

        setScanResult({
          success: true,
          message: isComplete
            ? `All ${newTotalContainers} containers scanned! Shipment committed to warehouse.`
            : `Container ${containerId} scanned successfully! (${newScannedCount}/${newTotalContainers})`,
          type: "success",
          data: response,
        });
        setScanLogs((prev) => [logEntry, ...prev]);

        if (onScanSuccess) onScanSuccess(response);

        // Trigger callback when all containers are scanned
        if (isComplete) {
          if (onAllScanned) onAllScanned(response);
          if (onShipmentCommitted) onShipmentCommitted(response.shipment);
        }
      } else {
        // Handle different error codes
        let message = response.message || "Scan failed";
        let type = "error";

        if (response.code === "ALREADY_SCANNED_BY_WAREHOUSE") {
          message = `Container ${containerId} was already scanned by warehouse`;
          type = "duplicate";
        } else if (response.code === "NOT_SCANNED_BY_TRANSPORTER") {
          message = `Container ${containerId} not yet scanned by transporter`;
          type = "warning";
        } else if (response.code === "CONTAINER_NOT_FOUND") {
          message = `Container ${containerId} not found in system`;
          type = "error";
        } else if (response.code === "NOT_READY_FOR_DISPATCH") {
          message = `Container's shipment is not locked on blockchain yet`;
          type = "warning";
        } else if (response.code === "SERVER_ERROR") {
          message = `Server error: Make sure backend is running`;
          type = "error";
        }

        setScanResult({ success: false, message, type, data: response });
        setScanLogs((prev) => [logEntry, ...prev]);
        if (onScanError) onScanError(response);
      }
    } catch (err) {
      console.error("Scan error:", err);
      let errorMessage = err.message || "Failed to scan container";

      // Check for network/server errors
      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError")
      ) {
        errorMessage =
          "Cannot connect to server. Make sure backend is running on port 5000.";
      }

      setScanResult({
        success: false,
        message: errorMessage,
        type: "error",
      });
      if (onScanError) onScanError(err);
    } finally {
      setIsScanning(false);
      clearPreview();
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanResult(null);

    // Scan QR code from image
    setIsScanning(true);
    try {
      const scanner = getScanner();
      const result = await scanner.scanFile(file, true);
      console.log("QR scan result:", result);
      await processQRCode(result);
    } catch (err) {
      console.error("QR scan failed:", err);
      setScanResult({
        success: false,
        message: "No QR code found in image. Please try another image.",
        type: "error",
      });
      setIsScanning(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setScanResult(null);

      setIsScanning(true);
      try {
        const scanner = getScanner();
        const result = await scanner.scanFile(file, true);
        await processQRCode(result);
      } catch (err) {
        setScanResult({
          success: false,
          message: "No QR code found in image",
          type: "error",
        });
        setIsScanning(false);
      }
    }
  };

  // Clear preview
  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  // Trigger file select
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Get result style
  const getResultStyle = (type) => {
    switch (type) {
      case "success":
        return {
          bg: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
          border: isDarkMode ? "border-emerald-500/30" : "border-emerald-200",
          text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
          icon: CheckCircleIcon,
        };
      case "duplicate":
        return {
          bg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50",
          border: isDarkMode ? "border-amber-500/30" : "border-amber-200",
          text: isDarkMode ? "text-amber-400" : "text-amber-600",
          icon: BoxIcon,
        };
      case "warning":
        return {
          bg: isDarkMode ? "bg-orange-500/10" : "bg-orange-50",
          border: isDarkMode ? "border-orange-500/30" : "border-orange-200",
          text: isDarkMode ? "text-orange-400" : "text-orange-600",
          icon: TruckIcon,
        };
      default:
        return {
          bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
          border: isDarkMode ? "border-red-500/30" : "border-red-200",
          text: isDarkMode ? "text-red-400" : "text-red-600",
          icon: XCircleIcon,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* All Containers Scanned Banner */}
      {allContainersScanned && currentShipment && (
        <div
          className={`
          p-4 rounded-xl border
          ${isDarkMode ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"}
        `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${isDarkMode ? "bg-green-500/20" : "bg-green-100"}`}
            >
              <CheckCircleIcon
                className={`w-8 h-8 ${isDarkMode ? "text-green-400" : "text-green-600"}`}
              />
            </div>
            <div>
              <p
                className={`text-lg font-bold ${isDarkMode ? "text-green-400" : "text-green-700"}`}
              >
                🎉 Shipment Committed!
              </p>
              <p
                className={`text-sm ${isDarkMode ? "text-green-400/70" : "text-green-600"}`}
              >
                All {totalContainers} containers received at warehouse
              </p>
              <p
                className={`text-xs font-mono mt-1 ${isDarkMode ? "text-green-400/50" : "text-green-500"}`}
              >
                {currentShipment.shipmentHash}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Counter with Progress */}
      {scannedCount > 0 && !allContainersScanned && (
        <div
          className={`
          p-4 rounded-xl border
          ${isDarkMode ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"}
        `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-500/20" : "bg-purple-100"}`}
              >
                <BoxIcon
                  className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                />
              </div>
              <div>
                <p
                  className={`font-semibold ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}
                >
                  Scanning Progress
                </p>
                <p
                  className={`text-sm ${isDarkMode ? "text-purple-400/70" : "text-purple-600"}`}
                >
                  {scannedCount} of {totalContainers || "?"} containers scanned
                </p>
              </div>
            </div>
            <div
              className={`text-right ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
            >
              <span className="text-2xl font-bold">{scannedCount}</span>
              <span className="text-lg">/{totalContainers || "?"}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {totalContainers > 0 && (
            <div
              className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-cyan-500"
                style={{
                  width: `${Math.round((scannedCount / totalContainers) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!previewUrl && !isScanning ? triggerFileSelect : undefined}
        className={`
          relative min-h-[200px] rounded-xl border-2 border-dashed
          transition-all duration-200 overflow-hidden
          ${isScanning ? "cursor-wait" : previewUrl ? "cursor-default" : "cursor-pointer"}
          ${
            isDragging
              ? isDarkMode
                ? "border-purple-500 bg-purple-500/10"
                : "border-purple-500 bg-purple-50"
              : isDarkMode
                ? "border-slate-700 hover:border-purple-500/50 bg-slate-800/30"
                : "border-slate-300 hover:border-purple-400 bg-slate-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isScanning}
        />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[200px]">
            <img
              src={previewUrl}
              alt="QR Code"
              className="w-full h-full object-contain p-4"
            />

            {/* Clear button */}
            {!isScanning && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                  setScanResult(null);
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-400"
                    : "bg-white hover:bg-slate-100 text-slate-600"
                } shadow-lg`}
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            )}

            {/* Scanning overlay */}
            {isScanning && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  isDarkMode ? "bg-slate-900/70" : "bg-white/70"
                }`}
              >
                <div
                  className={`px-6 py-4 rounded-xl flex items-center gap-3 ${
                    isDarkMode ? "bg-slate-800" : "bg-white shadow-lg"
                  }`}
                >
                  <RefreshIcon
                    className={`w-6 h-6 animate-spin ${
                      isDarkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Verifying Container...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDragging
                  ? isDarkMode
                    ? "bg-purple-500/20"
                    : "bg-purple-100"
                  : isDarkMode
                    ? "bg-slate-700"
                    : "bg-slate-200"
              }`}
            >
              <UploadIcon
                className={`w-8 h-8 ${
                  isDragging
                    ? isDarkMode
                      ? "text-purple-400"
                      : "text-purple-600"
                    : isDarkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                }`}
              />
            </div>
            <p
              className={`font-semibold mb-1 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {isDragging ? "Drop image here" : "Upload Container QR Code"}
            </p>
            <p
              className={`text-sm text-center ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Drag and drop or click to select an image
            </p>
          </div>
        )}
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div
          className={`
          p-4 rounded-xl border
          ${getResultStyle(scanResult.type).bg}
          ${getResultStyle(scanResult.type).border}
        `}
        >
          <div className="flex items-start gap-3">
            {(() => {
              const Icon = getResultStyle(scanResult.type).icon;
              return (
                <Icon
                  className={`w-5 h-5 mt-0.5 ${getResultStyle(scanResult.type).text}`}
                />
              );
            })()}
            <div>
              <p
                className={`font-medium ${getResultStyle(scanResult.type).text}`}
              >
                {scanResult.success ? "Scan Successful" : "Scan Issue"}
              </p>
              <p
                className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                {scanResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanLogs.length > 0 && (
        <div
          className={`
          rounded-xl border overflow-hidden
          ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}
        `}
        >
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
          >
            <h4
              className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Scan History
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {scanLogs.map((log, index) => (
              <div
                key={index}
                className={`
                  px-4 py-3 flex items-center justify-between border-b last:border-b-0
                  ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}
                `}
              >
                <div className="flex items-center gap-3">
                  {log.success ? (
                    <CheckCircleIcon
                      className={`w-4 h-4 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                    />
                  ) : (
                    <XCircleIcon
                      className={`w-4 h-4 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                    />
                  )}
                  <span
                    className={`font-mono text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {log.containerId}
                  </span>
                </div>
                <span
                  className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/30" : "bg-slate-100"}`}
      >
        <h4
          className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          How it works
        </h4>
        <ul
          className={`text-sm space-y-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
        >
          <li>• Upload an image containing a container QR code</li>
          <li>• System checks if container was already scanned</li>
          <li>• New scans are logged and counter updates</li>
          <li>• Duplicate scans are prevented</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleQRScanner;
