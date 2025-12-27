import { useTheme } from "../context/ThemeContext";
import {
  TruckIcon,
  WarehouseIcon,
  CheckCircleIcon,
  ClockIcon,
  BoxIcon,
  EyeIcon,
  ChevronRightIcon,
} from "../icons/Icons";

const statusConfig = {
  created: { label: "Created", color: "blue", icon: BoxIcon },
  "in-transit": { label: "In Transit", color: "amber", icon: TruckIcon },
  warehouse: { label: "Warehouse", color: "purple", icon: WarehouseIcon },
  delivered: { label: "Delivered", color: "green", icon: CheckCircleIcon },
  delayed: { label: "Delayed", color: "red", icon: ClockIcon },
};

const ActiveShipmentsList = ({
  shipments = [],
  onViewShipment,
  className = "",
}) => {
  const { isDarkMode } = useTheme();

  const getStatusStyles = (status) => {
    const config = statusConfig[status] || statusConfig.created;
    const colors = {
      blue: isDarkMode
        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
        : "bg-blue-50 text-blue-600 border-blue-200",
      amber: isDarkMode
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-amber-50 text-amber-600 border-amber-200",
      purple: isDarkMode
        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
        : "bg-purple-50 text-purple-600 border-purple-200",
      green: isDarkMode
        ? "bg-green-500/10 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-600 border-green-200",
      red: isDarkMode
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-600 border-red-200",
    };
    return { ...config, styles: colors[config.color] };
  };

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${
          isDarkMode
            ? "bg-slate-900/50 border border-slate-800/50"
            : "bg-white border border-slate-200/50 shadow-sm"
        }
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b ${
          isDarkMode ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Active Shipments
            </h3>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {shipments.length} shipments in progress
            </p>
          </div>
          <button
            className={`
              text-sm font-medium px-4 py-2 rounded-xl transition-colors
              ${
                isDarkMode
                  ? "text-blue-400 hover:bg-blue-500/10"
                  : "text-blue-600 hover:bg-blue-50"
              }
            `}
          >
            View All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
              {[
                "Shipment ID",
                "Destination",
                "Status",
                "Progress",
                "Last Update",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className={`
                    px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                    ${isDarkMode ? "text-slate-400" : "text-slate-500"}
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDarkMode ? "divide-slate-800" : "divide-slate-100"
            }`}
          >
            {shipments.map((shipment) => {
              const statusInfo = getStatusStyles(shipment.status);
              const StatusIcon = statusInfo.icon;
              const progress = Math.round(
                (shipment.scanned / shipment.boxes) * 100
              );

              return (
                <tr
                  key={shipment.id}
                  className={`
                    group transition-colors cursor-pointer
                    ${
                      isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                    }
                  `}
                  onClick={() => onViewShipment?.(shipment.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {shipment.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }
                    >
                      {shipment.destination}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${statusInfo.styles}
                      `}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-20 h-2 rounded-full overflow-hidden ${
                          isDarkMode ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {shipment.lastUpdate}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className={`
                          p-2 rounded-lg transition-colors
                          ${
                            isDarkMode
                              ? "text-slate-400 hover:text-white hover:bg-slate-700"
                              : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          }
                        `}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <ChevronRightIcon
                        className={`
                          w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                          ${isDarkMode ? "text-slate-500" : "text-slate-400"}
                        `}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {shipments.length === 0 && (
        <div className="px-6 py-12 text-center">
          <TruckIcon
            className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? "text-slate-700" : "text-slate-300"
            }`}
          />
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            No active shipments found
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveShipmentsList;
