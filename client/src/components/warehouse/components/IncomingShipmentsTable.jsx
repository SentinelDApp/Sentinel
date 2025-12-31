import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { TruckIcon, ClockIcon, LocationIcon, EyeIcon, ChevronRightIcon } from "../icons/Icons";

const IncomingShipmentsTable = ({ onSelectShipment }) => {
  const { isDarkMode } = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);

  const shipments = [
    {
      id: "SHP-2024-001",
      source: "Delhi Manufacturing Hub",
      transporter: "FastTrack Logistics",
      eta: "2024-12-30 14:30",
      status: "Arrived",
    },
    {
      id: "SHP-2024-002",
      source: "Gujarat Factory",
      transporter: "SpeedLine Transport",
      eta: "2024-12-30 16:00",
      status: "Pending",
    },
    {
      id: "SHP-2024-003",
      source: "Bangalore Production",
      transporter: "SecureMove Ltd",
      eta: "2024-12-30 18:30",
      status: "Delayed",
    },
    {
      id: "SHP-2024-004",
      source: "Chennai Supplier",
      transporter: "QuickShip Express",
      eta: "2024-12-31 09:00",
      status: "Pending",
    },
    {
      id: "SHP-2024-005",
      source: "Pune Distribution",
      transporter: "TrustFreight Inc",
      eta: "2024-12-31 11:30",
      status: "Pending",
    },
  ];

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

  const handleRowClick = (shipment) => {
    setSelectedRow(shipment.id);
    if (onSelectShipment) {
      onSelectShipment(shipment);
    }
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
              <TruckIcon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Incoming Shipments
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Click on a row to view details
              </p>
            </div>
          </div>
          <span
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}
            `}
          >
            {shipments.length} shipments
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Shipment ID
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Source Location
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Transporter
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                ETA
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}>
            {shipments.map((shipment) => (
              <tr
                key={shipment.id}
                onClick={() => handleRowClick(shipment)}
                className={`
                  cursor-pointer transition-colors
                  ${selectedRow === shipment.id
                    ? isDarkMode
                      ? "bg-emerald-500/5"
                      : "bg-emerald-50/50"
                    : isDarkMode
                    ? "hover:bg-slate-800/50"
                    : "hover:bg-slate-50"
                  }
                `}
              >
                <td className="px-6 py-4">
                  <span className={`font-mono font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {shipment.id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <LocationIcon className={`w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                      {shipment.source}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                    {shipment.transporter}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon className={`w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                      {shipment.eta}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    className={`
                      flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${isDarkMode
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-emerald-600 hover:bg-emerald-50"
                      }
                    `}
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomingShipmentsTable;
