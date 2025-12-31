import { useTheme } from "../context/ThemeContext";
import {
  BlockchainIcon,
  CheckCircleIcon,
  TruckIcon,
  QRCodeIcon,
  BoxIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
} from "../icons/Icons";

const BlockchainActivityLog = () => {
  const { isDarkMode } = useTheme();

  const activities = [
    {
      id: 1,
      type: "verification",
      icon: ShieldCheckIcon,
      title: "Shipment Verified",
      description: "SHP-2024-001 verified and recorded on blockchain",
      timestamp: "2024-12-30 12:45:22",
      txHash: "0x7a3f...8b2c",
    },
    {
      id: 2,
      type: "scan",
      icon: QRCodeIcon,
      title: "QR Code Scanned",
      description: "QR-001-2024 authenticated successfully",
      timestamp: "2024-12-30 12:30:15",
      txHash: "0x9c2e...4d1f",
    },
    {
      id: 3,
      type: "dispatch",
      icon: ArrowUpTrayIcon,
      title: "Shipment Dispatched",
      description: "SHP-2024-005 dispatched to QuickShip Transport",
      timestamp: "2024-12-30 11:55:08",
      txHash: "0x3b7a...9e5c",
    },
    {
      id: 4,
      type: "arrival",
      icon: TruckIcon,
      title: "Shipment Arrived",
      description: "SHP-2024-001 arrived from Delhi Manufacturing Hub",
      timestamp: "2024-12-30 11:20:33",
      txHash: "0x5d4c...2a8f",
    },
    {
      id: 5,
      type: "inventory",
      icon: BoxIcon,
      title: "Inventory Updated",
      description: "150 units added to warehouse inventory",
      timestamp: "2024-12-30 10:45:11",
      txHash: "0x1e9b...6c3d",
    },
    {
      id: 6,
      type: "verification",
      icon: CheckCircleIcon,
      title: "Quality Check Passed",
      description: "Batch QC-2024-089 passed all verification checks",
      timestamp: "2024-12-30 10:15:45",
      txHash: "0x8f2d...7a1e",
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "verification":
        return isDarkMode ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-50";
      case "scan":
        return isDarkMode ? "text-purple-400 bg-purple-500/10" : "text-purple-600 bg-purple-50";
      case "dispatch":
        return isDarkMode ? "text-orange-400 bg-orange-500/10" : "text-orange-600 bg-orange-50";
      case "arrival":
        return isDarkMode ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50";
      case "inventory":
        return isDarkMode ? "text-teal-400 bg-teal-500/10" : "text-teal-600 bg-teal-50";
      default:
        return isDarkMode ? "text-slate-400 bg-slate-500/10" : "text-slate-600 bg-slate-50";
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
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
              <BlockchainIcon className={`w-5 h-5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Blockchain Activity Log
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Immutable record of all transactions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div
            className={`
              absolute left-6 top-0 bottom-0 w-px
              ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}
            `}
          />

          {/* Activity items */}
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon;
              const colorClasses = getTypeColor(activity.type);

              return (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`
                      relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                      ${colorClasses}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div
                    className={`
                      flex-1 p-4 rounded-xl transition-colors
                      ${isDarkMode 
                        ? "bg-slate-800/50 hover:bg-slate-800" 
                        : "bg-slate-50 hover:bg-slate-100"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {activity.title}
                      </h4>
                      <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                        Tx:
                      </span>
                      <span
                        className={`
                          text-xs font-mono px-2 py-0.5 rounded
                          ${isDarkMode 
                            ? "bg-slate-700 text-slate-400" 
                            : "bg-slate-200 text-slate-600"}
                        `}
                      >
                        {activity.txHash}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <button
          className={`
            text-sm font-medium transition-colors
            ${isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}
          `}
        >
          View full activity log →
        </button>
      </div>
    </div>
  );
};

export default BlockchainActivityLog;
