import { useTheme } from "../context/ThemeContext";
import {
  TruckIcon,
  WarehouseIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  BoxIcon,
} from "../icons/Icons";

const statusConfig = {
  created: {
    label: "Created",
    color: "blue",
    icon: BoxIcon,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/30",
  },
  "in-transit": {
    label: "In Transit",
    color: "amber",
    icon: TruckIcon,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    borderColor: "border-amber-500/30",
  },
  warehouse: {
    label: "At Warehouse",
    color: "purple",
    icon: WarehouseIcon,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
    borderColor: "border-purple-500/30",
  },
  delivered: {
    label: "Delivered",
    color: "green",
    icon: CheckCircleIcon,
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
    borderColor: "border-green-500/30",
  },
  delayed: {
    label: "Delayed",
    color: "red",
    icon: ClockIcon,
    bgColor: "bg-red-500/10",
    textColor: "text-red-500",
    borderColor: "border-red-500/30",
  },
};

const ShipmentCard = ({
  id,
  destination,
  status,
  boxes,
  scanned,
  lastUpdate,
  onClick,
  className = "",
}) => {
  const { isDarkMode } = useTheme();
  const config = statusConfig[status] || statusConfig.created;
  const StatusIcon = config.icon;
  const progress = Math.round((scanned / boxes) * 100);

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl p-5 cursor-pointer
        transition-all duration-300 hover:scale-[1.02]
        ${
          isDarkMode
            ? "bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50"
            : "bg-white border border-slate-200/50 hover:border-slate-300 shadow-sm hover:shadow-md"
        }
        ${className}
      `}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {id}
            </h3>
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${config.bgColor} ${config.textColor} ${config.borderColor} border
              `}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">{destination}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Scan Progress
          </span>
          <span
            className={`text-xs font-medium ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {scanned} / {boxes} boxes
          </span>
        </div>
        <div
          className={`h-2 rounded-full overflow-hidden ${
            isDarkMode ? "bg-slate-800" : "bg-slate-200"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r
              ${
                status === "delivered"
                  ? "from-green-500 to-emerald-500"
                  : status === "delayed"
                  ? "from-red-500 to-rose-500"
                  : "from-blue-500 to-cyan-500"
              }
            `}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className={`flex items-center justify-between pt-3 border-t ${
          isDarkMode ? "border-slate-800" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-1">
          <ClockIcon
            className={`w-4 h-4 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <span
            className={`text-xs ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            {lastUpdate}
          </span>
        </div>
        <button
          className={`
            text-xs font-medium px-3 py-1.5 rounded-lg
            transition-colors duration-200
            ${
              isDarkMode
                ? "text-blue-400 hover:bg-blue-500/10"
                : "text-blue-600 hover:bg-blue-50"
            }
          `}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default ShipmentCard;
