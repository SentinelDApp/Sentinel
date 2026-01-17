/**
 * CommittedShipmentsPage Component
 *
 * Displays all shipments that have been successfully committed to the warehouse.
 * These are shipments where all containers have been scanned and received.
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { getCommittedShipments } from "../../../services/scanApi";
import { CheckCircleIcon, BoxIcon, TruckIcon } from "../icons/Icons";

// Clock Icon Component
const ClockIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Refresh Icon Component
const RefreshIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const CommittedShipmentsPage = () => {
  const { isDarkMode } = useTheme();
  const { walletAddress } = useAuth();

  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchShipments = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getCommittedShipments({
          warehouseWallet: walletAddress,
          page,
          limit: 10,
        });

        if (response.success) {
          setShipments(response.data || []);
          setPagination(response.pagination);
          setCurrentPage(page);
        } else {
          setError(response.message || "Failed to load committed shipments");
        }
      } catch (err) {
        console.error("Error fetching committed shipments:", err);
        setError(err.message || "Failed to load committed shipments");
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = () => {
    fetchShipments(currentPage);
  };

  const handlePageChange = (newPage) => {
    fetchShipments(newPage);
  };

  // Render loading state
  if (isLoading && shipments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          isDarkMode={isDarkMode}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <div className="flex items-center justify-center py-12">
          <div
            className={`w-12 h-12 rounded-full border-4 animate-spin ${
              isDarkMode
                ? "border-purple-500/20 border-t-purple-400"
                : "border-purple-200 border-t-purple-500"
            }`}
          />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          isDarkMode={isDarkMode}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode
              ? "bg-red-500/10 border-red-500/30"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}
          >
            Failed to load committed shipments
          </p>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-red-400/70" : "text-red-600"}`}
          >
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        isDarkMode={isDarkMode}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      {/* Stats Summary */}
      <div
        className={`p-4 rounded-xl border ${
          isDarkMode
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={CheckCircleIcon}
            label="Total Committed"
            value={pagination?.total || shipments.length}
            isDarkMode={isDarkMode}
            color="green"
          />
          <StatCard
            icon={BoxIcon}
            label="Total Containers"
            value={shipments.reduce(
              (acc, s) => acc + (s.containersReceived || 0),
              0,
            )}
            isDarkMode={isDarkMode}
            color="purple"
          />
          <StatCard
            icon={TruckIcon}
            label="Total Quantity"
            value={shipments.reduce(
              (acc, s) => acc + (s.totalQuantity || 0),
              0,
            )}
            isDarkMode={isDarkMode}
            color="cyan"
          />
        </div>
      </div>

      {/* Shipments List */}
      {shipments.length === 0 ? (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDarkMode
              ? "bg-slate-800/30 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <BoxIcon
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}
          />
          <p
            className={`text-lg font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            No committed shipments yet
          </p>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
          >
            Shipments will appear here after all containers are scanned
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <ShipmentCard
              key={shipment.shipmentHash}
              shipment={shipment}
              isDarkMode={isDarkMode}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1
                ? isDarkMode
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isDarkMode
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border"
            }`}
          >
            Previous
          </button>
          <span
            className={`px-4 py-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === pagination.totalPages
                ? isDarkMode
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isDarkMode
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Page Header Component
const PageHeader = ({ isDarkMode, onRefresh, isRefreshing }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`p-2 rounded-lg ${isDarkMode ? "bg-green-500/10" : "bg-green-50"}`}
        >
          <CheckCircleIcon
            className={`w-6 h-6 ${isDarkMode ? "text-green-400" : "text-green-600"}`}
          />
        </div>
        <h1
          className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          Committed Shipments
        </h1>
      </div>
      <p
        className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
      >
        Shipments with all containers successfully received at warehouse
      </p>
    </div>
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`p-2 rounded-lg transition-colors ${
        isDarkMode
          ? "bg-slate-700 hover:bg-slate-600 text-white"
          : "bg-white hover:bg-slate-100 text-slate-700 border"
      }`}
    >
      <RefreshIcon
        className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
      />
    </button>
  </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, isDarkMode, color }) => {
  const colorClasses = {
    green: isDarkMode
      ? "bg-green-500/10 text-green-400"
      : "bg-green-50 text-green-600",
    purple: isDarkMode
      ? "bg-purple-500/10 text-purple-400"
      : "bg-purple-50 text-purple-600",
    cyan: isDarkMode
      ? "bg-cyan-500/10 text-cyan-400"
      : "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p
          className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {value.toLocaleString()}
        </p>
        <p
          className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          {label}
        </p>
      </div>
    </div>
  );
};

// Shipment Card Component
const ShipmentCard = ({ shipment, isDarkMode, formatDate }) => (
  <div
    className={`p-4 rounded-xl border ${
      isDarkMode
        ? "bg-slate-800/50 border-slate-700"
        : "bg-white border-slate-200"
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <p
          className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {shipment.batchId}
        </p>
        <p
          className={`text-xs font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
        >
          {shipment.shipmentHash}
        </p>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isDarkMode
            ? "bg-green-500/10 text-green-400 border border-green-500/30"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}
      >
        ✓ Committed
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <p className={`${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
          Containers
        </p>
        <p
          className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
        >
          {shipment.containersReceived || shipment.numberOfContainers}
        </p>
      </div>
      <div>
        <p className={`${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
          Total Qty
        </p>
        <p
          className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
        >
          {shipment.totalQuantity?.toLocaleString()}
        </p>
      </div>
      <div>
        <p className={`${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
          Received At
        </p>
        <p
          className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
        >
          {formatDate(shipment.warehouseReceivedAt)}
        </p>
      </div>
      <div>
        <p className={`${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
          Blockchain
        </p>
        <p
          className={`font-mono text-xs ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
        >
          {shipment.txHash ? `${shipment.txHash.slice(0, 10)}...` : "N/A"}
        </p>
      </div>
    </div>

    {/* Supplier Info */}
    {shipment.assignedWarehouse && (
      <div
        className={`mt-3 pt-3 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
      >
        <p
          className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
        >
          Committed by:{" "}
          <span className="font-mono">
            {shipment.warehouseCommittedBy?.slice(0, 10)}...
          </span>
        </p>
      </div>
    )}
  </div>
);

export default CommittedShipmentsPage;
