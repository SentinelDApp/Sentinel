/**
 * ShipmentHistoryPage Component
 *
 * Public-facing page for tracking shipment history by batch ID.
 * Accessible via QR code scan at /:batchId/shipment-history
 *
 * Features:
 * - Product Details section
 * - Tracking History with real timestamps
 * - View Certificates tab for supplier-uploaded documents
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const ShipmentHistoryPage = () => {
  const { batchId } = useParams();
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);
  const [containers, setContainers] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tracking"); // 'tracking' or 'certificates'
  const [selectedImage, setSelectedImage] = useState(null); // For image modal

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!batchId) return;

      setLoading(true);
      setError(null);

      try {
        // Use the new tracking API endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/track/${encodeURIComponent(batchId)}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setShipment(data.data.shipment);
            setContainers(data.data.containers || []);
            setTrackingHistory(data.data.trackingHistory || []);
            setCertificates(data.data.certificates || []);
          } else {
            setError("Product not found. Please check the batch ID.");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Unable to fetch product information.");
        }
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [batchId]);

  const bgClass = darkMode ? "bg-slate-950" : "bg-slate-50";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";
  const cardBgClass = darkMode
    ? "bg-slate-900/50 border-slate-800"
    : "bg-white border-slate-200";

  // Status styling
  const getStatusStyle = (status) => {
    const styles = {
      created: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        label: "Created",
      },
      locked: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        label: "Locked on Blockchain",
      },
      in_transit: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        label: "In Transit",
      },
      at_warehouse: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        label: "At Warehouse",
      },
      verified: {
        bg: "bg-green-500/10",
        text: "text-green-400",
        label: "Verified",
      },
      delivered: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        label: "Delivered",
      },
      ready_for_dispatch: {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        label: "Ready for Dispatch",
      },
    };
    return styles[status?.toLowerCase()] || styles.created;
  };

  // Get icon for tracking event
  const getEventIcon = (event) => {
    const icons = {
      CREATED: "📦",
      LOCKED: "🔐",
      CUSTODY_PICKUP: "🚚",
      IN_TRANSIT: "🚚",
      CUSTODY_RECEIVE: "🏭",
      AT_WAREHOUSE: "🏭",
      READY_FOR_DISPATCH: "📋",
      CUSTODY_HANDOVER: "🤝",
      SCAN_VERIFY: "🔍",
      VERIFIED: "✅",
      FINAL_DELIVERY: "🎉",
      DELIVERED: "🎉",
    };
    return icons[event?.toUpperCase()] || "📍";
  };

  // Format date with full timestamp
  const formatDateTime = (dateString) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format short date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div
      className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`border-b ${darkMode ? "border-slate-800/50" : "border-slate-200"}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-500">Sentinel</h1>
                <p className={`text-xs ${mutedTextClass}`}>Product Tracking</p>
              </div>
            </Link>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Batch ID Header */}
        <div className="text-center mb-8">
          <p className={`text-sm ${mutedTextClass} mb-2`}>Tracking Batch</p>
          <h2 className="text-2xl font-bold font-mono">{batchId}</h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`${cardBgClass} border rounded-2xl p-12 text-center`}>
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className={mutedTextClass}>Loading shipment information...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`${cardBgClass} border rounded-2xl p-12 text-center`}>
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">Product Not Found</h3>
            <p className={`${mutedTextClass} mb-6`}>{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        )}

        {/* Shipment Data */}
        {shipment && !loading && (
          <div className="space-y-8">
            {/* ══════════════════════════════════════════════════════════════════
                SECTION 1: PRODUCT DETAILS
            ══════════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-blue-500/20" : "bg-blue-100"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                </div>
                <h2 className="text-xl font-bold">Product Details</h2>
              </div>

              <div
                className={`${cardBgClass} border rounded-2xl overflow-hidden`}
              >
                {/* Verification Status Banner */}
                <div
                  className={`px-6 py-4 ${
                    shipment.isLocked
                      ? darkMode
                        ? "bg-green-500/10 border-b border-green-500/20"
                        : "bg-green-50 border-b border-green-200"
                      : darkMode
                        ? "bg-blue-500/10 border-b border-blue-500/20"
                        : "bg-blue-50 border-b border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {shipment.isLocked ? (
                        <svg
                          className="w-6 h-6 text-green-500"
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
                      ) : (
                        <svg
                          className="w-6 h-6 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      <span
                        className={`font-medium ${shipment.isLocked ? "text-green-500" : "text-blue-500"}`}
                      >
                        {shipment.isLocked
                          ? "✓ Blockchain Verified"
                          : "Tracked Product"}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(shipment.status).bg} ${getStatusStyle(shipment.status).text}`}
                    >
                      {getStatusStyle(shipment.status).label}
                    </div>
                  </div>
                </div>

                {/* Product Info Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <p
                          className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                        >
                          Product Name
                        </p>
                        <p className="text-lg font-semibold">
                          {shipment.productName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                        >
                          Batch ID
                        </p>
                        <p className="font-mono font-medium text-blue-500">
                          {shipment.batchId}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                        >
                          Supplier
                        </p>
                        <p className="font-mono text-sm">
                          {truncateAddress(shipment.supplierWallet)}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p
                            className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                          >
                            Total Quantity
                          </p>
                          <p className="text-lg font-semibold">
                            {shipment.totalQuantity || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                          >
                            Containers
                          </p>
                          <p className="text-lg font-semibold">
                            {shipment.numberOfContainers ||
                              containers.length ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                        >
                          Quantity per Container
                        </p>
                        <p className="font-medium">
                          {shipment.quantityPerContainer || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                        >
                          Created Date
                        </p>
                        <p className="font-medium">
                          {formatDate(shipment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Hash */}
                  {shipment.shipmentHash && (
                    <div
                      className={`mt-6 pt-4 border-t ${darkMode ? "border-slate-700/50" : "border-slate-200"}`}
                    >
                      <p
                        className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                      >
                        Shipment Hash
                      </p>
                      <p className="font-mono text-sm break-all">
                        {shipment.shipmentHash}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Transaction */}
                  {shipment.isLocked && shipment.txHash && (
                    <div
                      className={`mt-4 pt-4 border-t ${darkMode ? "border-slate-700/50" : "border-slate-200"}`}
                    >
                      <p
                        className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-1`}
                      >
                        Blockchain Transaction
                      </p>
                      <p className="font-mono text-sm break-all text-green-500">
                        {shipment.txHash}
                      </p>
                    </div>
                  )}
                </div>

                {/* Container List (Collapsible) */}
                {containers.length > 0 && (
                  <div className={`px-6 pb-6`}>
                    <div
                      className={`p-4 rounded-xl ${darkMode ? "bg-slate-800/50" : "bg-slate-50"}`}
                    >
                      <p
                        className={`text-xs uppercase tracking-wider ${mutedTextClass} mb-3`}
                      >
                        Container Status ({containers.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {containers.slice(0, 6).map((container, index) => (
                          <div
                            key={container.containerId || index}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              darkMode
                                ? "bg-slate-700/50"
                                : "bg-white border border-slate-200"
                            }`}
                          >
                            <span className="font-mono text-xs">
                              {container.containerId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(container.status).bg} ${getStatusStyle(container.status).text}`}
                            >
                              {container.status || "Created"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {containers.length > 6 && (
                        <p
                          className={`text-xs ${mutedTextClass} mt-2 text-center`}
                        >
                          +{containers.length - 6} more containers
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 2: TABS - TRACKING HISTORY & CERTIFICATES
            ══════════════════════════════════════════════════════════════════ */}
            <section>
              {/* Tab Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("tracking")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === "tracking"
                      ? darkMode
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-emerald-100 text-emerald-700"
                      : darkMode
                        ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Tracking History
                </button>
                <button
                  onClick={() => setActiveTab("certificates")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === "certificates"
                      ? darkMode
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-purple-100 text-purple-700"
                      : darkMode
                        ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Certificates ({certificates.length})
                </button>
              </div>

              {/* Tracking History Tab */}
              {activeTab === "tracking" && (
                <div className={`${cardBgClass} border rounded-2xl p-6`}>
                  {trackingHistory.length > 0 ? (
                    <div className="relative">
                      {trackingHistory.map((event, index) => {
                        const isLast = index === trackingHistory.length - 1;

                        return (
                          <div key={index} className="flex gap-4">
                            {/* Timeline Node */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                                  darkMode
                                    ? "bg-green-500/20 border-green-500/50"
                                    : "bg-green-100 border-green-300"
                                }`}
                              >
                                {getEventIcon(event.event)}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-0.5 flex-1 min-h-[40px] ${
                                    darkMode
                                      ? "bg-green-500/30"
                                      : "bg-green-300"
                                  }`}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div
                              className={`flex-1 ${!isLast ? "pb-6" : "pb-0"}`}
                            >
                              <div
                                className={`p-4 rounded-xl ${
                                  darkMode ? "bg-slate-800/50" : "bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base">
                                      {event.title}
                                    </h4>
                                    <p
                                      className={`text-sm mt-1 ${mutedTextClass}`}
                                    >
                                      {event.description}
                                    </p>

                                    {/* Actor info */}
                                    {event.actor && (
                                      <p
                                        className={`text-xs mt-2 ${mutedTextClass}`}
                                      >
                                        👤{" "}
                                        {event.actorRole
                                          ? `${event.actorRole}: `
                                          : ""}
                                        {truncateAddress(event.actor)}
                                      </p>
                                    )}

                                    {/* Container ID if applicable */}
                                    {event.containerId && (
                                      <p
                                        className={`text-xs mt-1 ${mutedTextClass}`}
                                      >
                                        📦 Container:{" "}
                                        <span className="font-mono">
                                          {event.containerId}
                                        </span>
                                      </p>
                                    )}

                                    {/* Transaction hash */}
                                    {event.txHash && (
                                      <p
                                        className={`text-xs mt-1 font-mono text-green-500 break-all`}
                                      >
                                        ⛓️ {event.txHash.slice(0, 20)}...
                                      </p>
                                    )}
                                  </div>

                                  <span
                                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                                      darkMode
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-green-100 text-green-600"
                                    }`}
                                  >
                                    ✓ Complete
                                  </span>
                                </div>

                                {/* Timestamp - Always show */}
                                <div
                                  className={`mt-3 pt-3 border-t ${darkMode ? "border-slate-700/50" : "border-slate-200"}`}
                                >
                                  <p
                                    className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                                  >
                                    📅 {formatDateTime(event.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📭</div>
                      <p className={`text-lg font-medium mb-2`}>
                        No tracking history yet
                      </p>
                      <p className={mutedTextClass}>
                        Tracking events will appear here as the shipment
                        progresses
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Certificates Tab */}
              {activeTab === "certificates" && (
                <div className={`${cardBgClass} border rounded-2xl p-6`}>
                  {certificates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certificates.map((cert, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedImage(cert.url)}
                          className={`cursor-pointer group rounded-xl overflow-hidden border transition-all hover:scale-[1.02] ${
                            darkMode
                              ? "bg-slate-800/50 border-slate-700 hover:border-purple-500/50"
                              : "bg-slate-50 border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          {/* Image Preview */}
                          <div className="relative aspect-video bg-slate-900/50 overflow-hidden">
                            <img
                              src={cert.url}
                              alt={cert.fileName || `Certificate ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div className="hidden absolute inset-0 items-center justify-center bg-slate-800">
                              <svg
                                className="w-12 h-12 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                              <span className="text-white text-sm font-medium">
                                Click to view
                              </span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-3">
                            <p
                              className={`font-medium text-sm truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {cert.fileName || `Certificate ${index + 1}`}
                            </p>
                            <p className={`text-xs mt-1 ${mutedTextClass}`}>
                              Uploaded: {formatDate(cert.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📄</div>
                      <p className={`text-lg font-medium mb-2`}>
                        No certificates uploaded
                      </p>
                      <p className={mutedTextClass}>
                        The supplier has not uploaded any certificates for this
                        shipment
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className={`text-sm ${mutedTextClass}`}>
            Powered by{" "}
            <span className="text-blue-500 font-semibold">Sentinel</span> -
            Blockchain Supply Chain Tracking
          </p>
        </div>
      </main>

      {/* Image Modal for Certificate Viewing */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <svg
                className="w-8 h-8"
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
            </button>
            <img
              src={selectedImage}
              alt="Certificate"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 text-slate-900 rounded-lg font-medium text-sm hover:bg-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open in new tab ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentHistoryPage;
