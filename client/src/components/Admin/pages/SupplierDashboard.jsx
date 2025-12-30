import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import StatsCard from "../components/StatsCard";
import {
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  AlertIcon,
  RefreshIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  LocationIcon,
} from "../icons/Icons";

// Pie Chart Component
const PieChart = ({ data, size = 160 }) => {
  const { isDarkMode } = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="-1 -1 2 2"
        style={{ transform: "rotate(-90deg)" }}
      >
        {data.map((slice, index) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          const slicePercent = slice.value / total;
          cumulativePercent += slicePercent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(" ");
          return (
            <path
              key={index}
              d={pathData}
              fill={slice.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
        {/* Inner circle for donut effect */}
        <circle
          cx="0"
          cy="0"
          r="0.6"
          fill={isDarkMode ? "#0f172a" : "#ffffff"}
        />
      </svg>
      {/* Center text */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          {Math.round((data[0].value / total) * 100)}%
        </span>
        <span
          className={`text-xs ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Scanned
        </span>
      </div>
    </div>
  );
};

// Sample role access requests data
const roleAccessRequests = [
  {
    id: "REQ-001",
    hashKey: "0x7a9f3b2c1d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
    role: "Supplier",
    timestamp: "2025-12-27 10:30:45",
    status: "pending",
  },
];

// Sample data
const statsData = [
  {
    title: "Total Products",
    value: "12,847",
    subtitle: "+234 this week",
    icon: BoxIcon,
    color: "blue",
    trend: "up",
    trendValue: "12%",
  },
  {
    title: "Active Shipments",
    value: "48",
    subtitle: "23 in transit",
    icon: TruckIcon,
    color: "amber",
    trend: "up",
    trendValue: "8%",
  },
  {
    title: "Delivered",
    value: "1,234",
    subtitle: "This month",
    icon: CheckCircleIcon,
    color: "green",
    trend: "up",
    trendValue: "23%",
  },
  {
    title: "Alerts",
    value: "3",
    subtitle: "Requires attention",
    icon: AlertIcon,
    color: "red",
    trend: "down",
    trendValue: "5%",
  },
];

const activeShipments = [
  {
    id: "SHP-001234",
    destination: "New York, USA",
    status: "in-transit",
    boxes: 120,
    scanned: 95,
    lastUpdate: "2 hours ago",
  },
  {
    id: "SHP-001235",
    destination: "Los Angeles, USA",
    status: "warehouse",
    boxes: 80,
    scanned: 80,
    lastUpdate: "5 hours ago",
  },
  {
    id: "SHP-001236",
    destination: "Chicago, USA",
    status: "created",
    boxes: 200,
    scanned: 0,
    lastUpdate: "Just now",
  },
  {
    id: "SHP-001237",
    destination: "Miami, USA",
    status: "delayed",
    boxes: 150,
    scanned: 120,
    lastUpdate: "1 day ago",
  },
  {
    id: "SHP-001238",
    destination: "Seattle, USA",
    status: "delivered",
    boxes: 100,
    scanned: 100,
    lastUpdate: "3 days ago",
  },
];

const recentShipments = activeShipments.slice(0, 3);

const SupplierDashboard = () => {
  const { isDarkMode } = useTheme();
  const [requestFilter, setRequestFilter] = useState("all");

  const handleViewShipment = (id) => {
    console.log("Viewing shipment:", id);
    // Handle navigation to shipment details
  };

  const handleViewDocuments = (id) => {
    console.log("Viewing documents for request:", id);
    // Handle document viewing
  };

  const filteredRequests = roleAccessRequests.filter((request) => {
    if (requestFilter === "all") return true;
    return request.status === requestFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: isDarkMode
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-amber-50 text-amber-600 border-amber-200",
      approved: isDarkMode
        ? "bg-green-500/10 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-600 border-green-200",
      rejected: isDarkMode
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-600 border-red-200",
    };
    return styles[status] || styles.pending;
  };

  const getRoleBadge = (role) => {
    const colors = {
      Supplier: isDarkMode
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-50 text-blue-600",
      Transporter: isDarkMode
        ? "bg-purple-500/10 text-purple-400"
        : "bg-purple-50 text-purple-600",
      Warehouse: isDarkMode
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
      Retailer: isDarkMode
        ? "bg-green-500/10 text-green-400"
        : "bg-green-50 text-green-600",
    };
    return colors[role] || colors.Supplier;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl lg:text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Dashboard
          </h1>
          <p
            className={`mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Welcome back! Here's your shipment overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors
              ${
                isDarkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              }
            `}
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Role Access Requests Table */}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-purple-500 to-pink-500
              `}
            >
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Role Access Requests
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Manage stakeholder access requests
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setRequestFilter(filter.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    requestFilter === filter.key
                      ? filter.key === "pending"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                        : filter.key === "approved"
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                        : filter.key === "rejected"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                      : isDarkMode
                      ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {filter.label}
                {filter.key !== "all" && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      requestFilter === filter.key
                        ? "bg-white/20"
                        : isDarkMode
                        ? "bg-slate-700"
                        : "bg-slate-200"
                    }`}
                  >
                    {
                      roleAccessRequests.filter((r) => r.status === filter.key)
                        .length
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`
                  text-left text-xs font-medium uppercase tracking-wider
                  ${isDarkMode ? "text-slate-400" : "text-slate-500"}
                `}
              >
                <th className="pb-4 pr-4">Request ID</th>
                <th className="pb-4 pr-4">Hash Key</th>
                <th className="pb-4 pr-4">Role Requested</th>
                <th className="pb-4 pr-4">Timestamp</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={`
                      transition-colors
                      ${
                        isDarkMode
                          ? "hover:bg-slate-800/50"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    <td className="py-4 pr-4">
                      <span
                        className={`font-mono text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {request.id}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            font-mono text-xs px-2 py-1 rounded-lg truncate max-w-[180px]
                            ${
                              isDarkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }
                          `}
                          title={request.hashKey}
                        >
                          {request.hashKey.slice(0, 10)}...
                          {request.hashKey.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${getRoleBadge(request.role)}
                        `}
                      >
                        {request.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
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
                          {request.timestamp}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium border capitalize
                          ${getStatusBadge(request.status)}
                        `}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleViewDocuments(request.id)}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            isDarkMode
                              ? "bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-blue-300"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }
                        `}
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center">
                    <p
                      className={`${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No requests found for the selected filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Stats & Progress */}
        <div className="xl:col-span-1 space-y-6">
          {/* Scan Progress - Pie Chart */}
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
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Scan Progress
              </h3>
              <span
                className={`
                  text-xs font-medium px-2 py-1 rounded-full
                  ${
                    isDarkMode
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                  }
                `}
              >
                Today
              </span>
            </div>

            {/* Pie Chart */}
            <div className="relative flex justify-center mb-6">
              <PieChart
                data={[
                  { label: "Scanned", value: 8547, color: "#3b82f6" },
                  {
                    label: "Not Scanned",
                    value: 4300,
                    color: isDarkMode ? "#334155" : "#e2e8f0",
                  },
                ]}
                size={160}
              />
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {[
                {
                  label: "Total Scanned",
                  value: "8,547",
                  total: "12,847",
                  color: "bg-blue-500",
                  percent: "66.5%",
                },
                {
                  label: "Verified",
                  value: "8,234",
                  total: "8,547",
                  color: "bg-green-500",
                  percent: "96.3%",
                },
                {
                  label: "Pending",
                  value: "313",
                  total: "8,547",
                  color: "bg-amber-500",
                  percent: "3.7%",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.value}
                    </span>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      ({item.percent})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Shipments */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Shipments - Clean List */}
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
            <div className="flex items-center justify-between mb-5">
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Recent Shipments
              </h3>
              <button
                className={`
                  text-sm font-medium transition-colors
                  ${
                    isDarkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-500"
                  }
                `}
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {recentShipments.map((shipment) => {
                const statusConfig = {
                  "in-transit": {
                    color: "bg-blue-500",
                    text: "In Transit",
                    textColor: "text-blue-400",
                  },
                  warehouse: {
                    color: "bg-amber-500",
                    text: "At Warehouse",
                    textColor: "text-amber-400",
                  },
                  created: {
                    color: "bg-slate-500",
                    text: "Created",
                    textColor: "text-slate-400",
                  },
                  delayed: {
                    color: "bg-red-500",
                    text: "Delayed",
                    textColor: "text-red-400",
                  },
                  delivered: {
                    color: "bg-green-500",
                    text: "Delivered",
                    textColor: "text-green-400",
                  },
                };
                const status =
                  statusConfig[shipment.status] || statusConfig["created"];

                return (
                  <div
                    key={shipment.id}
                    onClick={() => handleViewShipment(shipment.id)}
                    className={`
                      flex items-center justify-between p-4 rounded-xl cursor-pointer
                      transition-all duration-200
                      ${
                        isDarkMode
                          ? "bg-slate-800/50 hover:bg-slate-800"
                          : "bg-slate-50 hover:bg-slate-100"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-2 h-10 rounded-full ${status.color}`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isDarkMode ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {shipment.id}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDarkMode
                                ? "bg-slate-700 " + status.textColor
                                : "bg-white " + status.textColor
                            }`}
                          >
                            {status.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <LocationIcon
                            className={`w-3.5 h-3.5 ${
                              isDarkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {shipment.destination}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <BoxIcon
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {shipment.scanned}/{shipment.boxes}
                        </span>
                      </div>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {shipment.lastUpdate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
