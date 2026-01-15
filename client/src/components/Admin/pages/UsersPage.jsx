import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  UsersIcon,
  BoxIcon,
  TruckIcon,
  WarehouseIcon,
  ShieldCheckIcon,
  SearchIcon,
  EyeIcon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
} from "../icons/Icons";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const UsersPage = () => {
  const { isDarkMode } = useTheme();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Copy wallet address to clipboard
  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Role configuration
  const roleConfig = {
    supplier: {
      label: "Supplier",
      icon: BoxIcon,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500",
    },
    transporter: {
      label: "Transporter",
      icon: TruckIcon,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500",
    },
    warehouse: {
      label: "Warehouse",
      icon: WarehouseIcon,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500",
    },
    retailer: {
      label: "Retailer",
      icon: ShieldCheckIcon,
      color: "from-rose-500 to-red-500",
      bgColor: "bg-rose-500",
    },
  };

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        // Filter out admin users
        const nonAdminUsers = data.users.filter(
          (user) => user.role !== "admin"
        );
        setUsers(nonAdminUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  // Calculate role counts
  const getRoleCounts = () => {
    const counts = {
      supplier: 0,
      transporter: 0,
      warehouse: 0,
      retailer: 0,
    };

    users.forEach((user) => {
      if (counts.hasOwnProperty(user.role)) {
        counts[user.role]++;
      }
    });

    return Object.entries(roleConfig).map(([role, config]) => ({
      role: config.label,
      roleKey: role,
      count: counts[role],
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor,
    }));
  };

  const usersByRole = getRoleCounts();
  const totalUsers = users.length;

  const handleViewActivity = (userId) => {
    console.log("Viewing activity for user:", userId);
    // Handle navigation to user activity
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const colors = {
      supplier: isDarkMode
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-50 text-blue-600",
      transporter: isDarkMode
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
      warehouse: isDarkMode
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",
      retailer: isDarkMode
        ? "bg-rose-500/10 text-rose-400"
        : "bg-rose-50 text-rose-600",
    };
    return colors[role] || colors.supplier;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl p-6 ${
          isDarkMode
            ? "bg-red-900/20 border border-red-800"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <p className={isDarkMode ? "text-red-400" : "text-red-600"}>
          Error loading users: {error}
        </p>
      </div>
    );
  }

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
            Users
          </h1>
          <p
            className={`mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manage users in the Sentinel network
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className={`
          rounded-2xl p-6
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div className="relative">
          <SearchIcon
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search user by name, email, wallet address or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-12 pr-4 py-3 rounded-xl text-sm
              transition-all duration-200
              ${
                isDarkMode
                  ? "bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:border-blue-500"
                  : "bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-blue-500"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            `}
          />
        </div>
      </div>

      {/* Network Users by Role */}
      <div
        className={`
          rounded-2xl p-6
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-blue-500 to-cyan-500
              `}
            >
              <UsersIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Total Users by Role
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Users joined Sentinel network
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {totalUsers.toLocaleString()}
            </span>
            <span
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {usersByRole.map((roleData, index) => {
            const IconComponent = roleData.icon;
            const percentage =
              totalUsers > 0
                ? ((roleData.count / totalUsers) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={index}
                className={`
                  p-4 rounded-xl transition-all duration-200
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 hover:bg-slate-800"
                      : "bg-slate-50 hover:bg-slate-100"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${roleData.color}
                    `}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isDarkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <h4
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {roleData.count}
                </h4>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {roleData.role}s
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Network Users Table */}
      <div
        className={`
          rounded-2xl p-6
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-green-500 to-emerald-500
              `}
            >
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                All Network Users
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {filteredUsers.length} users{" "}
                {searchQuery && `matching "${searchQuery}"`}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`
                  text-left text-xs font-medium uppercase tracking-wider
                  ${isDarkMode ? "text-slate-400" : "text-slate-500"}
                `}
              >
                <th className="pb-4 pr-4">Name</th>
                <th className="pb-4 pr-4">Organization</th>
                <th className="pb-4 pr-4">Wallet Address</th>
                <th className="pb-4 pr-4">Role</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Joined At</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-slate-700/30" : "divide-slate-200"
              }`}
            >
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id || user.walletAddress}
                    className={`
                      transition-colors
                      ${
                        isDarkMode
                          ? "hover:bg-slate-800/50"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    <td className="py-4 pr-4">
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {user.fullName || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {user.organizationName || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            font-mono text-xs px-2 py-1 rounded-lg
                            ${
                              isDarkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }
                          `}
                          title={user.walletAddress}
                        >
                          {truncateAddress(user.walletAddress)}
                        </span>
                        {user.walletAddress && (
                          <button
                            onClick={() => copyToClipboard(user.walletAddress)}
                            className={`
                              p-1.5 rounded-lg transition-all duration-200
                              ${
                                copiedAddress === user.walletAddress
                                  ? isDarkMode
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-green-100 text-green-600"
                                  : isDarkMode
                                  ? "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                                  : "bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700"
                              }
                            `}
                            title={
                              copiedAddress === user.walletAddress
                                ? "Copied!"
                                : "Copy address"
                            }
                          >
                            {copiedAddress === user.walletAddress ? (
                              <CheckIcon className="w-3.5 h-3.5" />
                            ) : (
                              <CopyIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium capitalize
                          ${getRoleBadge(user.role)}
                        `}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${
                            user.status === "ACTIVE"
                              ? isDarkMode
                                ? "bg-green-500/10 text-green-400"
                                : "bg-green-50 text-green-600"
                              : isDarkMode
                              ? "bg-red-500/10 text-red-400"
                              : "bg-red-50 text-red-600"
                          }
                        `}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {formatDate(user.approvedAt || user.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleViewActivity(user._id)}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            isDarkMode
                              ? "bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-blue-300"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }
                        `}
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    <p
                      className={`${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {searchQuery
                        ? "No users found matching your search."
                        : "No users found in the network."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
