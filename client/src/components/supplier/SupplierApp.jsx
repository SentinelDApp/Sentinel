/**
 * SupplierApp - Main Supplier Dashboard Application
 *
 * SYSTEM PRINCIPLE:
 * Sentinel records shipment identity on-chain while enabling container-level
 * traceability using off-chain QR codes. The supplier creates shipments with
 * containers, and when marked "Ready for Dispatch", the shipment is permanently
 * locked to the blockchain.
 *
 * DATA FLOW:
 * 1. Supplier creates shipment → locks to blockchain
 * 2. Blockchain emits ShipmentLocked event
 * 3. Backend indexer captures event → stores in MongoDB
 * 4. Frontend fetches from backend API
 */

import { useState, useEffect, useCallback } from "react";
import {
  SupplierThemeProvider,
  useSupplierTheme,
} from "./context/ThemeContext";
import Header from "./layout/Header";
import SupplierOverview from "./components/SupplierOverview";
import CreateShipment from "./components/CreateShipment";
import ShipmentList from "./components/ShipmentList";
import ShipmentActions from "./components/ShipmentActions";
import ShipmentDetails from "./components/ShipmentDetails";
import QRCodesView from "./components/QRCodesView";
import ConcernsView from "./components/ConcernsView";
import UploadMetadata from "./components/UploadMetadata";
import { fetchShipments, fetchContainers, fetchShipmentByHash, createShipment as createShipmentApi, lockShipment } from "../../services/shipmentApi";
import { useAuth } from "../../context/AuthContext";
import {
  SHIPMENT_STATUSES,
  STATUS_COLORS,
  CONCERN_STATUS,
  generateMetadataHash,
} from "./constants";

