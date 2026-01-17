import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import StatsCard from "../components/StatsCard";
import {
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  RefreshIcon,
  LocationIcon,
  WarehouseIcon,
} from "../icons/Icons";
import { fetchShipments, fetchContainers } from "../../../services/shipmentApi";

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

// Stats data - empty/zero values (will be populated from API)
const defaultStatsData = [
  {
    title: "Total Shipments",
    value: "0",
    subtitle: "No data yet",
    icon: BoxIcon,
    color: "blue",
  },
  {
    title: "In Transit",
    value: "0",
    subtitle: "Currently moving",
    icon: TruckIcon,
    color: "amber",
  },
  {
    title: "At Warehouse",
    value: "0",
    subtitle: "In storage",
    icon: WarehouseIcon,
    color: "purple",
  },
  {
    title: "Delivered",
    value: "0",
    subtitle: "Completed",
    icon: CheckCircleIcon,
    color: "green",
  },
];

const SupplierDashboard = () => {
  const { isDarkMode } = useTheme();
  const [shipments, setShipments] = useState([]);
  const [allContainers, setAllContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate stats from real data
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    atWarehouse: shipments.filter(s => s.status === "at_warehouse").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    created: shipments.filter(s => s.status === "created" || s.status === "ready_for_dispatch").length,
  };

  // Calculate scan progress from containers
  const scanProgress = {
    total: allContainers.length,
    scanned: allContainers.filter(c => c.status !== 'CREATED').length,
    verified: allContainers.filter(c => c.status === 'DELIVERED').length,
    pending: allContainers.filter(c => c.status === 'CREATED').length,
  };

  const statsData = [
    {
      title: "Total Shipments",
      value: stats.total.toString(),
      subtitle: `${stats.created} pending dispatch`,
      icon: BoxIcon,
      color: "blue",
    },
    {
      title: "In Transit",
      value: stats.inTransit.toString(),
      subtitle: "Currently moving",
      icon: TruckIcon,
      color: "amber",
    },
    {
      title: "At Warehouse",
      value: stats.atWarehouse.toString(),
      subtitle: "In storage",
      icon: WarehouseIcon,
      color: "purple",
    },
    {
      title: "Delivered",
      value: stats.delivered.toString(),
      subtitle: "Completed",
      icon: CheckCircleIcon,
      color: "green",
    },
  ];

  // Fetch shipments and containers
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchShipments(null, { limit: 100 });
      const shipmentsData = result.shipments || [];
      setShipments(shipmentsData);

      // Fetch containers for all shipments
      const containersPromises = shipmentsData.map(s => 
        fetchContainers(s.shipmentHash).catch(() => ({ containers: [] }))
      );
      const containersResults = await Promise.all(containersPromises);
      const allContainersData = containersResults.flatMap(r => r.containers || []);
      setAllContainers(allContainersData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Get recent shipments (last 5)
  const recentShipments = shipments.slice(0, 5).map(s => ({
    id: s.shipmentHash?.slice(0, 8) + '...' + s.shipmentHash?.slice(-6),
    fullId: s.shipmentHash,
    status: s.status,
    destination: s.warehouseName || 'Warehouse',
    boxes: s.numberOfContainers || 0,
    scanned: allContainers.filter(c => c.shipmentHash === s.shipmentHash && c.status !== 'CREATED').length,
    lastUpdate: new Date(s.createdAt).toLocaleDateString(),
  }));

  const handleViewShipment = (id) => {
    console.log("Viewing shipment:", id);
    // Handle navigation to shipment details
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors
              ${
                isDarkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              }
              ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <RefreshIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
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
                  { label: "Scanned", value: scanProgress.scanned || 0, color: "#3b82f6" },
                  {
                    label: "Not Scanned",
                    value: scanProgress.pending || 1,
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
                  value: scanProgress.scanned.toString(),
                  total: scanProgress.total.toString(),
                  color: "bg-blue-500",
                  percent: scanProgress.total > 0 ? Math.round((scanProgress.scanned / scanProgress.total) * 100) + "%" : "0%",
                },
                {
                  label: "Delivered",
                  value: scanProgress.verified.toString(),
                  total: scanProgress.total.toString(),
                  color: "bg-green-500",
                  percent: scanProgress.total > 0 ? Math.round((scanProgress.verified / scanProgress.total) * 100) + "%" : "0%",
                },
                {
                  label: "Pending",
                  value: scanProgress.pending.toString(),
                  total: scanProgress.total.toString(),
                  color: "bg-amber-500",
                  percent: scanProgress.total > 0 ? Math.round((scanProgress.pending / scanProgress.total) * 100) + "%" : "0%",
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
              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className={`mt-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Loading shipments...</p>
                </div>
              ) : recentShipments.length === 0 ? (
                <div className="py-8 text-center">
                  <BoxIcon className={`w-12 h-12 mx-auto ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
                  <p className={`mt-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>No shipments yet</p>
                </div>
              ) : recentShipments.map((shipment) => {
                const statusConfig = {
                  "in_transit": {
                    color: "bg-blue-500",
                    text: "In Transit",
                    textColor: "text-blue-400",
                  },
                  "at_warehouse": {
                    color: "bg-purple-500",
                    text: "At Warehouse",
                    textColor: "text-purple-400",
                  },
                  "ready_for_dispatch": {
                    color: "bg-amber-500",
                    text: "Ready for Dispatch",
                    textColor: "text-amber-400",
                  },
                  "created": {
                    color: "bg-slate-500",
                    text: "Created",
                    textColor: "text-slate-400",
                  },
                  "delivered": {
                    color: "bg-green-500",
                    text: "Delivered",
                    textColor: "text-green-400",
                  },
                };
                const status =
                  statusConfig[shipment.status] || statusConfig["created"];

                return (
                  <div
                    key={shipment.fullId}
                    onClick={() => handleViewShipment(shipment.fullId)}
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
