/**
 * RetailerApp Component
 * Main dashboard view for retailer role in Sentinel supply chain system.
 * Features Transporter-style header with navigation tabs.
 */

import { useState, useEffect, useCallback } from "react";
import {
  RetailerThemeProvider,
  useRetailerTheme,
} from "./context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Header from "./layout/Header";
import NavigationTabs from "./components/NavigationTabs";
import SalesOverview from "./components/SalesOverview";
import OrdersTable from "./components/OrdersTable";
import ReceivedShipments from "./components/ReceivedShipments";
import ShipmentsModal from "./components/ShipmentsModal";
import StatsCards from "./components/StatsCards";
import RetailerScanPage from "./pages/RetailerScanPage";
import { DEMO_ORDERS } from "./constants";
import { useRetailerShipments } from "./hooks/useRetailerShipments";
import { getRetailerAssignedContainers } from "../../services/scanApi";

// Helper function to get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

// Main Retailer Dashboard Content
function RetailerDashboardContent() {
  const { isDarkMode } = useRetailerTheme();
  const { user, walletAddress } = useAuth();

  // Get profile name from localStorage or fallback to user data
  const [profileName, setProfileName] = useState(() => {
    const saved = localStorage.getItem("retailer_profile_name");
    return saved || user?.fullName || user?.organizationName || "Retailer";
  });

  // Update profile name when localStorage changes (e.g., from profile settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("retailer_profile_name");
      if (saved) {
        setProfileName(saved);
      }
    };

    // Listen for storage changes from other tabs/components
    window.addEventListener("storage", handleStorageChange);

    // Also check on focus (for same-tab updates)
    const handleFocus = () => {
      const saved = localStorage.getItem("retailer_profile_name");
      if (saved && saved !== profileName) {
        setProfileName(saved);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [profileName]);

  // Update greeting periodically
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Track if QR scanner is showing expanded result
  const [scannerExpanded, setScannerExpanded] = useState(false);

  // Track received shipments (scanned and confirmed by retailer - local state)
  const [receivedShipments, setReceivedShipments] = useState([]);

  // Fetch assigned shipments from database using the hook
  const { 
    shipments: assignedShipments, 
    isLoading: isLoadingShipments, 
    error: shipmentsError,
    refreshShipments: fetchAssignedShipments 
  } = useRetailerShipments();

  // Track if shipments modal is open
  const [showAllShipments, setShowAllShipments] = useState(false);

  // Track if Accept Shipment modal is open
  const [showAcceptShipment, setShowAcceptShipment] = useState(false);

  // Track if orders modal is open
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Track selected shipment for Manage tab (like transporter)
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showScanMode, setShowScanMode] = useState(false);
  const [shipmentContainerStats, setShipmentContainerStats] = useState(null);

  // Fetch container stats when a shipment is selected for Manage tab
  useEffect(() => {
    const fetchShipmentStats = async () => {
      if (!selectedShipment) {
        setShipmentContainerStats(null);
        return;
      }

      try {
        const response = await getRetailerAssignedContainers();
        if (response.success && response.data.shipments) {
          const shipment = response.data.shipments.find(
            s => s.shipmentHash === selectedShipment.shipmentHash ||
                 s.shipmentId === selectedShipment.id ||
                 s.batchId === selectedShipment.batchId
          );
          if (shipment) {
            setShipmentContainerStats({
              total: shipment.totalContainers,
              scanned: shipment.scannedCount,
              pending: shipment.pendingScans
            });
          } else {
            setShipmentContainerStats({
              total: selectedShipment.numberOfContainers || 0,
              scanned: 0,
              pending: selectedShipment.numberOfContainers || 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch shipment container stats:', error);
      }
    };

    fetchShipmentStats();
  }, [selectedShipment]);

  // Handle selecting a shipment to manage
  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setShowScanMode(false);
    setActiveTab("manage");
  };

  // Clear selected shipment
  const handleClearSelection = () => {
    setSelectedShipment(null);
    setShowScanMode(false);
  };

  // Handle when retailer confirms receipt of shipment
  const handleShipmentReceived = (shipment, txResult) => {
    const newShipment = {
      id: shipment.id,
      origin: shipment.origin,
      batch: shipment.batch,
      productName: shipment.productName || "Items",
      itemCount: shipment.itemCount,
      expectedItems: shipment.expectedItems,
      status: shipment.status || "Received",
      exceptionNote: shipment.exceptionNote || null,
      receivedAt:
        shipment.scannedAt ||
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      txHash: txResult.txHash,
      hasException: txResult.exception || false,
    };

    setReceivedShipments((prev) => [newShipment, ...prev]);
    setShowAcceptShipment(false);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Welcome Section */}
            <div className="mb-2">
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Welcome, {profileName} 👋
              </h1>
              <p
                className={`mt-1 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Here's what's happening with your store today
              </p>
            </div>

            {/* Stats Cards */}
            <StatsCards />

            {/* Incoming Shipments Section */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isDarkMode
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${
                      isDarkMode ? "text-amber-400" : "text-amber-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Incoming Shipments
                  </h2>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {isLoadingShipments ? "Loading..." : `${assignedShipments.length} shipment${assignedShipments.length !== 1 ? 's' : ''} assigned to you`}
                  </p>
                </div>
              </div>
              <div
                className={`flex-1 h-px ${
                  isDarkMode
                    ? "bg-gradient-to-r from-slate-700/50 to-transparent"
                    : "bg-gradient-to-r from-slate-200 to-transparent"
                }`}
              ></div>
              <button
                onClick={fetchAssignedShipments}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
                title="Refresh shipments"
              >
                <svg className={`h-5 w-5 ${isLoadingShipments ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Show error if any */}
            {shipmentsError && (
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <p className="text-sm">{shipmentsError}</p>
              </div>
            )}

            {/* Assigned Shipments List (from database) */}
            <ReceivedShipments
              shipments={assignedShipments}
              onViewAll={() => setShowAllShipments(true)}
              isLoading={isLoadingShipments}
              onManageShipment={handleSelectShipment}
            />
          </>
        );

      case "incoming":
        return (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="mb-2">
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Incoming Shipments
              </h1>
              <p
                className={`mt-1 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                View and manage shipments arriving at your store
              </p>
            </div>

            {/* Assigned Shipments from Database */}
            <ReceivedShipments
              shipments={assignedShipments}
              onViewAll={() => setShowAllShipments(true)}
              isLoading={isLoadingShipments}
              onManageShipment={handleSelectShipment}
            />
          </div>
        );

      case "qr-scan":
        return (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="mb-2">
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Delivery Scanner
              </h1>
              <p
                className={`mt-1 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Scan QR codes to confirm delivery and receive shipments
              </p>
            </div>

            {/* Retailer Scan Page - Container Scanner */}
            <RetailerScanPage />
          </div>
        );

      case "manage":
        // No shipment selected - show empty state
        if (!selectedShipment) {
          return (
            <div className="space-y-6">
              <div className="mb-2">
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Manage Shipments
                </h1>
                <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Select a shipment from Dashboard or Incoming to manage
                </p>
              </div>

              <div className={`border rounded-2xl p-12 text-center ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDarkMode ? "bg-gradient-to-br from-slate-800 to-slate-700" : "bg-gradient-to-br from-slate-100 to-slate-200"}`}>
                  <svg className={`w-10 h-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
                  No Shipment Selected
                </h3>
                <p className={`mb-6 max-w-sm mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Select a shipment from the Dashboard or Incoming tab to view details and scan containers for delivery
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          );
        }

        // Shipment selected - show management view
        return (
          <div className="space-y-6">
            <div className="mb-2">
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {selectedShipment.batchId || selectedShipment.id}
              </h1>
              <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                {showScanMode ? 'Scanning containers for delivery' : 'View and manage shipment details'}
              </p>
            </div>

            {/* Selected Shipment Header Card */}
            <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20" : "bg-gradient-to-br from-emerald-100 to-teal-100"}`}>
                      <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className={`text-lg font-bold font-mono ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
                          {selectedShipment.batchId || selectedShipment.id}
                        </h2>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                          selectedShipment.originalStatus === 'DELIVERED'
                            ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                        }`}>
                          {selectedShipment.status}
                        </span>
                        {selectedShipment.isLocked && (
                          <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            On Chain
                          </span>
                        )}
                        {shipmentContainerStats && (
                          shipmentContainerStats.pending === 0 ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              All Scanned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Scan Pending ({shipmentContainerStats.scanned}/{shipmentContainerStats.total})
                            </span>
                          )
                        )}
                      </div>
                      <p className={`text-xs font-mono mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {selectedShipment.shipmentHash || selectedShipment.id}
                      </p>
                      <div className={`flex items-center gap-3 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                            {selectedShipment.numberOfContainers || selectedShipment.itemCount || 0}
                          </span>
                          containers
                        </span>
                        <span className={`w-1 h-1 rounded-full ${isDarkMode ? "bg-slate-600" : "bg-slate-300"}`} />
                        <span>From: {selectedShipment.origin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 lg:shrink-0 flex-wrap">
                    <button
                      onClick={() => setShowScanMode(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        !showScanMode
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    <button
                      onClick={() => setShowScanMode(true)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        showScanMode
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                          : isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Scan QR
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {showScanMode ? (
              <RetailerScanPage 
                key={selectedShipment.shipmentHash || selectedShipment.id} 
                shipmentFilter={selectedShipment.shipmentHash} 
                shipmentData={selectedShipment}
              />
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Shipment Details */}
                <div className={`border rounded-2xl p-5 ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Shipment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Batch ID</p>
                      <p className={`font-medium font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedShipment.batchId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Product</p>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedShipment.productName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Containers</p>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedShipment.numberOfContainers || selectedShipment.itemCount || 0}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Status</p>
                      <p className={`font-medium ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{selectedShipment.status}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Origin</p>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedShipment.origin}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Assigned At</p>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedShipment.assignedAt || selectedShipment.createdAt || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={`border rounded-2xl p-5 ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowScanMode(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Scan Container QR Codes
                    </button>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      Scan all container QR codes to confirm delivery. After scanning all containers, the shipment will be marked as delivered.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 lg:pb-6">
          {renderTabContent()}
        </main>
      </div>

      {/* All Shipments Modal */}
      <ShipmentsModal
        shipments={assignedShipments}
        isOpen={showAllShipments}
        onClose={() => setShowAllShipments(false)}
      />

      {/* Accept Shipment Modal */}
      {showAcceptShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowAcceptShipment(false)}
          />
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl ${
              isDarkMode
                ? "bg-slate-900 border border-slate-700/50"
                : "bg-white border border-slate-200"
            }`}
          >
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? "border-slate-700/50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isDarkMode
                      ? "bg-cyan-500/10 border border-cyan-500/20"
                      : "bg-cyan-50 border border-cyan-200"
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-cyan-400" : "text-cyan-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Accept Shipment
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Scan QR to receive shipment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptShipment(false)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <SalesOverview
                onExpandChange={() => {}}
                onShipmentConfirmed={(shipment, tx) => {
                  handleShipmentReceived(shipment, tx);
                  setTimeout(() => setShowAcceptShipment(false), 1500);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowOrdersModal(false)}
          />
          <div
            className={`relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${
              isDarkMode
                ? "bg-slate-900 border border-slate-700/50"
                : "bg-white border border-slate-200"
            }`}
          >
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? "border-slate-700/50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isDarkMode
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-amber-400" : "text-amber-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Order History
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    All customer orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="min-w-full">
                <thead
                  className={`${
                    isDarkMode ? "bg-slate-800/60" : "bg-slate-50"
                  } sticky top-0`}
                >
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Order ID
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Product
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Customer
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode ? "divide-slate-700/50" : "divide-slate-100"
                  }`}
                >
                  {DEMO_ORDERS.map((order) => (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isDarkMode
                          ? "hover:bg-slate-800/40"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p
                          className={`font-semibold ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {order.id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {order.product}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {order.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {order.date}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            order.status === "Pending"
                              ? isDarkMode
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                                : "bg-amber-50 text-amber-600 border-amber-200"
                              : order.status === "In Delivery"
                              ? isDarkMode
                                ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                              : isDarkMode
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className={`px-6 py-4 border-t flex items-center justify-between ${
                isDarkMode ? "border-slate-700/50" : "border-slate-200"
              }`}
            >
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Total:{" "}
                <span
                  className={`font-medium ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {DEMO_ORDERS.length}
                </span>{" "}
                orders
              </p>
              <button
                onClick={() => setShowOrdersModal(false)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/50"
                    : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with Theme Provider
function RetailerApp() {
  return (
    <RetailerThemeProvider>
      <RetailerDashboardContent />
    </RetailerThemeProvider>
  );
}

export default RetailerApp;