// Left Sidebar Navigation Component
const LeftSidebar = ({
  activeTab,
  setActiveTab,
  shipmentsWithConcerns,
  isDarkMode,
  onLogout,
}) => {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      color: "blue",
    },
    {
      id: "create",
      label: "Create Shipment",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      color: "emerald",
    },
    {
      id: "manage",
      label: "Manage",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      color: "amber",
      badge: shipmentsWithConcerns > 0 ? shipmentsWithConcerns : null,
    },
  ];

  const getActiveStyles = () => {
    return isDarkMode
      ? "bg-slate-800 text-white"
      : "bg-slate-100 text-slate-900";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r transition-colors duration-200 ${
          isDarkMode
            ? "bg-slate-900/70 border-slate-700/50"
            : "bg-white/80 border-slate-200"
        }`}
      >
        {/* Logo/Brand */}
        <div
          className={`p-5 border-b ${
            isDarkMode ? "border-slate-700/50" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                  : "bg-gradient-to-br from-blue-100 to-cyan-100"
              }`}
            >
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h1
                className={`text-base font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Sentinel
              </h1>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Supplier Portal
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.id
                  ? getActiveStyles()
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

        {/* Bottom Section */}
        <div
          className={`p-3 border-t ${
            isDarkMode ? "border-slate-700/50" : "border-slate-200"
          }`}
        >
          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-2 mb-2`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Blockchain synced
            </span>
          </div>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isDarkMode
                ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                : "text-slate-600 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/50"
            : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "text-blue-400"
                    : "text-blue-600"
                  : isDarkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">
                {tab.label.split(" ")[0]}
              </span>
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

// Main Supplier Dashboard Content
const SupplierDashboardContent = () => {
  const { isDarkMode } = useSupplierTheme();
  const { walletAddress, logout } = useAuth();

  // Shipments state - fetched from backend API (indexed from blockchain)
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewingShipmentDetails, setViewingShipmentDetails] = useState(null);

  // Persistent form state for CreateShipment (lifted to prevent data loss on tab switch)
  const [createShipmentFormData, setCreateShipmentFormData] = useState({
    productName: "",
    batchId: "",
    numberOfContainers: "",
    quantityPerContainer: "",
    transporterId: "",
    warehouseId: "",
  });

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH SHIPMENTS FROM BACKEND API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Load shipments from the backend indexer
   * The backend indexes ShipmentLocked events from the blockchain
   */
  const loadShipments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch shipments for this supplier's wallet
      const { shipments: fetchedShipments } = await fetchShipments(
        walletAddress
      );

      // For each shipment, fetch its containers
      const shipmentsWithContainers = await Promise.all(
        fetchedShipments.map(async (shipment) => {
          try {
            const { containers } = await fetchContainers(shipment.shipmentHash);
            return { ...shipment, containers };
          } catch {
            // If container fetch fails, return shipment without containers
            return { ...shipment, containers: [] };
          }
        })
      );

      setShipments(shipmentsWithContainers);
    } catch (err) {
      console.error("Failed to load shipments:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch shipments on mount and when wallet changes
  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // ═══════════════════════════════════════════════════════════════════════
  // SHIPMENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  // Create new shipment (adds to local state, will be fetched after blockchain lock)
  const handleCreateShipment = (newShipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setActiveTab("dashboard");
  };

  // Mark shipment ready for dispatch (locks to blockchain)
  const handleMarkReady = (shipmentId) => {
    const blockchainTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;

        // Lock all containers
        const lockedContainers = (s.containers || []).map((c) => ({
          ...c,
          status: "LOCKED",
        }));

        return {
          ...s,
          status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
          isLocked: true,
          blockchainTxHash,
          containers: lockedContainers,
        };
      })
    );

    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => ({
        ...prev,
        status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
        isLocked: true,
        blockchainTxHash,
        containers: (prev.containers || []).map((c) => ({
          ...c,
          status: "LOCKED",
        })),
      }));
    }
    
    // Refresh shipments to get updated documents from server
    await loadShipments();
  };

  // Assign transporter to shipment (only allowed before dispatch/lock)
  const handleAssignTransporter = (shipmentId, transporterInfo) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;
        // Only allow if not locked
        if (s.isLocked) return s;
        return {
          ...s,
          transporterId: transporterInfo.transporterId,
          transporterName: transporterInfo.transporterName,
        };
      })
    );

    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => {
        if (prev.isLocked) return prev;
        return {
          ...prev,
          transporterId: transporterInfo.transporterId,
          transporterName: transporterInfo.transporterName,
        };
      });
    }
  };

  // Upload metadata (off-chain)
  const handleMetadataUpload = (shipmentId, files) => {
    const metadataHash = generateMetadataHash({
      files,
      uploadedAt: Date.now(),
    });
    const metadata = {
      hash: metadataHash,
      documents: files.map((f) => f.name),
      uploadedAt: Date.now(),
    };

    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, metadata } : s))
    );

    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => ({ ...prev, metadata }));
    }
  };

  // Acknowledge a concern
  const handleAcknowledgeConcern = (shipmentId, concernId) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;

        const updatedConcerns = s.concerns.map((c) =>
          c.id === concernId
            ? {
                ...c,
                status: CONCERN_STATUS.ACKNOWLEDGED,
                acknowledgedAt: Date.now(),
              }
            : c
        );

        return { ...s, concerns: updatedConcerns };
      })
    );

    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => ({
        ...prev,
        concerns: prev.concerns.map((c) =>
          c.id === concernId
            ? {
                ...c,
                status: CONCERN_STATUS.ACKNOWLEDGED,
                acknowledgedAt: Date.now(),
              }
            : c
        ),
      }));
    }
  };

  // Resolve a concern
  const handleResolveConcern = (shipmentId, concernId, resolution) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;

        const updatedConcerns = s.concerns.map((c) =>
          c.id === concernId
            ? {
                ...c,
                status: CONCERN_STATUS.RESOLVED,
                resolvedAt: Date.now(),
                resolution,
              }
            : c
        );

        return { ...s, concerns: updatedConcerns };
      })
    );

    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => ({
        ...prev,
        concerns: prev.concerns.map((c) =>
          c.id === concernId
            ? {
                ...c,
                status: CONCERN_STATUS.RESOLVED,
                resolvedAt: Date.now(),
                resolution,
              }
            : c
        ),
      }));
    }
  };

  // Select shipment and switch to manage tab
  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setViewingShipmentDetails(null);
    setActiveTab("manage");
  };

  // View shipment details (QR code view)
  const handleViewDetails = (shipment) => {
    // Set showTab to 'details' to ensure only details are shown
    setViewingShipmentDetails({ ...shipment, showTab: "details" });
  };

  // Close details view
  const handleCloseDetails = () => {
    setViewingShipmentDetails(null);
  };

  // Count shipments with open concerns for badge
  const shipmentsWithConcerns = shipments.filter((s) =>
    s.concerns?.some((c) => c.status === CONCERN_STATUS.OPEN)
  ).length;

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isDarkMode
          ? "bg-linear-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-linear-to-br from-slate-50 via-white to-slate-100"
      }`}
    >
      {/* Left Sidebar Navigation */}
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shipmentsWithConcerns={shipmentsWithConcerns}
        isDarkMode={isDarkMode}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Loading State */}
              {isLoading && (
                <div
                  className={`
                flex flex-col items-center justify-center py-16 rounded-2xl border
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border-slate-800"
                    : "bg-white border-slate-200"
                }
              `}
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p
                    className={isDarkMode ? "text-slate-400" : "text-slate-500"}
                  >
                    Loading shipments from blockchain indexer...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div
                  className={`
                flex flex-col items-center justify-center py-12 rounded-2xl border
                ${
                  isDarkMode
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-red-50 border-red-200"
                }
              `}
                >
                  <div className="text-4xl mb-4">⚠️</div>
                  <p
                    className={`text-lg font-medium mb-2 ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    Failed to load shipments
                  </p>
                  <p
                    className={`text-sm mb-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {error}
                  </p>
                  <button
                    onClick={loadShipments}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Content - Only show when not loading and no error */}
              {!isLoading && !error && (
                <>
                  <SupplierOverview
                    shipments={shipments}
                    isDarkMode={isDarkMode}
                  />
                  <ShipmentList
                    shipments={shipments}
                    selectedShipment={selectedShipment}
                    onShipmentSelect={handleSelectShipment}
                    isDarkMode={isDarkMode}
                  />
                </>
              )}
            </div>
          )}

          {/* Create Tab */}
          {activeTab === "create" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form - Takes 2 columns */}
              <div className="lg:col-span-2 h-fit">
                <CreateShipment
                  onCreateShipment={handleCreateShipment}
                  isDarkMode={isDarkMode}
                  formData={createShipmentFormData}
                  onFormDataChange={setCreateShipmentFormData}
                />
              </div>

              {/* Sidebar - Info */}
              <div
                className={`
              border rounded-2xl p-5 h-fit transition-colors duration-200
              ${
                isDarkMode
                  ? "bg-slate-900/50 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }
            `}
              >
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div
                    className={`
                  rounded-xl p-4 text-center border
                  ${
                    isDarkMode
                      ? "bg-linear-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20"
                      : "bg-blue-50 border-blue-200"
                  }
                `}
                  >
                    <p
                      className={`text-3xl font-bold ${
                        isDarkMode ? "text-slate-50" : "text-slate-900"
                      }`}
                    >
                      {shipments.reduce(
                        (acc, s) =>
                          acc +
                          (s.numberOfContainers || s.containers?.length || 0),
                        0
                      )}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Total Containers
                    </p>
                  </div>
                  <div
                    className={`
                  rounded-xl p-4 text-center border
                  ${
                    isDarkMode
                      ? "bg-linear-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
                      : "bg-green-50 border-green-200"
                  }
                `}
                  >
                    <p className="text-3xl font-bold text-green-500">
                      {
                        shipments.filter(
                          (s) => s.isLocked || s.blockchainTxHash
                        ).length
                      }
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      On Blockchain
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`border-t my-5 ${
                    isDarkMode ? "border-slate-800" : "border-slate-200"
                  }`}
                ></div>

                {/* Recent Shipments Quick Info */}
                <h3
                  className={`text-sm font-semibold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-slate-50" : "text-slate-900"
                  }`}
                >
                  <span className="text-lg">📦</span> Recent Shipments
                </h3>
                <div className="space-y-2">
                  {shipments.slice(0, 5).map((shipment) => (
                    <div
                      key={shipment.id}
                      className={`
                      flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer
                      ${
                        isDarkMode
                          ? "bg-slate-800/50 hover:bg-slate-800"
                          : "bg-slate-50 hover:bg-slate-100"
                      }
                    `}
                      onClick={() => {
                        setSelectedShipment(shipment);
                        setActiveTab("manage");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                        ${
                          isDarkMode
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        }
                      `}
                        >
                          {shipment.numberOfContainers ||
                            shipment.containers?.length ||
                            0}
                        </div>
                        <span
                          className={`text-sm font-mono truncate max-w-[120px] ${
                            isDarkMode ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {shipment.batchId}
                        </span>
                      </div>
                      {shipment.isLocked ? (
                        <span
                          className={`
                        text-xs px-2 py-0.5 rounded-full flex items-center gap-1
                        ${
                          isDarkMode
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-emerald-600 bg-emerald-50"
                        }
                      `}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span
                          className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${
                          isDarkMode
                            ? "text-slate-400 bg-slate-700/50"
                            : "text-slate-500 bg-slate-100"
                        }
                      `}
                        >
                          Draft
                        </span>
                      )}
                    </div>
                  ))}
                  {shipments.length === 0 && (
                    <p
                      className={`text-sm text-center py-4 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      No shipments yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              {!selectedShipment && (
                <div
                  className={`
                border rounded-2xl p-12 text-center transition-colors duration-200
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }
              `}
                >
                  <div
                    className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6
                  ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-800 to-slate-700"
                      : "bg-gradient-to-br from-slate-100 to-slate-200"
                  }
                `}
                  >
                    <svg
                      className={`w-10 h-10 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`text-xl font-semibold mb-2 ${
                      isDarkMode ? "text-slate-50" : "text-slate-900"
                    }`}
                  >
                    No Shipment Selected
                  </h3>
                  <p
                    className={`mb-6 max-w-sm mx-auto ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Select a shipment from the Dashboard to view details, manage
                    QR codes, and handle concerns
                  </p>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}

              {selectedShipment && (
                <div className="space-y-6">
                  {/* Selected Shipment Header Card */}
                  <div
                    className={`
                  border rounded-2xl overflow-hidden transition-colors duration-200
                  ${
                    isDarkMode
                      ? "bg-slate-900/50 border-slate-700/50"
                      : "bg-white border-slate-200 shadow-sm"
                  }
                `}
                  >
                    {/* Gradient Header Bar */}
                    <div
                      className={`h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500`}
                    />

                    <div className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Shipment Info */}
                        <div className="flex items-start gap-4">
                          <div
                            className={`
                          w-14 h-14 rounded-xl flex items-center justify-center shrink-0
                          ${
                            isDarkMode
                              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20"
                              : "bg-gradient-to-br from-blue-100 to-cyan-100"
                          }
                        `}
                          >
                            <svg
                              className="w-7 h-7 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h2
                                className={`text-lg font-bold font-mono ${
                                  isDarkMode
                                    ? "text-slate-50"
                                    : "text-slate-900"
                                }`}
                              >
                                {selectedShipment.batchId}
                              </h2>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                                  STATUS_COLORS[selectedShipment.status]?.bg ||
                                  ""
                                } ${
                                  STATUS_COLORS[selectedShipment.status]
                                    ?.text || ""
                                } ${
                                  STATUS_COLORS[selectedShipment.status]
                                    ?.border || ""
                                }`}
                              >
                                {STATUS_COLORS[selectedShipment.status]
                                  ?.label || selectedShipment.status}
                              </span>
                              {selectedShipment.isLocked && (
                                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                  </svg>
                                  On Chain
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs font-mono mb-2 ${
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {selectedShipment.shipmentHash ||
                                selectedShipment.id}
                            </p>
                            <div
                              className={`flex items-center gap-3 text-sm ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                <span
                                  className={`font-semibold ${
                                    isDarkMode
                                      ? "text-slate-200"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {selectedShipment.numberOfContainers ||
                                    selectedShipment.containers?.length ||
                                    0}
                                </span>
                                containers
                              </span>
                              <span
                                className={`w-1 h-1 rounded-full ${
                                  isDarkMode ? "bg-slate-600" : "bg-slate-300"
                                }`}
                              />
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold text-emerald-400`}
                                >
                                  {selectedShipment.totalQuantity || 0}
                                </span>
                                units total
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:shrink-0 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(selectedShipment)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                              viewingShipmentDetails?.showTab === "details"
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                : isDarkMode
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Details
                          </button>
                          <button
                            onClick={() =>
                              setViewingShipmentDetails({
                                ...selectedShipment,
                                showTab: "containers",
                              })
                            }
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                              viewingShipmentDetails?.showTab === "containers"
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                : isDarkMode
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                            QR Codes
                          </button>
                          <button
                            onClick={() =>
                              setViewingShipmentDetails({
                                ...selectedShipment,
                                showTab: "concerns",
                              })
                            }
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                              viewingShipmentDetails?.showTab === "concerns"
                                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                                : isDarkMode
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            Concerns
                            {selectedShipment.concerns?.filter(
                              (c) => c.status !== CONCERN_STATUS.RESOLVED
                            ).length > 0 && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {
                                  selectedShipment.concerns.filter(
                                    (c) => c.status !== CONCERN_STATUS.RESOLVED
                                  ).length
                                }
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedShipment(null)}
                            className={`
                          flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border
                          ${
                            isDarkMode
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                              : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                          }
                        `}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Details, QR Codes, Concerns, or Actions */}
                    {viewingShipmentDetails?.showTab === "details" ? (
                      <ShipmentDetails
                        shipment={viewingShipmentDetails}
                        onClose={handleCloseDetails}
                        isDarkMode={isDarkMode}
                      />
                    ) : viewingShipmentDetails?.showTab === "containers" ? (
                      <QRCodesView
                        shipment={viewingShipmentDetails}
                        onClose={handleCloseDetails}
                        isDarkMode={isDarkMode}
                      />
                    ) : viewingShipmentDetails?.showTab === "concerns" ? (
                      <ConcernsView
                        shipment={viewingShipmentDetails}
                        onClose={handleCloseDetails}
                        isDarkMode={isDarkMode}
                      />
                    ) : (
                      <ShipmentActions
                        shipment={selectedShipment}
                        onMarkReady={handleMarkReady}
                        onAssignTransporter={handleAssignTransporter}
                        onAcknowledgeConcern={handleAcknowledgeConcern}
                        onResolveConcern={handleResolveConcern}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {/* Right Column: Upload Metadata */}
                    <UploadMetadata
                      shipment={selectedShipment}
                      onUploadComplete={handleMetadataUpload}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Main SupplierApp wrapper with Theme Provider
const SupplierApp = () => {
  return (
    <SupplierThemeProvider>
      <SupplierDashboardContent />
    </SupplierThemeProvider>
  );
};

export default SupplierApp;
