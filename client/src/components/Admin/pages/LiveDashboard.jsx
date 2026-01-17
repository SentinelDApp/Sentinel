import { useState, useEffect, useCallback } from "react";
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
  WarehouseIcon,
} from "../icons/Icons";
import { fetchShipments, fetchContainers } from "../../../services/shipmentApi";

// Status mapping for display
const STATUS_LABELS = {
  created: "Created",
  ready_for_dispatch: "Ready for Dispatch",
  in_transit: "In Transit",
  at_warehouse: "At Warehouse",
  delivered: "Delivered",
};

const LiveDashboard = () => {
  const { isDarkMode } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [containers, setContainers] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch shipments
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchShipments(null, { limit: 50 });
      const shipmentsData = result.shipments || [];
      setShipments(shipmentsData);
      
      // Fetch containers for each shipment
      const containersMap = {};
      await Promise.all(
        shipmentsData.slice(0, 10).map(async (s) => {
          try {
            const containerResult = await fetchContainers(s.shipmentHash);
            containersMap[s.shipmentHash] = containerResult.containers || [];
          } catch (err) {
            containersMap[s.shipmentHash] = [];
          }
        })
      );
      setContainers(containersMap);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleTrack = (shipment) => {
    setSelectedShipment(selectedShipment?.shipmentHash === shipment.shipmentHash ? null : shipment);
  };

  // Calculate stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    atWarehouse: shipments.filter(s => s.status === "at_warehouse").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  // Transform shipment data for table
  const shipmentsData = shipments.map(s => {
    const shipmentContainers = containers[s.shipmentHash] || [];
    const scannedCount = shipmentContainers.filter(c => c.status !== 'CREATED').length;
    const totalCount = s.numberOfContainers || 0;
    const progress = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;
    
    return {
      id: s.shipmentHash,
      displayId: (s.shipmentHash?.slice(0, 8) || '') + '...' + (s.shipmentHash?.slice(-6) || ''),
      productId: s.batchId || 'N/A',
      status: s.status,
      progress,
      lastUpdatedBy: s.supplierWallet || 'Unknown',
      location: s.warehouseName || 'In Transit',
      lastUpdateAt: new Date(s.createdAt).toLocaleDateString(),
      containers: shipmentContainers,
    };
  });

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
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className={`mt-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Loading shipments...</p>
                  </td>
                </tr>
              ) : shipmentsData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <BoxIcon className={`w-12 h-12 mx-auto ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
                    <p className={`mt-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>No shipments found</p>
                  </td>
                </tr>
              ) : shipmentsData.map((shipment) => (
                <>
                  <tr
                    key={shipment.id}
                    className={`transition-colors ${
                      isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                    } ${
                      selectedShipment?.shipmentHash === shipment.id
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
                        {shipment.displayId}
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
                        {shipment.lastUpdatedBy?.slice(0, 10) || 'N/A'}...
                        {shipment.lastUpdatedBy?.slice(-6) || ''}
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
                            selectedShipment?.shipmentHash === shipment.id
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                              : isDarkMode
                              ? "bg-slate-800 text-blue-400 hover:bg-slate-700"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }
                        `}
                      >
                        <EyeIcon className="w-4 h-4" />
                        {selectedShipment?.shipmentHash === shipment.id
                          ? "Hide"
                          : "Track"}
                      </button>
                    </td>
                  </tr>

                  {/* Container Details - Shown when Track is clicked */}
                  {selectedShipment?.shipmentHash === shipment.id && (
                    <tr key={`${shipment.id}-details`}>
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
                              Containers for {shipment.displayId}
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
                                  <th className="pb-3 pr-4">Container ID</th>
                                  <th className="pb-3 pr-4">Status</th>
                                  <th className="pb-3 pr-4">Quantity</th>
                                  <th className="pb-3">Last Scan</th>
                                </tr>
                              </thead>
                              <tbody
                                className={`divide-y ${
                                  isDarkMode
                                    ? "divide-slate-700/50"
                                    : "divide-slate-200"
                                }`}
                              >
                                {shipment.containers.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" className="py-4 text-center">
                                      <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
                                        No containers found
                                      </span>
                                    </td>
                                  </tr>
                                ) : shipment.containers.map((container, idx) => {
                                  const statusColors = {
                                    'CREATED': 'bg-slate-500',
                                    'SCANNED': 'bg-blue-500',
                                    'IN_TRANSIT': 'bg-amber-500',
                                    'AT_WAREHOUSE': 'bg-purple-500',
                                    'DELIVERED': 'bg-green-500',
                                  };
                                  return (
                                  <tr key={idx} className="transition-colors">
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${statusColors[container.status] || 'bg-slate-500'}`}
                                        />
                                        <span
                                          className={`text-sm font-mono ${
                                            isDarkMode
                                              ? "text-slate-200"
                                              : "text-slate-700"
                                          }`}
                                        >
                                          {container.containerId?.slice(-12) || `Container ${idx + 1}`}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <span
                                        className={`text-xs px-2 py-1 rounded ${
                                          isDarkMode
                                            ? "bg-slate-700 text-slate-300"
                                            : "bg-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {container.status || 'CREATED'}
                                      </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <span
                                        className={`text-sm ${
                                          isDarkMode
                                            ? "text-slate-300"
                                            : "text-slate-600"
                                        }`}
                                      >
                                        {container.quantity || 0} units
                                      </span>
                                    </td>
                                    <td className="py-3">
                                      <span
                                        className={`text-sm ${
                                          isDarkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {container.lastScanAt ? new Date(container.lastScanAt).toLocaleString() : 'Not scanned'}
                                      </span>
                                    </td>
                                  </tr>
                                )})}
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
            label: "Total Shipments",
            value: stats.total.toString(),
            icon: BoxIcon,
            color: "blue",
          },
          {
            label: "In Transit",
            value: stats.inTransit.toString(),
            icon: TruckIcon,
            color: "amber",
          },
          {
            label: "At Warehouse",
            value: stats.atWarehouse.toString(),
            icon: WarehouseIcon,
            color: "purple",
          },
          {
            label: "Delivered",
            value: stats.delivered.toString(),
            icon: CheckCircleIcon,
            color: "green",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: isDarkMode ? "text-blue-400" : "text-blue-500",
            amber: isDarkMode ? "text-amber-400" : "text-amber-500",
            purple: isDarkMode ? "text-purple-400" : "text-purple-500",
            green: isDarkMode ? "text-green-400" : "text-green-500",
          };
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
                  className={`w-5 h-5 ${colorClasses[stat.color]}`}
                />
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
