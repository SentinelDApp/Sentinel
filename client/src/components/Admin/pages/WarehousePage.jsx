import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  WarehouseIcon,
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  RefreshIcon,
  MapPinIcon,
  ClockIcon,
  ChevronRightIcon,
} from "../icons/Icons";
import { fetchShipments, fetchContainers } from "../../../services/shipmentApi";

const WarehousePage = () => {
  const { isDarkMode } = useTheme();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("incoming"); // incoming, stored, outgoing
  const [expandedShipment, setExpandedShipment] = useState(null);
  const [containers, setContainers] = useState({});

  // Load warehouse shipments
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchShipments(null, { limit: 100 });
      const shipmentsData = result.shipments || [];
      setShipments(shipmentsData);

      // Fetch containers for warehouse shipments
      const warehouseShipments = shipmentsData.filter(s => 
        s.status === 'at_warehouse' || s.status === 'in_transit'
      );
      const containersMap = {};
      await Promise.all(
        warehouseShipments.slice(0, 10).map(async (s) => {
          try {
            const containerResult = await fetchContainers(s.shipmentHash);
            containersMap[s.shipmentHash] = containerResult.containers || [];
          } catch {
            containersMap[s.shipmentHash] = [];
          }
        })
      );
      setContainers(containersMap);
    } catch (err) {
      console.error("Failed to load warehouse data:", err);
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

  // Filter shipments by tab
  const getFilteredShipments = () => {
    switch (selectedTab) {
      case "incoming":
        return shipments.filter(s => s.status === 'in_transit');
      case "stored":
        return shipments.filter(s => s.status === 'at_warehouse');
      case "outgoing":
        return shipments.filter(s => s.status === 'delivered');
      default:
        return shipments;
    }
  };

  const filteredShipments = getFilteredShipments();

  // Stats
  const stats = {
    incoming: shipments.filter(s => s.status === 'in_transit').length,
    stored: shipments.filter(s => s.status === 'at_warehouse').length,
    outgoing: shipments.filter(s => s.status === 'delivered').length,
    totalContainers: Object.values(containers).flat().length,
  };

  const cardClass = isDarkMode
    ? "bg-slate-900/50 border border-slate-800/50"
    : "bg-white border border-slate-200/50 shadow-sm";

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";

  const tabs = [
    { id: "incoming", label: "Incoming", count: stats.incoming, color: "amber" },
    { id: "stored", label: "In Storage", count: stats.stored, color: "purple" },
    { id: "outgoing", label: "Dispatched", count: stats.outgoing, color: "green" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <WarehouseIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>
                Warehouse Management
              </h1>
              <p className={`mt-1 ${textSecondary}`}>
                Track incoming, stored, and outgoing shipments
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            isDarkMode
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
          }`}
        >
          <RefreshIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Incoming</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                {stats.incoming}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDarkMode ? "bg-amber-500/10" : "bg-amber-50"
            }`}>
              <TruckIcon className={`w-7 h-7 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`text-xs ${textSecondary}`}>Awaiting arrival</p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>In Storage</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                {stats.stored}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDarkMode ? "bg-purple-500/10" : "bg-purple-50"
            }`}>
              <WarehouseIcon className={`w-7 h-7 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`text-xs ${textSecondary}`}>Currently stored</p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Dispatched</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                {stats.outgoing}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDarkMode ? "bg-green-500/10" : "bg-green-50"
            }`}>
              <CheckCircleIcon className={`w-7 h-7 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`text-xs ${textSecondary}`}>Successfully delivered</p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Containers</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                {stats.totalContainers}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
            }`}>
              <BoxIcon className={`w-7 h-7 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`text-xs ${textSecondary}`}>Tracked containers</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl ${cardClass}`}>
        <div className={`flex border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
          {tabs.map((tab) => {
            const colorClasses = {
              amber: selectedTab === tab.id 
                ? (isDarkMode ? "text-amber-400 border-amber-400" : "text-amber-600 border-amber-600")
                : "",
              purple: selectedTab === tab.id 
                ? (isDarkMode ? "text-purple-400 border-purple-400" : "text-purple-600 border-purple-600")
                : "",
              green: selectedTab === tab.id 
                ? (isDarkMode ? "text-green-400 border-green-400" : "text-green-600 border-green-600")
                : "",
            };
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  selectedTab === tab.id
                    ? colorClasses[tab.color]
                    : `border-transparent ${textSecondary} hover:${textPrimary}`
                }`}
              >
                <span>{tab.label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedTab === tab.id
                    ? isDarkMode ? "bg-slate-800" : "bg-slate-100"
                    : isDarkMode ? "bg-slate-800/50" : "bg-slate-100"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shipments List */}
        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className={`mt-4 ${textSecondary}`}>Loading warehouse data...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="py-12 text-center">
              <WarehouseIcon className={`w-16 h-16 mx-auto ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
              <p className={`mt-4 text-lg font-medium ${textPrimary}`}>No shipments in this category</p>
              <p className={`mt-2 ${textSecondary}`}>
                {selectedTab === "incoming" && "No shipments are currently in transit to warehouse"}
                {selectedTab === "stored" && "No shipments are currently stored in warehouse"}
                {selectedTab === "outgoing" && "No shipments have been dispatched yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((shipment) => {
                const shipmentContainers = containers[shipment.shipmentHash] || [];
                const isExpanded = expandedShipment === shipment.shipmentHash;
                
                return (
                  <div key={shipment.shipmentHash} className={`rounded-xl overflow-hidden ${
                    isDarkMode ? "bg-slate-800/50" : "bg-slate-50"
                  }`}>
                    <div
                      onClick={() => setExpandedShipment(isExpanded ? null : shipment.shipmentHash)}
                      className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
                        isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedTab === "incoming" 
                            ? (isDarkMode ? "bg-amber-500/10" : "bg-amber-50")
                            : selectedTab === "stored"
                              ? (isDarkMode ? "bg-purple-500/10" : "bg-purple-50")
                              : (isDarkMode ? "bg-green-500/10" : "bg-green-50")
                        }`}>
                          <BoxIcon className={`w-6 h-6 ${
                            selectedTab === "incoming" 
                              ? (isDarkMode ? "text-amber-400" : "text-amber-600")
                              : selectedTab === "stored"
                                ? (isDarkMode ? "text-purple-400" : "text-purple-600")
                                : (isDarkMode ? "text-green-400" : "text-green-600")
                          }`} />
                        </div>
                        <div>
                          <p className={`font-semibold ${textPrimary}`}>
                            {shipment.shipmentHash?.slice(0, 10)}...{shipment.shipmentHash?.slice(-8)}
                          </p>
                          <p className={`text-sm ${textSecondary}`}>
                            Batch: {shipment.batchId} • {shipment.numberOfContainers} containers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${textPrimary}`}>{shipment.totalQuantity?.toLocaleString()} units</p>
                          <p className={`text-xs ${textSecondary}`}>
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRightIcon className={`w-5 h-5 transition-transform ${textSecondary} ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={`px-4 pb-4 border-t ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}`}>
                        <div className="pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className={`w-4 h-4 ${textSecondary}`} />
                            <span className={`text-sm ${textSecondary}`}>Warehouse:</span>
                            <span className={`text-sm font-medium ${textPrimary}`}>
                              {shipment.warehouseName || 'Not assigned'}
                            </span>
                          </div>
                          
                          {/* Container Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                            {shipmentContainers.length > 0 ? shipmentContainers.map((container, idx) => {
                              const statusColors = {
                                'CREATED': isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600',
                                'SCANNED': isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
                                'IN_TRANSIT': isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600',
                                'AT_WAREHOUSE': isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
                                'DELIVERED': isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
                              };
                              return (
                                <div key={idx} className={`px-3 py-2 rounded-lg text-xs font-medium ${
                                  statusColors[container.status] || statusColors['CREATED']
                                }`}>
                                  Container #{idx + 1}: {container.status}
                                </div>
                              );
                            }) : (
                              <p className={`col-span-full text-sm ${textSecondary}`}>No container details available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehousePage;
