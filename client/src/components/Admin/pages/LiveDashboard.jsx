import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  AlertIcon,
  CheckCircleIcon,
  TruckIcon,
  BoxIcon,
  ClockIcon,
  RefreshIcon,
  MapPinIcon,
  BellIcon,
  XMarkIcon,
  EyeIcon,
} from "../icons/Icons";

// Empty shipment tracking data (will be populated from API)
const shipmentsData = [];

const LiveDashboard = () => {
  const { isDarkMode } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }, 1000);
  };

  const handleTrack = (shipment) => {
    setSelectedShipment(selectedShipment?.id === shipment.id ? null : shipment);
  };

  const getStatusBadge = (status) => {
    const styles = {
      "in-transit": isDarkMode
        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
        : "bg-blue-50 text-blue-600 border-blue-200",
      delivered: isDarkMode
        ? "bg-green-500/10 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-600 border-green-200",
      delayed: isDarkMode
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-600 border-red-200",
      processing: isDarkMode
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-amber-50 text-amber-600 border-amber-200",
    };
    return styles[status] || styles["processing"];
  };

  const getProgressColor = (progress, status) => {
    if (status === "delayed") return "from-red-500 to-rose-500";
    if (progress >= 100) return "from-green-500 to-emerald-500";
    if (progress >= 50) return "from-blue-500 to-cyan-500";
    return "from-amber-500 to-orange-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className={`text-2xl lg:text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Live Dashboard
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-500">Live</span>
            </div>
          </div>
          <p
            className={`mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Real-time shipment tracking and monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
              ${
                isDarkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              }
            `}
          >
            <RefreshIcon
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Shipment Tracking Table */}
      <div
        className={`
          rounded-2xl overflow-hidden
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Shipment Tracking
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Monitor all active shipments in real-time
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode
                    ? "text-slate-400 bg-slate-800/50"
                    : "text-slate-500 bg-slate-50"
                }`}
              >
                <th className="px-6 py-4">Shipment ID</th>
                <th className="px-6 py-4">Product ID</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Last Updated By</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Last Update At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-slate-800" : "divide-slate-100"
              }`}
            >
              {shipmentsData.map((shipment) => (
                <>
                  <tr
                    key={shipment.id}
                    className={`transition-colors ${
                      isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                    } ${
                      selectedShipment?.id === shipment.id
                        ? isDarkMode
                          ? "bg-slate-800/30"
                          : "bg-blue-50/50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {shipment.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-mono text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        {shipment.productId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div
                          className={`flex-1 h-2 rounded-full overflow-hidden ${
                            isDarkMode ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                              shipment.progress,
                              shipment.status
                            )}`}
                            style={{ width: `${shipment.progress}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {shipment.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-mono text-xs px-2 py-1 rounded-lg ${
                          isDarkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {shipment.lastUpdatedBy.slice(0, 10)}...
                        {shipment.lastUpdatedBy.slice(-6)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {shipment.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ClockIcon
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {shipment.lastUpdateAt}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleTrack(shipment)}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            selectedShipment?.id === shipment.id
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                              : isDarkMode
                              ? "bg-slate-800 text-blue-400 hover:bg-slate-700"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }
                        `}
                      >
                        <EyeIcon className="w-4 h-4" />
                        {selectedShipment?.id === shipment.id
                          ? "Hide"
                          : "Track"}
                      </button>
                    </td>
                  </tr>

                  {/* Activity Table - Shown when Track is clicked */}
                  {selectedShipment?.id === shipment.id && (
                    <tr key={`${shipment.id}-activity`}>
                      <td colSpan="7" className="px-6 py-4">
                        <div
                          className={`
                            rounded-xl p-4
                            ${
                              isDarkMode
                                ? "bg-slate-800/50 border border-slate-700/50"
                                : "bg-slate-50 border border-slate-200"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
                              }`}
                            >
                              <BoxIcon className="w-4 h-4 text-blue-500" />
                            </div>
                            <h4
                              className={`font-semibold ${
                                isDarkMode ? "text-white" : "text-slate-900"
                              }`}
                            >
                              Activity History for {shipment.id}
                            </h4>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr
                                  className={`text-left text-xs font-medium uppercase tracking-wider ${
                                    isDarkMode
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <th className="pb-3 pr-4">Activity</th>
                                  <th className="pb-3 pr-4">
                                    Done By (Hash ID)
                                  </th>
                                  <th className="pb-3 pr-4">Location</th>
                                  <th className="pb-3">Timestamp</th>
                                </tr>
                              </thead>
                              <tbody
                                className={`divide-y ${
                                  isDarkMode
                                    ? "divide-slate-700/50"
                                    : "divide-slate-200"
                                }`}
                              >
                                {shipment.activities.map((activity, idx) => (
                                  <tr key={idx} className="transition-colors">
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            idx === 0
                                              ? "bg-green-500"
                                              : isDarkMode
                                              ? "bg-slate-600"
                                              : "bg-slate-300"
                                          }`}
                                        />
                                        <span
                                          className={`text-sm ${
                                            isDarkMode
                                              ? "text-slate-200"
                                              : "text-slate-700"
                                          }`}
                                        >
                                          {activity.activity}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <span
                                        className={`font-mono text-xs px-2 py-1 rounded ${
                                          isDarkMode
                                            ? "bg-slate-700 text-slate-300"
                                            : "bg-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {activity.doneBy}
                                      </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-1">
                                        <MapPinIcon
                                          className={`w-3.5 h-3.5 ${
                                            isDarkMode
                                              ? "text-slate-500"
                                              : "text-slate-400"
                                          }`}
                                        />
                                        <span
                                          className={`text-sm ${
                                            isDarkMode
                                              ? "text-slate-300"
                                              : "text-slate-600"
                                          }`}
                                        >
                                          {activity.location}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <span
                                        className={`text-sm ${
                                          isDarkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {activity.timestamp}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Active Shipments",
            value: "48",
            change: "+5",
            icon: TruckIcon,
            color: "blue",
          },
          {
            label: "Delivered Today",
            value: "12",
            change: "+3",
            icon: CheckCircleIcon,
            color: "green",
          },
          {
            label: "Delayed",
            value: "3",
            change: "-2",
            icon: AlertIcon,
            color: "amber",
          },
          {
            label: "Avg Transit Time",
            value: "2.4d",
            change: "-15%",
            icon: ClockIcon,
            color: "purple",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`
                p-5 rounded-2xl
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border border-slate-800/50"
                    : "bg-white border border-slate-200/50 shadow-sm"
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <span
                  className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${
                      stat.change.startsWith("+")
                        ? isDarkMode
                          ? "bg-green-500/10 text-green-400"
                          : "bg-green-50 text-green-600"
                        : isDarkMode
                        ? "bg-red-500/10 text-red-400"
                        : "bg-red-50 text-red-600"
                    }
                  `}
                >
                  {stat.change}
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {stat.value}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveDashboard;
