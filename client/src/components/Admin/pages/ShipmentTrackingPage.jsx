import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import ShipmentTimeline from "../components/ShipmentTimeline";
import StatsCard from "../components/StatsCard";
import {
  SearchIcon,
  ShieldCheckIcon,
  BoxIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  WarehouseIcon,
  BlockchainIcon,
  EyeIcon,
  DocumentIcon,
  CheckCircleIcon,
  AlertIcon,
} from "../icons/Icons";
import { fetchShipments, fetchShipmentByHash, fetchContainers } from "../../../services/shipmentApi";

// Status mapping for display
const STATUS_LABELS = {
  created: "Created",
  ready_for_dispatch: "Ready for Dispatch",
  in_transit: "In Transit",
  at_warehouse: "At Warehouse",
  delivered: "Delivered",
};

const STATUS_COLORS = {
  created: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
  ready_for_dispatch: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  in_transit: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  at_warehouse: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  delivered: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
};

// Map status for timeline component
const mapStatusToTimeline = (status) => {
  const map = {
    created: "created",
    ready_for_dispatch: "created",
    in_transit: "in-transit",
    at_warehouse: "warehouse",
    delivered: "delivered",
  };
  return map[status] || "created";
};

const ShipmentTrackingPage = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "boxes", label: "Containers" },
    { id: "history", label: "History" },
    { id: "documents", label: "Documents" },
  ];

  // Fetch all shipments
  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const options = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== "all") {
        options.status = statusFilter;
      }
      const result = await fetchShipments(null, options);
      setShipments(result.shipments || []);
      if (result.pagination) {
        setPagination(prev => ({ ...prev, ...result.pagination }));
      }
    } catch (err) {
      console.error("Failed to load shipments:", err);
      setError("Failed to load shipments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // Live polling for containers when a shipment is selected
  useEffect(() => {
    if (!selectedShipment?.shipmentHash) return;
    
    const pollContainers = async () => {
      try {
        const containerResult = await fetchContainers(selectedShipment.shipmentHash);
        setContainers(containerResult.containers || []);
      } catch (err) {
        console.error("Failed to poll containers:", err);
      }
    };

    // Poll every 10 seconds for live updates
    const interval = setInterval(pollContainers, 10000);
    
    return () => clearInterval(interval);
  }, [selectedShipment?.shipmentHash]);

  // Search for a specific shipment
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSelectedShipment(null);
      return;
    }
    try {
      setSearchLoading(true);
      setError(null);
      const shipment = await fetchShipmentByHash(searchQuery.trim());
      if (shipment) {
        setSelectedShipment(shipment);
        const containerResult = await fetchContainers(shipment.shipmentHash);
        setContainers(containerResult.containers || []);
      } else {
        setError("Shipment not found. Please check the ID and try again.");
        setSelectedShipment(null);
      }
    } catch (err) {
      console.error("Failed to search shipment:", err);
      setError("Failed to search shipment. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a shipment from the list
  const handleSelectShipment = async (shipment) => {
    setSelectedShipment(shipment);
    setSearchQuery(shipment.shipmentHash);
    try {
      const containerResult = await fetchContainers(shipment.shipmentHash);
      setContainers(containerResult.containers || []);
    } catch (err) {
      console.error("Failed to fetch containers:", err);
      setContainers([]);
    }
  };

  // Calculate stats
  const stats = {
    total: shipments.length,
    created: shipments.filter(s => s.status === "created").length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    atWarehouse: shipments.filter(s => s.status === "at_warehouse").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    verified: shipments.filter(s => s.isLocked).length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash) => {
    if (!hash) return "---";
    if (hash.length <= 20) return hash;
    return hash.slice(0, 10) + "..." + hash.slice(-8);
  };

  const cardClass = isDarkMode
    ? "bg-slate-900/50 border border-slate-800/50"
    : "bg-white border border-slate-200/50 shadow-sm";

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-500" : "text-slate-400";
  const borderClass = isDarkMode ? "border-slate-800" : "border-slate-200";
  const inputBgClass = isDarkMode
    ? "bg-slate-800/80 border border-slate-600/50 focus-within:border-blue-500/50"
    : "bg-white border border-slate-200 focus-within:border-blue-400 shadow-sm";
  const inputTextClass = isDarkMode
    ? "text-white placeholder:text-slate-500"
    : "text-slate-900 placeholder:text-slate-400";
  const hoverBgClass = isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50";
  const cardInnerClass = isDarkMode ? "bg-slate-800/50" : "bg-slate-50";
  const buttonSecondaryClass = isDarkMode
    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200";

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
              Shipment Tracking
            </h1>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              Track and monitor all shipments across the network
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl w-full md:w-80 transition-all duration-200 ${inputBgClass}`}>
              <SearchIcon className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter shipment ID..."
                className={`bg-transparent outline-none w-full text-sm ${inputTextClass}`}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {searchLoading ? "..." : "Track"}
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {["all", "created", "in_transit", "at_warehouse", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-blue-500 text-white"
                  : buttonSecondaryClass
              }`}
            >
              {status === "all" ? "All" : STATUS_LABELS[status] || status}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Shipments"
          value={stats.total.toString()}
          subtitle={`${stats.verified} blockchain verified`}
          icon={BoxIcon}
          color="blue"
        />
        <StatsCard
          title="In Transit"
          value={stats.inTransit.toString()}
          subtitle="Currently moving"
          icon={TruckIcon}
          color="amber"
        />
        <StatsCard
          title="At Warehouse"
          value={stats.atWarehouse.toString()}
          subtitle="Storage facilities"
          icon={WarehouseIcon}
          color="purple"
        />
        <StatsCard
          title="Delivered"
          value={stats.delivered.toString()}
          subtitle="Successfully completed"
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Shipment List */}
          {!selectedShipment && (
            <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
              <div className={`p-4 border-b ${borderClass}`}>
                <h3 className={`font-semibold ${textPrimary}`}>
                  All Shipments ({pagination.total || shipments.length})
                </h3>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className={`mt-4 ${textSecondary}`}>Loading shipments...</p>
                </div>
              ) : shipments.length === 0 ? (
                <div className="p-8 text-center">
                  <BoxIcon className={`w-12 h-12 mx-auto ${textMuted}`} />
                  <p className={`mt-4 ${textSecondary}`}>No shipments found</p>
                </div>
              ) : (
                <div className={`divide-y ${isDarkMode ? "divide-slate-800/50" : "divide-slate-200"}`}>
                  {shipments.map((shipment) => {
                    const statusColors = STATUS_COLORS[shipment.status] || STATUS_COLORS.created;
                    return (
                      <div
                        key={shipment.id || shipment.shipmentHash}
                        onClick={() => handleSelectShipment(shipment)}
                        className={`p-4 cursor-pointer transition-all ${hoverBgClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${statusColors.bg} flex items-center justify-center`}>
                              <TruckIcon className={`w-5 h-5 ${statusColors.text}`} />
                            </div>
                            <div>
                              <p className={`font-medium ${textPrimary}`}>
                                {truncateHash(shipment.shipmentHash)}
                              </p>
                              <p className={`text-sm ${textMuted}`}>
                                Batch: {shipment.batchId} � {shipment.numberOfContainers} containers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {shipment.isLocked && (
                              <BlockchainIcon className="w-5 h-5 text-blue-400" title="Blockchain Verified" />
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                              {STATUS_LABELS[shipment.status] || shipment.status}
                            </span>
                            <span className={`text-xs ${textMuted}`}>
                              {formatDate(shipment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className={`p-4 border-t ${borderClass} flex items-center justify-between`}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${buttonSecondaryClass}`}
                  >
                    Previous
                  </button>
                  <span className={`text-sm ${textSecondary}`}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${buttonSecondaryClass}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected Shipment Details */}
          {selectedShipment && (
            <>
              <button
                onClick={() => {
                  setSelectedShipment(null);
                  setSearchQuery("");
                  setContainers([]);
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${textSecondary} hover:${textPrimary}`}
              >
                ? Back to all shipments
              </button>

              {/* Shipment Header Card */}
              <div className={`rounded-2xl p-6 ${cardClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <TruckIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold tracking-tight ${textPrimary}`}>
                        {truncateHash(selectedShipment.shipmentHash)}
                      </h2>
                      <p className={`text-sm mt-0.5 ${textSecondary}`}>
                        Batch: {selectedShipment.batchId}
                      </p>
                    </div>
                  </div>
                  {selectedShipment.isLocked && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      isDarkMode ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"
                    }`}>
                      <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                      <span className={`text-sm font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                        Blockchain Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Supplier", value: truncateHash(selectedShipment.supplierWallet), icon: MapPinIcon },
                    { label: "Transporter", value: selectedShipment.transporterName || truncateHash(selectedShipment.transporterWallet) || "Not assigned", icon: TruckIcon },
                    { label: "Warehouse", value: selectedShipment.warehouseName || truncateHash(selectedShipment.warehouseWallet) || "Not assigned", icon: WarehouseIcon },
                    { label: "Created", value: formatDate(selectedShipment.createdAt), icon: ClockIcon },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className={`p-4 rounded-xl ${cardInnerClass}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${textMuted}`} />
                          <span className={`text-xs ${textMuted}`}>{item.label}</span>
                        </div>
                        <p className={`text-sm font-medium ${textPrimary}`}>{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Blockchain Info */}
                {selectedShipment.txHash && (
                  <div className={`mt-4 p-4 rounded-xl flex items-center justify-between ${
                    isDarkMode ? "bg-slate-800/30 border border-slate-700/50" : "bg-slate-50 border border-slate-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      <BlockchainIcon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                      <div>
                        <p className={`text-xs ${textMuted}`}>Transaction Hash</p>
                        <p className={`text-sm font-mono ${textPrimary}`}>
                          {truncateHash(selectedShipment.txHash)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${selectedShipment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <EyeIcon className="w-4 h-4" />
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>

              {/* Tabs Section */}
              <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
                <div className={`flex border-b ${borderClass}`}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? isDarkMode ? "text-blue-400" : "text-blue-600"
                          : `${textSecondary} hover:${textPrimary}`
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div>
                        {/* Calculate scanned containers (status !== CREATED means scanned) */}
                        {(() => {
                          const scannedCount = containers.filter(c => c.status !== 'CREATED').length;
                          const totalCount = selectedShipment.numberOfContainers || 0;
                          const progressPercent = totalCount > 0 ? (scannedCount / totalCount) * 100 : 0;
                          
                          return (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className={`font-medium ${textPrimary}`}>Container Scan Progress</h4>
                                <span className={`text-sm font-medium ${
                                  scannedCount === totalCount && totalCount > 0
                                    ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                                    : textSecondary
                                }`}>
                                  {scannedCount} / {totalCount} scanned
                                </span>
                              </div>
                              <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progressPercent === 100 
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                      : progressPercent >= 50
                                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                        : progressPercent > 0
                                          ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                                          : "bg-slate-600"
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              {scannedCount === 0 && totalCount > 0 && (
                                <p className={`text-xs mt-2 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                                  ?? No containers have been scanned yet
                                </p>
                              )}
                              {scannedCount === totalCount && totalCount > 0 && (
                                <p className={`text-xs mt-2 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                  ? All containers scanned successfully
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatsCard
                          title="Total Containers"
                          value={(selectedShipment.numberOfContainers || 0).toString()}
                          subtitle={`${selectedShipment.quantityPerContainer || 0} units each`}
                          icon={BoxIcon}
                          color="blue"
                        />
                        <StatsCard
                          title="Total Quantity"
                          value={(selectedShipment.totalQuantity || 0).toString()}
                          subtitle="Units in shipment"
                          icon={CheckCircleIcon}
                          color="green"
                        />
                        <StatsCard
                          title="Status"
                          value={STATUS_LABELS[selectedShipment.status] || selectedShipment.status}
                          subtitle={selectedShipment.isLocked ? "On blockchain" : "Pending lock"}
                          icon={AlertIcon}
                          color="amber"
                        />
                      </div>
                    </div>
                  )}

                  {/* Containers Tab */}
                  {activeTab === "boxes" && (
                    <div className="space-y-3">
                      {containers.length === 0 ? (
                        <div className="text-center py-8">
                          <BoxIcon className={`w-12 h-12 mx-auto ${textMuted}`} />
                          <p className={`mt-4 ${textSecondary}`}>No containers found for this shipment</p>
                        </div>
                      ) : (
                        containers.map((container) => (
                          <div
                            key={container.id || container.containerId}
                            className={`flex items-center justify-between p-4 rounded-xl ${cardInnerClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
                              }`}>
                                <BoxIcon className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className={`font-medium ${textPrimary}`}>
                                  Container #{container.containerNumber}
                                </p>
                                <p className={`text-xs ${textMuted}`}>
                                  ID: {truncateHash(container.containerId)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${textSecondary}`}>
                                {container.quantity} units
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                container.status === "LOCKED"
                                  ? isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                                  : isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"
                              }`}>
                                {container.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* History Tab */}
                  {activeTab === "history" && (
                    <div className="space-y-4">
                      {[
                        {
                          type: "created",
                          title: "Shipment Created",
                          description: `Shipment initialized with ${selectedShipment.numberOfContainers} containers`,
                          time: formatDate(selectedShipment.createdAt),
                        },
                        ...(selectedShipment.isLocked ? [{
                          type: "blockchain",
                          title: "Locked on Blockchain",
                          description: `Transaction: ${truncateHash(selectedShipment.txHash)}`,
                          time: formatDate(selectedShipment.blockchainTimestamp),
                        }] : []),
                      ].map((event, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isDarkMode ? "bg-slate-800" : "bg-slate-100"
                          }`}>
                            {event.type === "blockchain" ? (
                              <BlockchainIcon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-500"}`} />
                            ) : (
                              <ClockIcon className={`w-5 h-5 ${textMuted}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${textPrimary}`}>{event.title}</p>
                            <p className={`text-sm ${textMuted}`}>{event.description}</p>
                          </div>
                          <span className={`text-xs ${textMuted}`}>{event.time}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === "documents" && (
                    <div className="space-y-4">
                      {selectedShipment.supportingDocuments?.length > 0 ? (
                        selectedShipment.supportingDocuments.map((doc, index) => (
                          <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${
                              isDarkMode ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100"
                            }`}
                          >
                            <DocumentIcon className={`w-8 h-8 ${isDarkMode ? "text-blue-400" : "text-blue-500"}`} />
                            <div>
                              <p className={`font-medium ${textPrimary}`}>
                                {doc.originalName || `Document ${index + 1}`}
                              </p>
                              <p className={`text-xs ${textMuted}`}>{formatDate(doc.uploadedAt)}</p>
                            </div>
                          </a>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <DocumentIcon className={`w-12 h-12 mx-auto ${textMuted}`} />
                          <p className={`mt-4 ${textSecondary}`}>No documents uploaded for this shipment</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Timeline or Quick Stats */}
        <div className="xl:col-span-1">
          {selectedShipment ? (
            <ShipmentTimeline
              currentStage={mapStatusToTimeline(selectedShipment.status)}
              events={[]}
              blockchainVerified={selectedShipment.isLocked}
            />
          ) : (
            <div className={`rounded-2xl p-6 ${cardClass}`}>
              <h3 className={`font-semibold mb-4 ${textPrimary}`}>Quick Stats</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${cardInnerClass}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>Blockchain Verified</span>
                    <span className={`font-bold ${textPrimary}`}>{stats.verified}</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${cardInnerClass}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>Pending</span>
                    <span className={`font-bold ${textPrimary}`}>{stats.created}</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${cardInnerClass}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>Active (In Transit + Warehouse)</span>
                    <span className={`font-bold ${textPrimary}`}>{stats.inTransit + stats.atWarehouse}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTrackingPage;
