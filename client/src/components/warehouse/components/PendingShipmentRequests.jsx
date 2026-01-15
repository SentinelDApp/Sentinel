import { useState, useEffect } from "react";
import { useWarehouseTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { fetchWarehouseShipments } from "../../../services/shipmentApi";
import {
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  RefreshIcon,
} from "../icons/Icons";

const PendingShipmentRequests = () => {
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();
  const [pendingShipments, setPendingShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingRequests = async () => {
    if (!user?.walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch shipments assigned to this warehouse with CREATED or READY_FOR_DISPATCH status
      const { shipments } = await fetchWarehouseShipments(user.walletAddress);
      // Filter for pending/incoming shipments (not yet at warehouse)
      const pending = shipments.filter(
        (s) => s.status === "created" || s.status === "ready_for_dispatch"
      );
      setPendingShipments(pending);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user?.walletAddress]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getStatusBadge = (status) => {
    if (status === "created") {
      return {
        label: "New Request",
        bgDark: "bg-blue-500/10",
        bgLight: "bg-blue-50",
        textDark: "text-blue-400",
        textLight: "text-blue-600",
        borderDark: "border-blue-500/30",
        borderLight: "border-blue-200",
      };
    }
    return {
      label: "Ready for Dispatch",
      bgDark: "bg-amber-500/10",
      bgLight: "bg-amber-50",
      textDark: "text-amber-400",
      textLight: "text-amber-600",
      borderDark: "border-amber-500/30",
      borderLight: "border-amber-200",
    };
  };

  if (loading) {
    return (
      <div
        className={`
        rounded-2xl p-8 text-center
        ${
          isDarkMode
            ? "bg-slate-900/50 border border-slate-800/50"
            : "bg-white border border-slate-200/50 shadow-sm"
        }
      `}
      >
        <RefreshIcon
          className={`w-8 h-8 mx-auto mb-3 animate-spin ${
            isDarkMode ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
          Loading incoming shipments...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`
        rounded-2xl p-6
        ${
          isDarkMode
            ? "bg-red-500/10 border border-red-500/30"
            : "bg-red-50 border border-red-200"
        }
      `}
      >
        <p className={isDarkMode ? "text-red-400" : "text-red-600"}>
          Error: {error}
        </p>
        <button
          onClick={fetchPendingRequests}
          className={`
            mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              isDarkMode
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }
          `}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
            }`}
          >
            <TruckIcon
              className={`w-5 h-5 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
          </div>
          <div>
            <h2
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Incoming Shipments
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {pendingShipments.length} shipment
              {pendingShipments.length !== 1 ? "s" : ""} assigned to you
            </p>
          </div>
        </div>
        <button
          onClick={fetchPendingRequests}
          className={`
            p-2 rounded-lg transition-colors
            ${
              isDarkMode
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
            }
          `}
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Empty State */}
      {pendingShipments.length === 0 ? (
        <div
          className={`
          rounded-2xl p-8 text-center
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
        >
          <CheckCircleIcon
            className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-500"
            }`}
          />
          <p
            className={`font-medium ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            No incoming shipments
          </p>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            New shipments will appear here when suppliers assign them to you
          </p>
        </div>
      ) : (
        /* Shipment Cards */
        <div className="space-y-3">
          {pendingShipments.map((shipment) => {
            const statusBadge = getStatusBadge(shipment.status);
            return (
              <div
                key={shipment.shipmentHash}
                className={`
                  rounded-2xl p-5 border transition-all duration-200
                  ${
                    isDarkMode
                      ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700"
                      : "bg-white border-slate-200/50 shadow-sm hover:shadow-md"
                  }
                `}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50"
                      }`}
                    >
                      <BoxIcon
                        className={`w-5 h-5 ${
                          isDarkMode ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {shipment.productName || `Batch ${shipment.batchId}`}
                      </p>
                      <p
                        className={`text-xs font-mono ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {truncateHash(shipment.shipmentHash)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium border
                    ${
                      isDarkMode
                        ? `${statusBadge.bgDark} ${statusBadge.textDark} ${statusBadge.borderDark}`
                        : `${statusBadge.bgLight} ${statusBadge.textLight} ${statusBadge.borderLight}`
                    }
                  `}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Batch ID
                    </p>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {shipment.batchId}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Containers
                    </p>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {shipment.numberOfContainers}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Total Quantity
                    </p>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {shipment.totalQuantity?.toLocaleString() ||
                        shipment.quantity?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Created
                    </p>
                    <p
                      className={`font-medium text-sm ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {formatDate(shipment.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Stakeholders Row */}
                <div
                  className={`
                  grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl
                  ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                `}
                >
                  {/* Supplier Info */}
                  <div className="flex items-center gap-2">
                    <UserIcon
                      className={`w-4 h-4 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Supplier:
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {truncateHash(shipment.supplierWallet)}
                    </span>
                  </div>

                  {/* Transporter Info */}
                  <div className="flex items-center gap-2">
                    <TruckIcon
                      className={`w-4 h-4 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Transporter:
                    </span>
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {shipment.assignedTransporter?.name ||
                        shipment.transporterName ||
                        "Not assigned"}
                    </span>
                  </div>
                </div>

                {/* Blockchain Info (if locked) */}
                {shipment.txHash && (
                  <div
                    className={`
                    mt-3 flex items-center gap-2 text-xs
                    ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}
                  `}
                  >
                    <span>🔗</span>
                    <span>
                      Locked on blockchain: {truncateHash(shipment.txHash)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingShipmentRequests;
