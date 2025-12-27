import { useTheme } from "../context/ThemeContext";
import {
  BoxIcon,
  TruckIcon,
  WarehouseIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
} from "../icons/Icons";

const stages = [
  { id: "created", label: "Created", icon: BoxIcon },
  { id: "in-transit", label: "In Transit", icon: TruckIcon },
  { id: "warehouse", label: "Warehouse", icon: WarehouseIcon },
  { id: "delivered", label: "Delivered", icon: CheckCircleIcon },
];

const ShipmentTimeline = ({
  currentStage = "in-transit",
  events = [],
  blockchainVerified = true,
  className = "",
}) => {
  const { isDarkMode } = useTheme();

  const getCurrentStageIndex = () => {
    return stages.findIndex((s) => s.id === currentStage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div
      className={`
        rounded-2xl p-6
        ${
          isDarkMode
            ? "bg-slate-900/50 border border-slate-800/50"
            : "bg-white border border-slate-200/50 shadow-sm"
        }
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`font-semibold text-lg ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Shipment Timeline
        </h3>
        {blockchainVerified && (
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              ${
                isDarkMode
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-green-50 text-green-600 border border-green-200"
              }
            `}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            Blockchain Verified
          </div>
        )}
      </div>

      {/* Progress Stages */}
      <div className="relative mb-8">
        {/* Progress Bar Background */}
        <div
          className={`
            absolute top-6 left-0 right-0 h-1 rounded-full
            ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}
          `}
        />

        {/* Progress Bar Fill */}
        <div
          className="absolute top-6 left-0 h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        />

        {/* Stage Nodes */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
                        : isDarkMode
                        ? "bg-slate-800 border-2 border-slate-700"
                        : "bg-slate-100 border-2 border-slate-200"
                    }
                    ${isCurrent ? "ring-4 ring-blue-500/20" : ""}
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isCompleted
                        ? "text-white"
                        : isDarkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  />
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span
                  className={`
                    mt-3 text-sm font-medium text-center
                    ${
                      isCompleted
                        ? isDarkMode
                          ? "text-white"
                          : "text-slate-900"
                        : isDarkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event History */}
      <div
        className={`border-t pt-6 ${
          isDarkMode ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <h4
          className={`text-sm font-medium mb-4 ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Recent Activity
        </h4>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex items-start gap-4">
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}
                `}
              >
                {event.type === "scan" ? (
                  <UserIcon
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                ) : event.type === "location" ? (
                  <MapPinIcon
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                ) : (
                  <ClockIcon
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {event.title}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isDarkMode ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  {event.description}
                </p>
              </div>
              <span
                className={`text-xs flex-shrink-0 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {event.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTimeline;
