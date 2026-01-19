/**
 * WarehouseApp - Main Warehouse Dashboard Application
 *
 * SYSTEM PRINCIPLE:
 * Warehouse receives shipments from Transporter, scans all containers via QR,
 * and once all containers are verified, can assign next transporter + retailer
 * for the next leg of delivery.
 *
 * STATE FLOW:
 * READY_FOR_DISPATCH → IN_TRANSIT → AT_WAREHOUSE → READY_FOR_DISPATCH (next leg)
 *
 * WAREHOUSE RESPONSIBILITIES:
 * - Scan containers when shipment.status === "IN_TRANSIT"
 * - Each container can only be scanned once by warehouse
 * - When all containers scanned → status becomes AT_WAREHOUSE (backend updates)
 * - Only after AT_WAREHOUSE → can assign next transporter & retailer
 * - Only after assignment → can mark READY_FOR_DISPATCH
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  WarehouseThemeProvider,
  useWarehouseTheme,
} from "./context/ThemeContext";
import Header from "./layout/Header";
import WarehouseStatsGrid from "./components/WarehouseStatsGrid";
import WarehouseShipmentsTable from "./components/WarehouseShipmentsTable";
import WarehouseScanPage from "./pages/WarehouseScanPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "../../context/AuthContext";
import { 
  fetchWarehouseShipments, 
  fetchRetailers,
  fetchTransporters,
  assignNextTransporter,
  assignRetailer,
  markReadyForDispatchNextLeg
} from "../../services/shipmentApi";

import {
  SHIPMENT_STATUSES,
  canWarehouseScan,
  canAssignNextLeg,
  canMarkReadyForDispatch,
  getStatusDisplayName,
  getStatusVariant,
} from "./constants";

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

const LeftSidebar = ({ activeTab, setActiveTab, pendingCount, isDarkMode }) => {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "active",
      label: "Active",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: "manage",
      label: "Manage",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: "history",
      label: "History",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900/70 border-slate-700/50" : "bg-white/80 border-slate-200"
      }`}>
        {/* Logo/Brand */}
        <div className={`p-5 border-b ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDarkMode
                ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20"
                : "bg-gradient-to-br from-purple-100 to-cyan-100"
            }`}>
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Sentinel
              </h1>
              <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                Warehouse Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-900"
                  : isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-auto min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Status */}
        <div className={`p-3 border-t ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}`}>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              System connected
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${
        isDarkMode ? "bg-slate-900/95 border-slate-700/50" : "bg-white/95 border-slate-200"
      }`}>
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? isDarkMode ? "text-purple-400" : "text-purple-600"
                  : isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.badge && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIPMENT DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const ShipmentDetailPanel = ({ 
  shipment, 
  containerStats,
  transporters,
  retailers,
  onClose, 
  onScan,
  onAssignBoth,
  onMarkReadyForDispatch,
  isProcessing,
  isDarkMode 
}) => {
  const [selectedTransporter, setSelectedTransporter] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState("");

  if (!shipment) return null;

  const backendStatus = shipment.rawStatus || shipment.status;
  const canScan = canWarehouseScan(backendStatus);
  const canAssign = canAssignNextLeg(backendStatus);
  
  // Check if both are already assigned - check for walletAddress specifically
  const hasNextTransporter = !!(shipment.nextTransporter?.walletAddress);
  const hasRetailer = !!(shipment.assignedRetailer?.walletAddress);
  const bothAssigned = hasNextTransporter && hasRetailer;
  const canDispatch = canAssign && bothAssigned;

  const handleAssignBoth = () => {
    if (selectedTransporter && selectedRetailer) {
      onAssignBoth(shipment.shipmentHash, selectedTransporter, selectedRetailer);
      setSelectedTransporter("");
      setSelectedRetailer("");
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"
    }`}>
      {/* Header */}
      <div className="h-1.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500" />
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {shipment.batchId || shipment.shipmentHash?.slice(0, 16) + "..."}
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {shipment.productName || "Shipment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            getStatusVariant(backendStatus) === 'blue'
              ? isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'
              : getStatusVariant(backendStatus) === 'purple'
                ? isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200'
                : getStatusVariant(backendStatus) === 'emerald'
                  ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : isDarkMode ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {getStatusDisplayName(backendStatus)}
          </span>
          
          {containerStats && (
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              containerStats.pending === 0
                ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              {containerStats.scanned}/{containerStats.total} Scanned
            </span>
          )}
        </div>

        {/* Shipment Info */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Containers</p>
            <p className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {shipment.numberOfContainers || 0}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Quantity</p>
            <p className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {shipment.totalQuantity || shipment.quantity || "N/A"}
            </p>
          </div>
        </div>

        {/* Actions based on status */}
        <div className="space-y-4">
          {/* Scan Action - Only when IN_TRANSIT */}
          {canScan && (
            <button
              onClick={() => onScan(shipment)}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan Containers
              </span>
            </button>
          )}

          {/* Assignment Section - Only when AT_WAREHOUSE and not both assigned yet */}
          {canAssign && !bothAssigned && (
            <div className="space-y-3">
              <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Assign Next Leg
              </p>

              {/* Transporter Selection */}
              <div>
                <label className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Next Transporter
                </label>
                <select
                  value={selectedTransporter}
                  onChange={(e) => setSelectedTransporter(e.target.value)}
                  disabled={isProcessing}
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-sm ${
                    isDarkMode
                      ? "bg-slate-800 border border-slate-700 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-900"
                  } disabled:opacity-50`}
                >
                  <option value="">Select transporter...</option>
                  {transporters.map((t) => (
                    <option key={t.walletAddress} value={t.walletAddress}>
                      {t.organizationName || t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Retailer Selection */}
              <div>
                <label className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Destination Retailer
                </label>
                <select
                  value={selectedRetailer}
                  onChange={(e) => setSelectedRetailer(e.target.value)}
                  disabled={isProcessing}
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-sm ${
                    isDarkMode
                      ? "bg-slate-800 border border-slate-700 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-900"
                  } disabled:opacity-50`}
                >
                  <option value="">Select retailer...</option>
                  {retailers.map((r) => (
                    <option key={r.walletAddress} value={r.walletAddress}>
                      {r.organizationName || r.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Single Assign Button */}
              <button
                onClick={handleAssignBoth}
                disabled={!selectedTransporter || !selectedRetailer || isProcessing}
                className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  selectedTransporter && selectedRetailer
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/25"
                    : isDarkMode
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Assigning...
                  </span>
                ) : (
                  "Assign Transporter & Retailer"
                )}
              </button>
            </div>
          )}

          {/* Show assigned info when both are assigned */}
          {canAssign && bothAssigned && (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl ${isDarkMode ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}>
                <p className={`text-sm font-medium mb-2 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                  ✓ Next Leg Assigned
                </p>
                <div className="space-y-1">
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    <span className="font-medium">Transporter:</span> {shipment.nextTransporter?.name || shipment.nextTransporter?.organizationName || "Assigned"}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    <span className="font-medium">Retailer:</span> {shipment.assignedRetailer?.name || shipment.assignedRetailer?.organizationName || "Assigned"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ready for Dispatch Button - Only show when both are assigned */}
          {canDispatch && (
            <button
              onClick={() => onMarkReadyForDispatch(shipment.shipmentHash)}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Ready for Dispatch
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WAREHOUSE DASHBOARD CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const WarehouseDashboardContent = ({ page }) => {
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();
  
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showScanMode, setShowScanMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [containerStats, setContainerStats] = useState({});
  const [transporters, setTransporters] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadShipments = useCallback(async () => {
    if (!user?.walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWarehouseShipments(user.walletAddress);
      const warehouseShipments = result.shipments.map((shipment) => ({
        ...shipment,
        id: shipment.shipmentHash,
        rawStatus: shipment.status,
      }));
      setShipments(warehouseShipments);
    } catch (err) {
      console.error("Failed to fetch warehouse shipments:", err);
      setError("Failed to load shipments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.walletAddress]);

  const loadTransportersAndRetailers = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("sentinel_token");
      
      const [transporterData, retailerData] = await Promise.all([
        fetchTransporters(authToken),
        fetchRetailers(authToken)
      ]);
      
      // Both functions return the data array directly (result.data)
      setTransporters(transporterData || []);
      setRetailers(retailerData || []);
    } catch (err) {
      console.error("Failed to load transporters/retailers:", err);
    }
  }, []);

  const loadContainerStats = useCallback(async () => {
    try {
      const response = await getWarehouseAssignedContainers();
      if (response.success && response.data?.shipments) {
        const statsMap = {};
        response.data.shipments.forEach(s => {
          statsMap[s.shipmentHash] = {
            total: s.totalContainers,
            scanned: s.scannedCount,
            pending: s.pendingScans
          };
        });
        setContainerStats(statsMap);
      }
    } catch (err) {
      console.error("Failed to load container stats:", err);
    }
  }, []);

  useEffect(() => {
    loadShipments();
    loadTransportersAndRetailers();
    loadContainerStats();
  }, [loadShipments, loadTransportersAndRetailers, loadContainerStats]);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const stats = useMemo(() => ({
    total: shipments.length,
    inTransit: shipments.filter(s => s.rawStatus === SHIPMENT_STATUSES.IN_TRANSIT).length,
    atWarehouse: shipments.filter(s => s.rawStatus === SHIPMENT_STATUSES.AT_WAREHOUSE).length,
    readyForDispatch: shipments.filter(s => s.rawStatus === SHIPMENT_STATUSES.READY_FOR_DISPATCH).length,
    delivered: shipments.filter(s => s.rawStatus === SHIPMENT_STATUSES.DELIVERED).length,
  }), [shipments]);

  const pendingCount = useMemo(() => 
    shipments.filter(s => s.rawStatus === SHIPMENT_STATUSES.IN_TRANSIT).length,
  [shipments]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadShipments(), loadContainerStats()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment);
    setShowScanMode(false);
    setActiveTab("manage");
  };

  const handleScan = (shipment) => {
    setSelectedShipment(shipment);
    setShowScanMode(true);
  };

  // Called after each container scan - refresh data but stay in scan mode
  const handleScanComplete = (scanResult) => {
    // Refresh container stats and shipments in background
    loadContainerStats();
    
    // If status was updated to AT_WAREHOUSE, exit scan mode and refresh
    if (scanResult?.statusUpdated) {
      setShowScanMode(false);
      loadShipments();
    }
  };

  // Assign both transporter and retailer in one action
  const handleAssignBoth = async (shipmentHash, transporterWallet, retailerWallet) => {
    setIsProcessing(true);
    try {
      // Assign transporter first
      const transporterResult = await assignNextTransporter(shipmentHash, transporterWallet);
      if (!transporterResult.success) {
        alert(transporterResult.message || 'Failed to assign transporter');
        setIsProcessing(false);
        return;
      }

      // Then assign retailer
      const retailerResult = await assignRetailer(shipmentHash, retailerWallet);
      if (!retailerResult.success) {
        alert(retailerResult.message || 'Failed to assign retailer');
        setIsProcessing(false);
        return;
      }

      // Reload shipments and update selected shipment
      const freshShipments = await fetchWarehouseShipments(user.walletAddress);
      const warehouseShipments = freshShipments.shipments.map((s) => ({
        ...s,
        id: s.shipmentHash,
        rawStatus: s.status,
      }));
      setShipments(warehouseShipments);
      
      // Update selected shipment with fresh data
      const updated = warehouseShipments.find(s => s.shipmentHash === shipmentHash);
      if (updated) setSelectedShipment(updated);
      
      alert('Transporter & Retailer assigned successfully!');
    } catch (err) {
      console.error("Failed to assign:", err);
      alert(err.message || 'Failed to assign transporter & retailer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReadyForDispatch = async (shipmentHash) => {
    setIsProcessing(true);
    try {
      const result = await markReadyForDispatchNextLeg(shipmentHash);
      if (result.success) {
        alert('Shipment marked Ready for Dispatch! Status updated.');
        await loadShipments();
        setSelectedShipment(null);
      } else {
        alert(result.message || 'Failed to mark ready for dispatch');
      }
    } catch (err) {
      console.error("Failed to mark ready for dispatch:", err);
      alert(err.message || 'Failed to mark ready for dispatch');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedShipment(null);
    setShowScanMode(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  if (page === "profile") {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
      }`}>
        <Header />
        <ProfilePage />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB CONTENT RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getTabContent = () => {
    switch (activeTab) {
      case "active":
        return {
          title: "Active Shipments",
          subtitle: `${stats.inTransit} shipment${stats.inTransit !== 1 ? 's' : ''} awaiting scan`
        };
      case "manage":
        return {
          title: selectedShipment ? (selectedShipment.batchId || "Shipment") : "Manage Shipments",
          subtitle: selectedShipment
            ? showScanMode ? "Scanning containers" : "View and manage shipment"
            : "Select a shipment to manage"
        };
      case "history":
        return {
          title: "Shipment History",
          subtitle: `${stats.delivered} completed shipment${stats.delivered !== 1 ? 's' : ''}`
        };
      default:
        return {
          title: "Dashboard",
          subtitle: `Managing ${shipments.length} shipment${shipments.length !== 1 ? 's' : ''}`
        };
    }
  };

  const tabContent = getTabContent();

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <WarehouseStatsGrid stats={stats} />
      <WarehouseShipmentsTable
        shipments={shipments}
        onShipmentSelect={handleShipmentSelect}
        activeTab={activeTab}
        containerStats={containerStats}
      />
    </div>
  );

  const renderActiveContent = () => (
    <div className="space-y-6">
      <WarehouseShipmentsTable
        shipments={shipments}
        onShipmentSelect={handleShipmentSelect}
        activeTab={activeTab}
        containerStats={containerStats}
      />
    </div>
  );

  const renderManageContent = () => {
    if (!selectedShipment) {
      return (
        <div className={`border rounded-2xl p-12 text-center ${
          isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isDarkMode ? "bg-gradient-to-br from-slate-800 to-slate-700" : "bg-gradient-to-br from-slate-100 to-slate-200"
          }`}>
            <svg className={`w-10 h-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
            No Shipment Selected
          </h3>
          <p className={`mb-6 max-w-sm mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Select a shipment from Dashboard or Active tab to view details and scan containers
          </p>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg shadow-purple-500/25"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    if (showScanMode) {
      return (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setShowScanMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Details
          </button>
          
          <WarehouseScanPage
            shipmentFilter={selectedShipment?.shipmentHash}
            shipmentData={selectedShipment}
            onScanComplete={handleScanComplete}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShipmentDetailPanel
            shipment={selectedShipment}
            containerStats={containerStats[selectedShipment?.shipmentHash]}
            transporters={transporters}
            retailers={retailers}
            onClose={handleClearSelection}
            onScan={handleScan}
            onAssignBoth={handleAssignBoth}
            onMarkReadyForDispatch={handleMarkReadyForDispatch}
            isProcessing={isProcessing}
            isDarkMode={isDarkMode}
          />
        </div>
        <div className={`rounded-2xl border p-5 ${
          isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h4 className={`font-semibold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {isRefreshing ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryContent = () => (
    <div className="space-y-6">
      <WarehouseShipmentsTable
        shipments={shipments}
        onShipmentSelect={handleShipmentSelect}
        activeTab={activeTab}
        containerStats={containerStats}
      />
    </div>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${
              isDarkMode ? 'border-purple-500 border-t-transparent' : 'border-purple-600 border-t-transparent'
            }`} />
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Loading shipments...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`rounded-2xl border p-8 text-center ${
          isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
            Failed to load shipments
          </p>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "active":
        return renderActiveContent();
      case "manage":
        return renderManageContent();
      case "history":
        return renderHistoryContent();
      default:
        return renderDashboardContent();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDarkMode
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
    }`}>
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {/* Tab Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {tabContent.title}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {tabContent.subtitle}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WAREHOUSE APP WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

const WarehouseApp = ({ page }) => {
  return (
    <WarehouseThemeProvider>
      <WarehouseDashboardContent page={page} />
    </WarehouseThemeProvider>
  );
};

export default WarehouseApp;
