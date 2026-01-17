/**
 * ManageShipmentPage Component
 *
 * Dedicated page for managing a warehouse shipment:
 * - Scan containers with QR codes
 * - Raise concerns about shipments
 * - Update shipment status when all containers scanned
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  WarehouseThemeProvider,
  useWarehouseTheme,
} from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  getShipmentContainers,
  scanContainerForWarehouse,
} from "../../../services/scanApi";
import {
  fetchWarehouseShipments,
  updateShipmentStatus,
} from "../../../services/shipmentApi";
import SimpleQRScanner from "../components/SimpleQRScanner";
import Header from "../layout/Header";
import {
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshIcon,
  QRCodeIcon,
  AlertTriangleIcon,
  UserIcon,
} from "../icons/Icons";

// Back Arrow Icon
const ArrowLeftIcon = ({ className = "w-6 h-6" }) => (
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
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
    />
  </svg>
);

// Rocket/Launch Icon for Update Status
const RocketIcon = ({ className = "w-6 h-6" }) => (
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
      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
    />
  </svg>
);

const ManageShipmentContent = () => {
  const { shipmentHash } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();

  // State
  const [shipment, setShipment] = useState(null);
  const [containerStats, setContainerStats] = useState({
    total: 0,
    scanned: 0,
    inTransit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("scan"); // "scan" or "concern"

  // Concern form state
  const [concernType, setConcernType] = useState("");
  const [concernDescription, setConcernDescription] = useState("");
  const [concernSubmitting, setConcernSubmitting] = useState(false);
  const [concernSuccess, setConcernSuccess] = useState(false);

  // Update status state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  // Fetch shipment details
  const fetchShipmentDetails = useCallback(async () => {
    if (!user?.walletAddress || !shipmentHash) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all warehouse shipments and find the one we need
      const { shipments } = await fetchWarehouseShipments(user.walletAddress);
      const found = shipments.find((s) => s.shipmentHash === shipmentHash);

      if (!found) {
        setError("Shipment not found");
        return;
      }

      setShipment(found);

      // Fetch container stats
      await refreshContainerStats();
    } catch (err) {
      console.error("Error fetching shipment:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.walletAddress, shipmentHash]);

  // Refresh container stats
  const refreshContainerStats = async () => {
    try {
      const result = await getShipmentContainers(shipmentHash);
      if (result.success && result.containers) {
        const warehouseScannedCount = result.containers.filter(
          (c) => c.status === "AT_WAREHOUSE",
        ).length;
        const inTransitCount = result.containers.filter(
          (c) => c.status === "IN_TRANSIT",
        ).length;

        setContainerStats({
          total: result.containers.length,
          scanned: warehouseScannedCount,
          inTransit: inTransitCount,
        });

        console.log("Container stats updated:", {
          total: result.containers.length,
          scanned: warehouseScannedCount,
          inTransit: inTransitCount,
        });
      }
    } catch (err) {
      console.error("Error fetching container stats:", err);
    }
  };

  useEffect(() => {
    fetchShipmentDetails();
  }, [fetchShipmentDetails]);

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!shipment || containerStats.scanned !== containerStats.total) return;

    setIsUpdatingStatus(true);
    try {
      // Update shipment status to "at_warehouse" or "received"
      const response = await updateShipmentStatus(shipmentHash, "at_warehouse");

      if (response.success) {
        setStatusUpdateSuccess(true);
        // Refresh shipment details
        await fetchShipmentDetails();
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle concern submission
  const handleSubmitConcern = async () => {
    if (!concernType || !concernDescription.trim()) return;

    setConcernSubmitting(true);
    try {
      // TODO: Call API to submit concern
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Concern submitted:", {
        shipmentHash,
        type: concernType,
        description: concernDescription,
      });

      setConcernSuccess(true);
      setConcernType("");
      setConcernDescription("");
    } catch (err) {
      console.error("Error submitting concern:", err);
    } finally {
      setConcernSubmitting(false);
    }
  };

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
    const statusMap = {
      created: {
        label: "New Request",
        bgDark: "bg-blue-500/10",
        bgLight: "bg-blue-50",
        textDark: "text-blue-400",
        textLight: "text-blue-600",
      },
      in_transit: {
        label: "In Transit",
        bgDark: "bg-emerald-500/10",
        bgLight: "bg-emerald-50",
        textDark: "text-emerald-400",
        textLight: "text-emerald-600",
      },
      at_warehouse: {
        label: "At Warehouse",
        bgDark: "bg-purple-500/10",
        bgLight: "bg-purple-50",
        textDark: "text-purple-400",
        textLight: "text-purple-600",
      },
      ready_for_dispatch: {
        label: "Ready for Dispatch",
        bgDark: "bg-amber-500/10",
        bgLight: "bg-amber-50",
        textDark: "text-amber-400",
        textLight: "text-amber-600",
      },
    };
    return statusMap[status] || statusMap.created;
  };

  // Check if all containers are scanned
  const allContainersScanned =
    containerStats.total > 0 && containerStats.scanned === containerStats.total;
  const scanProgress =
    containerStats.total > 0
      ? Math.round((containerStats.scanned / containerStats.total) * 100)
      : 0;

  if (loading) {
    return (
      <div
        className={`min-h-screen ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div
            className={`
            rounded-2xl p-8 text-center
            ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}
          `}
          >
            <RefreshIcon
              className={`w-8 h-8 mx-auto mb-3 animate-spin ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
            />
            <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
              Loading shipment details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div
        className={`min-h-screen ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div
            className={`
            rounded-2xl p-6
            ${isDarkMode ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}
          `}
          >
            <p className={isDarkMode ? "text-red-400" : "text-red-600"}>
              Error: {error || "Shipment not found"}
            </p>
            <button
              onClick={() => navigate("/warehouse/dashboard")}
              className={`
                mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"}
              `}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(shipment.status);

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/warehouse/dashboard")}
          className={`
            flex items-center gap-2 mb-6 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Incoming Shipments
        </button>

        {/* Shipment Header Card */}
        <div
          className={`
          rounded-2xl p-6 mb-6 border
          ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}
        `}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}
              >
                <BoxIcon
                  className={`w-6 h-6 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                />
              </div>
              <div>
                <h1
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {shipment.productName || `Batch ${shipment.batchId}`}
                </h1>
                <p
                  className={`text-sm font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  {truncateHash(shipment.shipmentHash)}
                </p>
              </div>
            </div>
            <span
              className={`
              px-4 py-2 rounded-full text-sm font-medium self-start
              ${isDarkMode ? statusBadge.bgDark + " " + statusBadge.textDark : statusBadge.bgLight + " " + statusBadge.textLight}
            `}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p
                className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              >
                Batch ID
              </p>
              <p
                className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {shipment.batchId}
              </p>
            </div>
            <div>
              <p
                className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              >
                Containers
              </p>
              <p
                className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {shipment.numberOfContainers}
              </p>
            </div>
            <div>
              <p
                className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              >
                Total Quantity
              </p>
              <p
                className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {shipment.totalQuantity?.toLocaleString() ||
                  shipment.quantity?.toLocaleString()}
              </p>
            </div>
            <div>
              <p
                className={`text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              >
                Created
              </p>
              <p
                className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                {formatDate(shipment.createdAt)}
              </p>
            </div>
          </div>

          {/* Stakeholders */}
          <div
            className={`
            grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl
            ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
          `}
          >
            <div className="flex items-center gap-2">
              <UserIcon
                className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              />
              <span
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Supplier:
              </span>
              <span
                className={`text-sm font-mono ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                {truncateHash(shipment.supplierWallet)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TruckIcon
                className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              />
              <span
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Transporter:
              </span>
              <span
                className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                {shipment.assignedTransporter?.name ||
                  shipment.transporterName ||
                  "Not assigned"}
              </span>
            </div>
          </div>

          {/* Blockchain Info */}
          {shipment.txHash && (
            <div
              className={`mt-4 flex items-center gap-2 text-xs ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
            >
              <span>🔗</span>
              <span>Locked on blockchain: {truncateHash(shipment.txHash)}</span>
            </div>
          )}
        </div>

        {/* Scan Progress Card */}
        <div
          className={`
          rounded-2xl p-6 mb-6 border
          ${
            allContainersScanned
              ? isDarkMode
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-emerald-50 border-emerald-200"
              : isDarkMode
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
          }
        `}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  allContainersScanned
                    ? isDarkMode
                      ? "bg-emerald-500/20"
                      : "bg-emerald-100"
                    : isDarkMode
                      ? "bg-blue-500/10"
                      : "bg-blue-50"
                }`}
              >
                {allContainersScanned ? (
                  <CheckCircleIcon
                    className={`w-6 h-6 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                ) : (
                  <QRCodeIcon
                    className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  />
                )}
              </div>
              <div>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Scan Progress
                </p>
                <p
                  className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {containerStats.scanned}{" "}
                  <span
                    className={`text-lg font-normal ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                  >
                    / {containerStats.total}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="w-32 md:w-48">
                <div
                  className={`h-3 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      allContainersScanned ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p
                  className={`text-xs mt-1 text-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  {scanProgress}% Complete
                </p>
              </div>

              {/* Update Status Button - Only show when all scanned */}
              {allContainersScanned &&
                !statusUpdateSuccess &&
                shipment.status !== "at_warehouse" && (
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all
                    ${
                      isUpdatingStatus
                        ? "bg-slate-600 text-slate-400 cursor-wait"
                        : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                    }
                  `}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <RefreshIcon className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RocketIcon className="w-5 h-5" />
                        Update Status
                      </>
                    )}
                  </button>
                )}

              {statusUpdateSuccess && (
                <span
                  className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  ${isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"}
                `}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Status Updated!
                </span>
              )}
            </div>
          </div>

          {/* In Transit Notice */}
          {containerStats.inTransit > 0 && (
            <div
              className={`
              mt-4 flex items-center gap-2 p-3 rounded-lg text-sm
              ${isDarkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"}
            `}
            >
              <TruckIcon className="w-4 h-4" />
              {containerStats.inTransit} container
              {containerStats.inTransit !== 1 ? "s" : ""} in transit (scanned by
              transporter, awaiting warehouse scan)
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          className={`
          rounded-2xl border overflow-hidden
          ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}
        `}
        >
          {/* Tab Navigation */}
          <div
            className={`flex border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}
          >
            <button
              onClick={() => setActiveTab("scan")}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === "scan"
                    ? isDarkMode
                      ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5"
                      : "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                    : isDarkMode
                      ? "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <QRCodeIcon className="w-5 h-5" />
              Scan Containers
            </button>
            <button
              onClick={() => setActiveTab("concern")}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === "concern"
                    ? isDarkMode
                      ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                      : "text-amber-600 border-b-2 border-amber-600 bg-amber-50/50"
                    : isDarkMode
                      ? "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <AlertTriangleIcon className="w-5 h-5" />
              Raise Concern
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Scan Tab */}
            {activeTab === "scan" && (
              <SimpleQRScanner
                shipmentHash={shipmentHash}
                onScanSuccess={(result) => {
                  console.log("Scan success:", result);
                  refreshContainerStats();
                }}
                onScanError={(error) => console.error("Scan error:", error)}
              />
            )}

            {/* Concern Tab */}
            {activeTab === "concern" && (
              <div className="space-y-6">
                {concernSuccess ? (
                  <div
                    className={`
                    p-6 rounded-xl text-center
                    ${isDarkMode ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}
                  `}
                  >
                    <CheckCircleIcon
                      className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                    />
                    <h3
                      className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}
                    >
                      Concern Submitted
                    </h3>
                    <p
                      className={`text-sm ${isDarkMode ? "text-emerald-400/70" : "text-emerald-600"}`}
                    >
                      Your concern has been recorded and will be reviewed.
                    </p>
                    <button
                      onClick={() => setConcernSuccess(false)}
                      className={`
                        mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          isDarkMode
                            ? "bg-slate-800 text-white hover:bg-slate-700"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }
                      `}
                    >
                      Submit Another Concern
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Concern Type Selection */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Concern Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          {
                            value: "damaged",
                            label: "Damaged Goods",
                            icon: "📦",
                          },
                          {
                            value: "missing",
                            label: "Missing Items",
                            icon: "❓",
                          },
                          {
                            value: "quantity",
                            label: "Quantity Mismatch",
                            icon: "🔢",
                          },
                          {
                            value: "quality",
                            label: "Quality Issue",
                            icon: "⚠️",
                          },
                          {
                            value: "documentation",
                            label: "Documentation Issue",
                            icon: "📄",
                          },
                          { value: "other", label: "Other", icon: "💬" },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setConcernType(type.value)}
                            className={`
                              flex items-center gap-2 p-4 rounded-xl border text-left text-sm font-medium transition-all
                              ${
                                concernType === type.value
                                  ? isDarkMode
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                    : "bg-amber-50 border-amber-300 text-amber-700"
                                  : isDarkMode
                                    ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }
                            `}
                          >
                            <span className="text-xl">{type.icon}</span>
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={concernDescription}
                        onChange={(e) => setConcernDescription(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        rows={5}
                        className={`
                          w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors
                          ${
                            isDarkMode
                              ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500"
                              : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500"
                          }
                          focus:outline-none focus:ring-2 focus:ring-amber-500/20
                        `}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitConcern}
                      disabled={
                        !concernType ||
                        !concernDescription.trim() ||
                        concernSubmitting
                      }
                      className={`
                        w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all
                        ${
                          !concernType ||
                          !concernDescription.trim() ||
                          concernSubmitting
                            ? isDarkMode
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25"
                        }
                      `}
                    >
                      {concernSubmitting ? (
                        <>
                          <RefreshIcon className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <AlertTriangleIcon className="w-5 h-5" />
                          Submit Concern
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component with theme provider
const ManageShipmentPage = () => {
  return (
    <WarehouseThemeProvider>
      <ManageShipmentContent />
    </WarehouseThemeProvider>
  );
};

export default ManageShipmentPage;
