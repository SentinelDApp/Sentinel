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

const API_BASE_URL = "http://localhost:5000";

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
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
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
            value: requests.filter((r) => r.status === "Pending").length,
            color: "from-amber-500 to-orange-500",
            icon: ClockIcon,
          },
          {
            label: "Approved",
            value: requests.filter((r) => r.status === "Approved").length,
            color: "from-green-500 to-emerald-500",
            icon: CheckCircleIcon,
          },
          {
            label: "Rejected",
            value: requests.filter((r) => r.status === "Rejected").length,
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
                            {/* View Document */}
                            <a
                              href={request.verificationDocumentPath?.startsWith('http') 
                                ? request.verificationDocumentPath 
                                : `${API_BASE_URL}/${request.verificationDocumentPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
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
                            </a>

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
                                    handleReject(request._id)
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
    </div>
  );
};

export default RequestsPage;