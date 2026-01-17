import { useTheme } from "../context/ThemeContext";
import WarehouseQRScanPanel from "../components/WarehouseQRScanPanel";
import { QRCodeIcon } from "../icons/Icons";

const QRScanPage = () => {
  const { isDarkMode } = useTheme();

  const handleComplete = (data) => {
    console.log("Warehouse scan complete:", data);
  };

  const handleError = (error) => {
    console.error("Warehouse scan error:", error);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}
          >
            <QRCodeIcon
              className={`w-6 h-6 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
            />
          </div>
          <h1
            className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Container Scanner
          </h1>
        </div>
        <p
          className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          Scan and verify incoming container QR codes from shipments
        </p>
      </div>

      {/* Instructions Card */}
      <div
        className={`p-4 rounded-xl border ${
          isDarkMode
            ? "bg-slate-800/30 border-slate-700"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <h3
          className={`text-sm font-semibold mb-2 ${
            isDarkMode ? "text-slate-300" : "text-blue-800"
          }`}
        >
          How to Scan Containers
        </h3>
        <ul
          className={`text-sm space-y-1.5 ${
            isDarkMode ? "text-slate-400" : "text-blue-700"
          }`}
        >
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">1.</span>
            Enter the shipment hash to load expected containers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">2.</span>
            Upload each container QR code image to verify
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">3.</span>
            Only containers already scanned by transporter are accepted
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">4.</span>
            When all containers are scanned, update shipment status
          </li>
        </ul>
      </div>

      {/* Scanner Panel */}
      <div className="max-w-2xl">
        <WarehouseQRScanPanel
          onComplete={handleComplete}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default QRScanPage;
