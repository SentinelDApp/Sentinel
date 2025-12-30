import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  QRCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  CameraIcon,
  ArrowPathIcon,
} from "../icons/Icons";

const QRScanPanel = () => {
  const { isDarkMode } = useTheme();
  const [scanStatus, setScanStatus] = useState(null); // null, 'scanning', 'verified', 'failed', 'duplicate'
  const [lastScanResult, setLastScanResult] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const mockScanResults = [
    { id: "QR-001-2024", product: "Electronic Components Batch A", status: "verified" },
    { id: "QR-002-2024", product: "Pharmaceutical Supplies", status: "verified" },
    { id: "QR-003-2024", product: "Industrial Parts Kit", status: "duplicate" },
    { id: "QR-004-2024", product: "Consumer Electronics", status: "failed" },
  ];

  const handleScan = () => {
    setScanStatus("scanning");
    setShowAnimation(true);

    // Simulate scanning delay
    setTimeout(() => {
      const randomResult = mockScanResults[Math.floor(Math.random() * mockScanResults.length)];
      setScanStatus(randomResult.status);
      setLastScanResult(randomResult);
      
      if (randomResult.status === "verified") {
        setTimeout(() => setShowAnimation(false), 1500);
      } else {
        setShowAnimation(false);
      }
    }, 2000);
  };

  const getStatusConfig = () => {
    switch (scanStatus) {
      case "verified":
        return {
          icon: CheckCircleIcon,
          color: isDarkMode ? "text-green-400" : "text-green-600",
          bg: isDarkMode ? "bg-green-500/10" : "bg-green-50",
          border: isDarkMode ? "border-green-500/30" : "border-green-200",
          label: "Verified",
          message: "QR code successfully verified on blockchain",
        };
      case "failed":
        return {
          icon: XCircleIcon,
          color: isDarkMode ? "text-red-400" : "text-red-600",
          bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
          border: isDarkMode ? "border-red-500/30" : "border-red-200",
          label: "Failed",
          message: "QR code verification failed - Invalid or expired",
        };
      case "duplicate":
        return {
          icon: DocumentDuplicateIcon,
          color: isDarkMode ? "text-amber-400" : "text-amber-600",
          bg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50",
          border: isDarkMode ? "border-amber-500/30" : "border-amber-200",
          label: "Duplicate",
          message: "This QR code has already been scanned",
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50"
          : "bg-white border border-slate-200/50 shadow-sm"
        }
      `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}>
            <QRCodeIcon className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              QR Scanner
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              Scan shipment QR codes for verification
            </p>
          </div>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="p-6">
        {/* Scan Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleScan}
            disabled={scanStatus === "scanning"}
            className={`
              relative w-40 h-40 rounded-2xl flex flex-col items-center justify-center gap-3
              transition-all duration-300 transform hover:scale-105
              ${scanStatus === "scanning"
                ? "cursor-not-allowed"
                : "cursor-pointer"
              }
              ${isDarkMode
                ? "bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                : "bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
              }
              shadow-lg shadow-emerald-500/25
            `}
          >
            {/* Pulse Animation */}
            {scanStatus === "scanning" && (
              <>
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" />
                <div className="absolute inset-2 rounded-xl border-2 border-white/30 animate-pulse" />
              </>
            )}

            {/* Success Animation */}
            {showAnimation && scanStatus === "verified" && (
              <div className="absolute inset-0 rounded-2xl bg-green-400/30 animate-pulse" />
            )}

            {scanStatus === "scanning" ? (
              <>
                <ArrowPathIcon className="w-12 h-12 text-white animate-spin" />
                <span className="text-white font-medium">Scanning...</span>
              </>
            ) : (
              <>
                <CameraIcon className="w-12 h-12 text-white" />
                <span className="text-white font-medium">Tap to Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Status Indicator */}
        {statusConfig && scanStatus !== "scanning" && (
          <div
            className={`
              p-4 rounded-xl border mb-4 transition-all duration-300
              ${statusConfig.bg} ${statusConfig.border}
            `}
          >
            <div className="flex items-center gap-3">
              <statusConfig.icon className={`w-6 h-6 ${statusConfig.color}`} />
              <div>
                <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {statusConfig.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Latest Scan Result
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  QR Code ID
                </span>
                <span className={`font-mono font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {lastScanResult.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Product
                </span>
                <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {lastScanResult.product}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Timestamp
                </span>
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanPanel;
