/**
 * WarehouseQRScanPanel Component
 *
 * QR Code scanning panel for warehouse operations.
 *
 * Features:
 * - Upload QR code images (no camera)
 * - Verify container exists on blockchain
 * - Check container was scanned by transporter
 * - Track real-time scanning progress
 * - Show update status button when all containers scanned
 * - Prevent duplicate scans
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import useWarehouseQRScanner from "../hooks/useWarehouseQRScanner";
import {
  QRCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
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

// Alert Icon Component
const AlertIcon = ({ className = "w-6 h-6" }) => (
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
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const WarehouseQRScanPanel = ({
  shipmentHash = null,
  onComplete = null,
  onError = null,
}) => {
  const { isDarkMode } = useTheme();
  const { walletAddress } = useAuth();

  // File input ref
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [manualShipmentHash, setManualShipmentHash] = useState("");

  // Use warehouse scanner hook
  const {
    scanState,
    shipmentData,
    containers,
    scannedContainers,
    scanLogs,
    currentScan,
    error,
    progress,
    isIdle,
    isLoading,
    isReadyToScan,
    isScanning,
    isAllScanned,
    isUpdating,
    isCompleted,
    hasError,
    initializeWithShipment,
    processQRScan,
    confirmWarehouseArrival,
    resetScanner,
    SCAN_RESULT,
  } = useWarehouseQRScanner({
    walletAddress,
    onScanComplete: (container, response) => {
      console.log("Container scanned:", container);
    },
    onAllScanned: (data) => {
      console.log("All containers scanned:", data);
    },
    onStatusUpdated: (data) => {
      console.log("Status updated:", data);
      if (onComplete) onComplete(data);
    },
    onError: (err) => {
      console.error("Scanner error:", err);
      if (onError) onError(err);
    },
  });

  // Initialize scanner when shipmentHash prop changes
  useEffect(() => {
    if (shipmentHash) {
      initializeWithShipment(shipmentHash);
    }
  }, [shipmentHash, initializeWithShipment]);

  // Initialize QR scanner
  const getScanner = useCallback(() => {
    if (!scannerRef.current) {
      const scannerId = `warehouse-qr-scanner-${Date.now()}`;
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

  // Handle shipment initialization
  const handleInitializeShipment = async () => {
    const hash = manualShipmentHash.trim();
    if (!hash) return;
    await initializeWithShipment(hash);
  };

  // Scan QR from image file
  const scanImageFile = useCallback(
    async (file) => {
      if (!file) return;

      setIsProcessingImage(true);
      setPreviewUrl(URL.createObjectURL(file));

      try {
        const scanner = getScanner();
        const result = await scanner.scanFile(file, true);

        console.log("QR Code detected:", result);

        // Process the scan
        await processQRScan(result);
      } catch (err) {
        console.error("QR scan error:", err);
        // No QR code found in image
        await processQRScan(null);
      } finally {
        setIsProcessingImage(false);
      }
    },
    [getScanner, processQRScan],
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        scanImageFile(file);
      }
    },
    [scanImageFile],
  );

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        scanImageFile(file);
      }
    },
    [scanImageFile],
  );

  // Clear preview
  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Trigger file input
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Get scan result config for display
  const getScanResultConfig = (result) => {
    switch (result) {
      case SCAN_RESULT.SUCCESS:
        return {
          icon: CheckCircleIcon,
          color: isDarkMode ? "text-green-400" : "text-green-600",
          bg: isDarkMode ? "bg-green-500/10" : "bg-green-50",
          border: isDarkMode ? "border-green-500/30" : "border-green-200",
          label: "Verified",
          description: "Container verified on blockchain",
        };
      case SCAN_RESULT.DUPLICATE:
        return {
          icon: DocumentDuplicateIcon,
          color: isDarkMode ? "text-amber-400" : "text-amber-600",
          bg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50",
          border: isDarkMode ? "border-amber-500/30" : "border-amber-200",
          label: "Duplicate",
          description: "Container already scanned",
        };
      case SCAN_RESULT.NOT_FOUND:
        return {
          icon: XCircleIcon,
          color: isDarkMode ? "text-red-400" : "text-red-600",
          bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
          border: isDarkMode ? "border-red-500/30" : "border-red-200",
          label: "Not Found",
          description: "Container not found in system",
        };
      case SCAN_RESULT.NOT_ON_BLOCKCHAIN:
        return {
          icon: XCircleIcon,
          color: isDarkMode ? "text-red-400" : "text-red-600",
          bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
          border: isDarkMode ? "border-red-500/30" : "border-red-200",
          label: "Not on Blockchain",
          description: "Shipment not locked on blockchain",
        };
      case SCAN_RESULT.NOT_SCANNED_BY_TRANSPORTER:
        return {
          icon: TruckIcon,
          color: isDarkMode ? "text-orange-400" : "text-orange-600",
          bg: isDarkMode ? "bg-orange-500/10" : "bg-orange-50",
          border: isDarkMode ? "border-orange-500/30" : "border-orange-200",
          label: "Transporter Scan Required",
          description: "Container must be scanned by transporter first",
        };
      default:
        return {
          icon: XCircleIcon,
          color: isDarkMode ? "text-red-400" : "text-red-600",
          bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
          border: isDarkMode ? "border-red-500/30" : "border-red-200",
          label: "Error",
          description: "Scan verification failed",
        };
    }
  };

  // Render idle state - now shows upload zone directly
  const renderIdleState = () => (
    <div className="space-y-6">
      {/* Upload Zone - shown immediately */}
      {renderUploadZone()}

      {/* Current scan result in idle state */}
      {currentScan && renderCurrentScanResult()}

      {/* Instructions */}
      <div
        className={`p-4 rounded-xl ${
          isDarkMode ? "bg-slate-800/30" : "bg-slate-100"
        }`}
      >
        <h4
          className={`text-sm font-medium mb-2 ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Instructions
        </h4>
        <ul
          className={`text-sm space-y-2 ${
            isDarkMode ? "text-slate-500" : "text-slate-500"
          }`}
        >
          <li>• Upload a container QR code image to scan</li>
          <li>• Only containers scanned by transporter can be verified</li>
          <li>• Each container can only be scanned once by warehouse</li>
          <li>• Scan logs will appear below after verification</li>
        </ul>
      </div>

      {/* Scan logs in idle state */}
      {scanLogs.length > 0 && renderScanLogs()}
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`w-16 h-16 rounded-full border-4 animate-spin mb-4 ${
          isDarkMode
            ? "border-purple-500/20 border-t-purple-400"
            : "border-purple-200 border-t-purple-500"
        }`}
      />
      <p
        className={`text-lg font-semibold ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`}
      >
        Loading Shipment...
      </p>
      <p
        className={`text-sm mt-1 ${
          isDarkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Fetching shipment and container details
      </p>
    </div>
  );

  // Render progress bar
  const renderProgressBar = () => (
    <div
      className={`p-4 rounded-xl border ${
        isDarkMode
          ? "bg-slate-800/50 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isDarkMode ? "bg-purple-500/20" : "bg-purple-100"
            }`}
          >
            <BoxIcon
              className={`w-5 h-5 ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
          </div>
          <div>
            <p
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {shipmentData?.batchId || shipmentData?.shipmentHash}
            </p>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Scanning Progress
            </p>
          </div>
        </div>
        <div
          className={`text-right ${
            isDarkMode ? "text-purple-400" : "text-purple-600"
          }`}
        >
          <span className="text-2xl font-bold">{progress.scanned}</span>
          <span className="text-lg"> / {progress.total}</span>
        </div>
      </div>

      <div
        className={`h-3 rounded-full overflow-hidden ${
          isDarkMode ? "bg-slate-700" : "bg-slate-200"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress.isComplete
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : "bg-gradient-to-r from-purple-500 to-cyan-500"
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      <p
        className={`text-center text-sm mt-2 ${
          isDarkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {progress.isComplete
          ? "✓ All containers scanned"
          : `${progress.remaining} container${progress.remaining !== 1 ? "s" : ""} remaining`}
      </p>
    </div>
  );

  // Render upload zone
  const renderUploadZone = () => (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!previewUrl && !isScanning ? triggerFileSelect : undefined}
      className={`
        relative min-h-[220px] rounded-xl border-2 border-dashed
        transition-all duration-200 overflow-hidden
        ${isScanning || isProcessingImage ? "cursor-wait" : previewUrl ? "cursor-default" : "cursor-pointer"}
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
        disabled={isScanning || isProcessingImage}
      />

      {previewUrl ? (
        <div className="relative w-full h-full min-h-[220px]">
          <img
            src={previewUrl}
            alt="QR Code"
            className="w-full h-full object-contain p-4"
          />

          {/* Clear button */}
          {!isScanning && !isProcessingImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
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

          {/* Processing overlay */}
          {(isScanning || isProcessingImage) && (
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
                <ArrowPathIcon
                  className={`w-6 h-6 animate-spin ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <span
                  className={`font-medium ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Verifying QR Code...
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[220px] p-8">
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

          <h3
            className={`text-lg font-semibold mb-2 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            {isDragging ? "Drop QR Code Image" : "Upload QR Code"}
          </h3>

          <p
            className={`text-sm text-center ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Drag and drop a container QR code image, or click to browse
          </p>
        </div>
      )}
    </div>
  );

  // Render current scan result
  const renderCurrentScanResult = () => {
    if (!currentScan || currentScan.status === "processing") return null;

    const lastLog = scanLogs[0];
    if (!lastLog) return null;

    const config = getScanResultConfig(lastLog.result);
    const Icon = config.icon;

    return (
      <div className={`p-4 rounded-xl border ${config.bg} ${config.border}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.color}`}>{config.label}</p>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {lastLog.message}
            </p>
            {lastLog.containerId && (
              <p
                className={`text-xs font-mono mt-1 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {lastLog.containerId}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render scan logs
  const renderScanLogs = () => {
    if (scanLogs.length === 0) return null;

    return (
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? "border-slate-700" : "border-slate-200"
        }`}
      >
        <div
          className={`px-4 py-3 border-b ${
            isDarkMode
              ? "bg-slate-800/50 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <h4
            className={`text-sm font-medium ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Recent Scans ({scanLogs.length})
          </h4>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {scanLogs.slice(0, 10).map((log, index) => {
            const config = getScanResultConfig(log.result);
            const Icon = config.icon;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-2 border-b last:border-b-0 ${
                  isDarkMode ? "border-slate-800" : "border-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-mono truncate ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {log.containerId || "Unknown"}
                  </p>
                </div>
                <span
                  className={`text-xs ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render update status button
  const renderUpdateStatusButton = () => {
    if (!isAllScanned) return null;

    return (
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode
            ? "bg-green-500/10 border-green-500/30"
            : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-green-500/20" : "bg-green-100"
            }`}
          >
            <CheckCircleIcon
              className={`w-8 h-8 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
          <div>
            <h3
              className={`text-lg font-bold ${
                isDarkMode ? "text-green-400" : "text-green-700"
              }`}
            >
              All Containers Scanned!
            </h3>
            <p
              className={`text-sm ${
                isDarkMode ? "text-green-400/70" : "text-green-600"
              }`}
            >
              {progress.scanned} of {progress.total} containers verified
            </p>
          </div>
        </div>

        <button
          onClick={confirmWarehouseArrival}
          disabled={isUpdating}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            isUpdating
              ? "bg-slate-500 cursor-wait"
              : "bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/25"
          }`}
        >
          {isUpdating ? (
            <span className="flex items-center justify-center gap-2">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Updating Status...
            </span>
          ) : (
            "Update Shipment Status to Arrived"
          )}
        </button>
      </div>
    );
  };

  // Render completed state
  const renderCompletedState = () => (
    <div
      className={`p-8 rounded-xl border text-center ${
        isDarkMode
          ? "bg-green-500/10 border-green-500/30"
          : "bg-green-50 border-green-200"
      }`}
    >
      <div
        className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          isDarkMode ? "bg-green-500/20" : "bg-green-100"
        }`}
      >
        <CheckCircleIcon
          className={`w-12 h-12 ${
            isDarkMode ? "text-green-400" : "text-green-600"
          }`}
        />
      </div>
      <h3
        className={`text-xl font-bold mb-2 ${
          isDarkMode ? "text-green-400" : "text-green-700"
        }`}
      >
        Shipment Arrived at Warehouse
      </h3>
      <p
        className={`text-sm mb-6 ${
          isDarkMode ? "text-green-400/70" : "text-green-600"
        }`}
      >
        Status updated successfully. All {progress.total} containers received.
      </p>
      <button
        onClick={resetScanner}
        className={`px-6 py-3 rounded-xl font-medium transition-colors ${
          isDarkMode
            ? "bg-slate-800 text-white hover:bg-slate-700"
            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
        }`}
      >
        Scan Another Shipment
      </button>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div
      className={`p-6 rounded-xl border ${
        isDarkMode
          ? "bg-red-500/10 border-red-500/30"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2 rounded-lg ${
            isDarkMode ? "bg-red-500/20" : "bg-red-100"
          }`}
        >
          <AlertIcon
            className={`w-6 h-6 ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}
          />
        </div>
        <div className="flex-1">
          <h4
            className={`font-semibold ${
              isDarkMode ? "text-red-400" : "text-red-700"
            }`}
          >
            Error Loading Shipment
          </h4>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? "text-red-400/70" : "text-red-600"
            }`}
          >
            {error}
          </p>
        </div>
      </div>
      <button
        onClick={resetScanner}
        className={`mt-4 w-full py-3 rounded-xl font-medium transition-colors ${
          isDarkMode
            ? "bg-slate-800 text-white hover:bg-slate-700"
            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
        }`}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div
      className={`rounded-2xl overflow-hidden ${
        isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50"
          : "bg-white border border-slate-200/50 shadow-sm"
      }`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b ${
          isDarkMode ? "border-slate-800" : "border-slate-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode ? "bg-purple-500/10" : "bg-purple-50"
              }`}
            >
              <QRCodeIcon
                className={`w-5 h-5 ${
                  isDarkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Container QR Scanner
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Verify and receive incoming containers
              </p>
            </div>
          </div>

          {/* Reset button when not idle */}
          {!isIdle && !isLoading && (
            <button
              onClick={resetScanner}
              className={`text-sm font-medium transition-colors ${
                isDarkMode
                  ? "text-purple-400 hover:text-purple-300"
                  : "text-purple-600 hover:text-purple-700"
              }`}
            >
              New Scan
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {isIdle && renderIdleState()}
        {isLoading && renderLoadingState()}
        {hasError && renderErrorState()}
        {isCompleted && renderCompletedState()}

        {(isReadyToScan || isScanning || isAllScanned) && !isCompleted && (
          <>
            {renderProgressBar()}

            {!isAllScanned && (
              <>
                {renderUploadZone()}
                {renderCurrentScanResult()}
              </>
            )}

            {renderUpdateStatusButton()}
            {renderScanLogs()}
          </>
        )}
      </div>
    </div>
  );
};

export default WarehouseQRScanPanel;
