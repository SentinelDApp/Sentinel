import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  SearchIcon,
  BoxIcon,
  TruckIcon,
  WarehouseIcon,
  ShieldCheckIcon,
} from "../icons/Icons";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const roleIcons = {
  SUPPLIER: BoxIcon,
  TRANSPORTER: TruckIcon,
  WAREHOUSE: WarehouseIcon,
  RETAILER: ShieldCheckIcon,
};

const roleColors = {
  SUPPLIER: "from-blue-500 to-cyan-500",
  TRANSPORTER: "from-purple-500 to-pink-500",
  WAREHOUSE: "from-amber-500 to-orange-500",
  RETAILER: "from-green-500 to-emerald-500",
};

// Document type labels for display
const documentTypeLabels = {
  org_certificate: "Organization Registration Certificate",
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  passport: "Passport",
  voter_id: "Voter ID Card",
};

const RequestsPage = () => {
  const { isDarkMode } = useTheme();
  const { authFetch, getAuthHeaders } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  
  // Image preview modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewRequest, setPreviewRequest] = useState(null);

  // Common rejection reasons
  const commonReasons = [
    "Invalid or unclear verification document",
    "Document does not match provided information",
    "Incomplete application details",
    "Suspicious or fraudulent activity detected",
    "Organization not verified",
    "Duplicate registration attempt",
    "Other (specify below)"
  ];

  // Fetch requests from backend with authentication
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/requests?status=${statusFilter}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch requests");
      }
      const data = await response.json();
      setRequests(data.requests || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Handle approve action
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      const response = await authFetch(`${API_BASE_URL}/api/admin/approve/${id}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve request");
      }

      // Refresh the list
      await fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject action
  const handleReject = async (id, reason = "") => {
    if (!reason.trim()) {
      alert("Rejection reason is required");
      return;
    }
    
    try {
      setProcessingId(id);
      const response = await authFetch(`${API_BASE_URL}/api/admin/reject/${id}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
      }

      // Refresh the list
      await fetchRequests();
      setSelectedRequest(null);
      closeRejectModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Open rejection modal
  const openRejectModal = (request) => {
    setRejectingRequest(request);
    setRejectionReason("");
    setCustomReason("");
    setShowRejectModal(true);
  };

  // Close rejection modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingRequest(null);
    setRejectionReason("");
    setCustomReason("");
  };

  // Submit rejection
  const submitRejection = () => {
    const finalReason = rejectionReason === "Other (specify below)" 
      ? customReason 
      : rejectionReason;
    
    if (!finalReason.trim()) {
      alert("Please select or enter a rejection reason");
      return;
    }
    
    handleReject(rejectingRequest._id, finalReason);
  };

  // Filter requests by search
  const filteredRequests = requests.filter(
    (req) =>
      req.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedRole?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toUpperCase();
    const styles = {
      PENDING: isDarkMode
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-amber-50 text-amber-600 border-amber-200",
      APPROVED: isDarkMode
        ? "bg-green-500/10 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-600 border-green-200",
      REJECTED: isDarkMode
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-600 border-red-200",
    };
    return styles[normalizedStatus] || styles.PENDING;
  };

  const getRoleBadge = (role) => {
    const colors = {
      SUPPLIER: isDarkMode
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-50 text-blue-600",
      TRANSPORTER: isDarkMode
        ? "bg-purple-500/10 text-purple-400"
        : "bg-purple-50 text-purple-600",
      WAREHOUSE: isDarkMode
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
      RETAILER: isDarkMode
        ? "bg-green-500/10 text-green-400"
        : "bg-green-50 text-green-600",
    };
    return colors[role] || colors.SUPPLIER;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl lg:text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Stakeholder Requests
          </h1>
          <p
            className={`mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Review and manage registration requests
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className={`
            px-4 py-2 rounded-xl font-medium transition-all
            ${
              isDarkMode
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-white text-slate-900 hover:bg-slate-50 shadow-sm"
            }
          `}
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Requests",
            value: requests.length,
            color: "from-blue-500 to-cyan-500",
            icon: UsersIcon,
          },
          {
            label: "Pending",
            value: requests.filter((r) => r.status?.toUpperCase() === "PENDING").length,
            color: "from-amber-500 to-orange-500",
            icon: ClockIcon,
          },
          {
            label: "Approved",
            value: requests.filter((r) => r.status?.toUpperCase() === "APPROVED").length,
            color: "from-green-500 to-emerald-500",
            icon: CheckCircleIcon,
          },
          {
            label: "Rejected",
            value: requests.filter((r) => r.status?.toUpperCase() === "REJECTED").length,
            color: "from-red-500 to-rose-500",
            icon: XCircleIcon,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`
                p-4 rounded-2xl transition-all
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border border-slate-800/50"
                    : "bg-white border border-slate-200/50 shadow-sm"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search by name, wallet, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-12 pr-4 py-3 rounded-xl transition-all
              ${
                isDarkMode
                  ? "bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500"
                  : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            `}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {["all", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        /* Requests Table */
        <div
          className={`
            rounded-2xl overflow-hidden
            ${
              isDarkMode
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`
                    text-left text-xs font-medium uppercase tracking-wider
                    ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                  `}
                >
                  <th
                    className={`px-6 py-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Stakeholder
                  </th>
                  <th
                    className={`px-6 py-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Wallet Address
                  </th>
                  <th
                    className={`px-6 py-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Role
                  </th>
                  <th
                    className={`px-6 py-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Requested At
                  </th>
                  <th
                    className={`px-6 py-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-right ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-slate-800" : "divide-slate-100"
                }`}
              >
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => {
                    const roleKey = request.requestedRole?.toUpperCase();
                    const RoleIcon = roleIcons[roleKey] || BoxIcon;
                    return (
                      <tr
                        key={request._id}
                        className={`
                          transition-colors
                          ${
                            isDarkMode
                              ? "hover:bg-slate-800/50"
                              : "hover:bg-slate-50"
                          }
                        `}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                                roleColors[roleKey] ||
                                "from-slate-500 to-slate-600"
                              }`}
                            >
                              <RoleIcon className="w-5 h-5 text-white" />
                            </div>
                            <span
                              className={`font-medium ${
                                isDarkMode ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {request.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code
                            className={`text-xs px-2 py-1 rounded-lg ${
                              isDarkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {request.walletAddress.slice(0, 6)}...
                            {request.walletAddress.slice(-4)}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                              roleKey
                            )}`}
                          >
                            {request.requestedRole?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {formatDate(request.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Document - Only show for pending requests with documents */}
                            {request.verificationDocumentPath && (
                              <button
                                onClick={() => {
                                  const imageUrl = request.verificationDocumentPath?.startsWith('http') 
                                    ? request.verificationDocumentPath 
                                    : `${API_BASE_URL}/${request.verificationDocumentPath}`;
                                  setPreviewImage(imageUrl);
                                  setPreviewRequest(request);
                                  setShowImageModal(true);
                                }}
                                className={`
                                  p-2 rounded-lg transition-all
                                  ${
                                    isDarkMode
                                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  }
                                `}
                                title="View Document"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                            )}

                            {/* Actions for Pending */}
                            {request.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApprove(request._id)
                                  }
                                  disabled={processingId === request._id}
                                  className={`
                                    p-2 rounded-lg transition-all
                                    ${
                                      processingId === request._id
                                        ? "opacity-50 cursor-not-allowed"
                                        : "text-green-400 hover:bg-green-500/10"
                                    }
                                  `}
                                  title="Approve"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    openRejectModal(request)
                                  }
                                  disabled={processingId === request._id}
                                  className={`
                                    p-2 rounded-lg transition-all
                                    ${
                                      processingId === request._id
                                        ? "opacity-50 cursor-not-allowed"
                                        : "text-red-400 hover:bg-red-500/10"
                                    }
                                  `}
                                  title="Reject"
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <p
                        className={`${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        No requests found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowImageModal(false);
              setPreviewImage(null);
              setPreviewRequest(null);
            }}
          />
          
          {/* Modal */}
          <div className={`
            relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-xl
            ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}
          `}>
            {/* Header */}
            <div className={`
              flex items-center justify-between p-4 border-b
              ${isDarkMode ? "border-slate-800" : "border-slate-200"}
            `}>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Verification Document
                </h3>
                {previewRequest && (
                  <>
                    <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {previewRequest.fullName} • {previewRequest.organizationName || 'No Organization'}
                    </p>
                    <div className={`
                      inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg
                      ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}
                    `}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {documentTypeLabels[previewRequest.documentType] || previewRequest.documentType || 'Unknown Document'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setPreviewImage(null);
                  setPreviewRequest(null);
                }}
                className={`
                  p-2 rounded-lg transition-all
                  ${isDarkMode 
                    ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }
                `}
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Image Container */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
              <img
                src={previewImage}
                alt="Verification Document"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Failed to load image';
                  e.target.className = 'text-red-500';
                }}
              />
            </div>

            {/* Footer with request details */}
            {previewRequest && (
              <div className={`
                p-4 border-t
                ${isDarkMode ? "border-slate-800 bg-slate-800/50" : "border-slate-200 bg-slate-50"}
              `}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Wallet</p>
                    <p className={`font-mono text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {previewRequest.walletAddress?.slice(0, 10)}...{previewRequest.walletAddress?.slice(-8)}
                    </p>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Role</p>
                    <p className={isDarkMode ? "text-white" : "text-slate-900"}>
                      {previewRequest.requestedRole?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Submitted</p>
                    <p className={isDarkMode ? "text-white" : "text-slate-900"}>
                      {formatDate(previewRequest.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(previewRequest.status)}`}>
                      {previewRequest.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeRejectModal}
          />
          
          {/* Modal */}
          <div className={`
            relative w-full max-w-md rounded-2xl p-6 shadow-xl
            ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}
          `}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Reject Request
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {rejectingRequest.fullName}
                </p>
              </div>
            </div>

            {/* Common Reasons */}
            <div className="space-y-2 mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Select a reason
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commonReasons.map((reason, index) => (
                  <label
                    key={index}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                      ${rejectionReason === reason 
                        ? isDarkMode 
                          ? "bg-red-500/10 border border-red-500/30" 
                          : "bg-red-50 border border-red-200"
                        : isDarkMode 
                          ? "bg-slate-800/50 border border-slate-700 hover:border-slate-600" 
                          : "bg-slate-50 border border-slate-200 hover:border-slate-300"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-4 h-4 text-red-500 focus:ring-red-500"
                    />
                    <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            {rejectionReason === "Other (specify below)" && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Custom reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your rejection reason..."
                  rows={3}
                  className={`
                    w-full px-4 py-3 rounded-xl transition-all resize-none
                    ${isDarkMode 
                      ? "bg-slate-800 border border-slate-700 text-white placeholder-slate-500" 
                      : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400"
                    }
                    focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                  `}
                />
              </div>
            )}

            {/* Warning */}
            <div className={`
              flex items-start gap-3 p-3 rounded-xl mb-6
              ${isDarkMode ? "bg-amber-500/10" : "bg-amber-50"}
            `}>
              <ClockIcon className={`w-5 h-5 mt-0.5 ${isDarkMode ? "text-amber-400" : "text-amber-500"}`} />
              <p className={`text-sm ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                This will permanently delete the request and uploaded document. The user can re-apply later.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                className={`
                  flex-1 py-3 rounded-xl font-medium transition-all
                  ${isDarkMode 
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }
                `}
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={processingId === rejectingRequest._id || (!rejectionReason || (rejectionReason === "Other (specify below)" && !customReason.trim()))}
                className={`
                  flex-1 py-3 rounded-xl font-medium transition-all
                  ${processingId === rejectingRequest._id || (!rejectionReason || (rejectionReason === "Other (specify below)" && !customReason.trim()))
                    ? "bg-red-500/50 text-white/50 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                  }
                `}
              >
                {processingId === rejectingRequest._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Rejecting...
                  </span>
                ) : (
                  "Reject Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;