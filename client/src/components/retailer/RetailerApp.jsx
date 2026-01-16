/**
 * RetailerApp Component
 * Main dashboard view for retailer role in Sentinel supply chain system.
 * Features Transporter-style header with navigation tabs.
 */

import { useState, useEffect } from "react";
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
import { DEMO_ORDERS } from "./constants";

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
  const { user } = useAuth();

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

  // Track received shipments (scanned and confirmed by retailer)
  const [receivedShipments, setReceivedShipments] = useState([]);

  // Track if shipments modal is open
  const [showAllShipments, setShowAllShipments] = useState(false);

  // Track if Accept Shipment modal is open
  const [showAcceptShipment, setShowAcceptShipment] = useState(false);

  // Track if orders modal is open
  const [showOrdersModal, setShowOrdersModal] = useState(false);

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
                    {receivedShipments.length} shipment{receivedShipments.length !== 1 ? 's' : ''} assigned to you
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
                onClick={() => setShowAllShipments(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Received Shipments List */}
            <ReceivedShipments
              shipments={receivedShipments}
              onViewAll={() => setShowAllShipments(true)}
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

            {/* Received Shipments */}
            <ReceivedShipments
              shipments={receivedShipments}
              onViewAll={() => setShowAllShipments(true)}
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
                QR Scanner
              </h1>
              <p
                className={`mt-1 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Scan QR codes to receive and verify shipments
              </p>
            </div>

            {/* QR Scanner */}
            <SalesOverview
              onExpandChange={setScannerExpanded}
              onShipmentConfirmed={handleShipmentReceived}
            />

            {/* Received Shipments Section */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isDarkMode
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Received Shipments
                  </h2>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Scanned and added to blockchain
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
            </div>

            <ReceivedShipments
              shipments={receivedShipments}
              onViewAll={() => setShowAllShipments(true)}
            />
          </div>
        );

      case "manage":
        return (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="mb-2">
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Manage Store
              </h1>
              <p
                className={`mt-1 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Manage orders and store operations
              </p>
            </div>

            {/* Orders Table */}
            <OrdersTable expandedMode={true} />
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
        shipments={receivedShipments}
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
