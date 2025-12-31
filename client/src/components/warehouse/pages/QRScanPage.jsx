import { useTheme } from "../context/ThemeContext";
import QRScanPanel from "../components/QRScanPanel";
import { QRCodeIcon } from "../icons/Icons";

const QRScanPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}>
            <QRCodeIcon className={`w-6 h-6 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            QR Scanner
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Scan and verify shipment QR codes on the blockchain
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <QRScanPanel />
      </div>
    </div>
  );
};

export default QRScanPage;
