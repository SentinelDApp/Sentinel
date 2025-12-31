import { useTheme } from "../context/ThemeContext";
import { XMarkIcon, LocationIcon, TruckIcon, ClockIcon, BoxIcon, CheckCircleIcon } from "../icons/Icons";

const ShipmentDetailsPanel = ({ shipment, onClose }) => {
  const { isDarkMode } = useTheme();

  if (!shipment) return null;

  const mockDetails = {
    ...shipment,
    contents: [
      { name: "Electronic Components", quantity: 100, unit: "pcs" },
      { name: "Circuit Boards", quantity: 30, unit: "pcs" },
      { name: "Power Adapters", quantity: 20, unit: "pcs" },
    ],
    weight: "245 kg",
    dimensions: "120 x 80 x 100 cm",
    priority: "High",
    specialInstructions: "Handle with care. Temperature sensitive components.",
    manifest: "MNF-2024-1234",
    qrCode: "QR-001-2024",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Arrived":
        return isDarkMode
          ? "bg-green-500/10 text-green-400 border-green-500/30"
          : "bg-green-50 text-green-600 border-green-200";
      case "Pending":
        return isDarkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
          : "bg-amber-50 text-amber-600 border-amber-200";
      case "Delayed":
        return isDarkMode
          ? "bg-red-500/10 text-red-400 border-red-500/30"
          : "bg-red-50 text-red-600 border-red-200";
      default:
        return isDarkMode
          ? "bg-slate-500/10 text-slate-400 border-slate-500/30"
          : "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div
      className={`
        rounded-2xl overflow-hidden h-full
        ${isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50"
          : "bg-white border border-slate-200/50 shadow-sm"
        }
      `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Shipment Details
            </h3>
            <p className={`font-mono text-sm ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
              {mockDetails.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode 
                ? "text-slate-500 hover:text-white hover:bg-slate-800" 
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}
            `}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(mockDetails.status)}`}>
            {mockDetails.status}
          </span>
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${mockDetails.priority === "High"
                ? isDarkMode
                  ? "bg-red-500/10 text-red-400"
                  : "bg-red-50 text-red-600"
                : isDarkMode
                ? "bg-blue-500/10 text-blue-400"
                : "bg-blue-50 text-blue-600"
              }
            `}
          >
            {mockDetails.priority} Priority
          </span>
        </div>

        {/* Source & Transport Info */}
        <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <LocationIcon className={`w-5 h-5 mt-0.5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Source</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {mockDetails.source}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TruckIcon className={`w-5 h-5 mt-0.5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Transporter</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {mockDetails.transporter}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon className={`w-5 h-5 mt-0.5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>ETA</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {mockDetails.eta}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contents */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Contents
          </h4>
          <div className="space-y-2">
            {mockDetails.contents.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                `}
              >
                <div className="flex items-center gap-2">
                  <BoxIcon className={`w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                    {item.name}
                  </span>
                </div>
                <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Specs */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Weight</p>
            <p className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {mockDetails.weight}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Dimensions</p>
            <p className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {mockDetails.dimensions}
            </p>
          </div>
        </div>

        {/* Reference IDs */}
        <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Manifest ID</span>
              <span className={`font-mono text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {mockDetails.manifest}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>QR Code</span>
              <span className={`font-mono text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {mockDetails.qrCode}
              </span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {mockDetails.specialInstructions && (
          <div
            className={`
              p-4 rounded-xl border-l-4 border-l-amber-500
              ${isDarkMode ? "bg-amber-500/5" : "bg-amber-50"}
            `}
          >
            <p className={`text-xs mb-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
              Special Instructions
            </p>
            <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              {mockDetails.specialInstructions}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            className={`
              flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
              ${isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }
            `}
          >
            Print Manifest
          </button>
          <button
            className={`
              flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
              bg-gradient-to-r from-emerald-500 to-teal-500 text-white
              hover:from-emerald-600 hover:to-teal-600
            `}
          >
            <CheckCircleIcon className="w-5 h-5" />
            Start Verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailsPanel;
