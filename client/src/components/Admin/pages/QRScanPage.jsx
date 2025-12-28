import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  QRCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertIcon,
  RefreshIcon,
  ShieldCheckIcon,
  BoxIcon,
  ClockIcon,
  MapPinIcon,
} from "../icons/Icons";

const scanStates = {
  idle: "idle",
  scanning: "scanning",
  success: "success",
  duplicate: "duplicate",
  invalid: "invalid",
};

const QRScanPage = () => {
  const { isDarkMode } = useTheme();
  const [scanState, setScanState] = useState(scanStates.idle);
  const [scannedData, setScannedData] = useState(null);
  const [recentScans, setRecentScans] = useState([
    { id: "BOX-001234", time: "2 min ago", status: "success" },
    { id: "BOX-001235", time: "5 min ago", status: "success" },
    { id: "BOX-001236", time: "10 min ago", status: "duplicate" },
  ]);

  const simulateScan = () => {
    setScanState(scanStates.scanning);

    // Simulate scanning delay
    setTimeout(() => {
      const results = ["success", "duplicate", "invalid"];
      const randomResult = results[Math.floor(Math.random() * results.length)];

      setScanState(randomResult);
      setScannedData({
        boxId:
          "BOX-" +
          Math.floor(Math.random() * 10000)
            .toString()
            .padStart(6, "0"),
        shipmentId: "SHP-001234",
        product: "Premium Electronics",
        scannedAt: new Date().toISOString(),
      });
    }, 2000);
  };

  const resetScan = () => {
    setScanState(scanStates.idle);
    setScannedData(null);
  };

  const getStateConfig = () => {
    switch (scanState) {
      case scanStates.success:
        return {
          icon: CheckCircleIcon,
          title: "Scan Successful!",
          subtitle: "Product verified and recorded on blockchain",
          color: "green",
          bgGradient: "from-green-500 to-emerald-500",
        };
      case scanStates.duplicate:
        return {
          icon: AlertIcon,
          title: "Duplicate Scan",
          subtitle: "This product has already been scanned",
          color: "amber",
          bgGradient: "from-amber-500 to-orange-500",
        };
      case scanStates.invalid:
        return {
          icon: XCircleIcon,
          title: "Invalid QR Code",
          subtitle: "This QR code is not recognized",
          color: "red",
          bgGradient: "from-red-500 to-rose-500",
        };
      default:
        return {
          icon: QRCodeIcon,
          title: "Ready to Scan",
          subtitle: "Position QR code within the frame",
          color: "blue",
          bgGradient: "from-blue-500 to-cyan-500",
        };
    }
  };

  const config = getStateConfig();
  const StateIcon = config.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1
          className={`text-2xl lg:text-3xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          QR Scanner
        </h1>
        <p
          className={`mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          Scan product QR codes to verify authenticity and update tracking
        </p>
      </div>

      {/* Main Scanner Card */}
      <div
        className={`
          rounded-3xl overflow-hidden
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-lg"
          }
        `}
      >
        {/* Scanner Viewport */}
        <div className="relative aspect-square max-h-[400px] mx-auto">
          {/* Camera Background */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}
            `}
          >
            {scanState === scanStates.scanning ? (
              <div className="relative">
                {/* Scanning Animation */}
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl animate-pulse" />
                  <div className="absolute inset-4 border border-blue-500/50 rounded-xl" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />

                  {/* Corner Indicators */}
                  {[
                    "top-0 left-0 border-t-4 border-l-4",
                    "top-0 right-0 border-t-4 border-r-4",
                    "bottom-0 left-0 border-b-4 border-l-4",
                    "bottom-0 right-0 border-b-4 border-r-4",
                  ].map((position, index) => (
                    <div
                      key={index}
                      className={`absolute w-8 h-8 border-blue-500 ${position} rounded`}
                    />
                  ))}
                </div>
                <p
                  className={`text-center mt-4 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Scanning...
                </p>
              </div>
            ) : scanState === scanStates.idle ? (
              <div className="text-center">
                <div
                  className={`
                    w-32 h-32 mx-auto rounded-2xl flex items-center justify-center mb-4
                    ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}
                  `}
                >
                  <CameraIcon
                    className={`w-16 h-16 ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  />
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Camera preview will appear here
                </p>
              </div>
            ) : (
              // Result State
              <div className="text-center p-8">
                <div
                  className={`
                    w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6
                    bg-gradient-to-br ${config.bgGradient} shadow-lg
                  `}
                >
                  <StateIcon className="w-12 h-12 text-white" />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {config.title}
                </h2>
                <p
                  className={`mt-2 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {config.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scanned Data (if available) */}
        {scannedData && scanState !== scanStates.idle && (
          <div
            className={`p-6 border-t ${
              isDarkMode ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Box ID", value: scannedData.boxId, icon: BoxIcon },
                {
                  label: "Shipment",
                  value: scannedData.shipmentId,
                  icon: MapPinIcon,
                },
                {
                  label: "Product",
                  value: scannedData.product,
                  icon: ShieldCheckIcon,
                },
                { label: "Scanned At", value: "Just now", icon: ClockIcon },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl
                      ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-4 h-4 ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-slate-500" : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={`p-6 border-t ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-4">
            {scanState === scanStates.idle ||
            scanState === scanStates.scanning ? (
              <button
                onClick={simulateScan}
                disabled={scanState === scanStates.scanning}
                className={`
                  flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg
                  transition-all duration-200
                  ${
                    scanState === scanStates.scanning
                      ? "bg-slate-600 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                  }
                `}
              >
                {scanState === scanStates.scanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-6 h-6" />
                    Start Scan
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={resetScan}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                    bg-gradient-to-r from-blue-500 to-cyan-500 text-white
                    hover:shadow-lg hover:shadow-blue-500/25 transition-all
                  `}
                >
                  <RefreshIcon className="w-5 h-5" />
                  Scan Another
                </button>
                {scanState === scanStates.success && (
                  <button
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors
                      ${
                        isDarkMode
                          ? "bg-slate-800 text-white hover:bg-slate-700"
                          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      }
                    `}
                  >
                    View Details
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div
        className={`
          rounded-2xl p-6
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <h3
          className={`font-semibold mb-4 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Recent Scans
        </h3>
        <div className="space-y-3">
          {recentScans.map((scan, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-4 rounded-xl
                ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${
                      scan.status === "success"
                        ? isDarkMode
                          ? "bg-green-500/10"
                          : "bg-green-50"
                        : isDarkMode
                        ? "bg-amber-500/10"
                        : "bg-amber-50"
                    }
                  `}
                >
                  {scan.status === "success" ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertIcon className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {scan.id}
                  </p>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    {scan.time}
                  </p>
                </div>
              </div>
              <span
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium
                  ${
                    scan.status === "success"
                      ? isDarkMode
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-600"
                      : isDarkMode
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-amber-50 text-amber-600"
                  }
                `}
              >
                {scan.status === "success" ? "Verified" : "Duplicate"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(240px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanPage;
