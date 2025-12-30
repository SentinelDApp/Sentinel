import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  UsersIcon,
  BoxIcon,
  TruckIcon,
  WarehouseIcon,
  ShieldCheckIcon,
  ChartIcon,
  SearchIcon,
  EyeIcon,
  ClockIcon,
} from "../icons/Icons";

// Users by role data
const usersByRole = [
  {
    role: "Supplier",
    count: 113,
    icon: BoxIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500",
  },
  {
    role: "Transporter",
    count: 156,
    icon: TruckIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500",
  },
  {
    role: "Warehouse",
    count: 67,
    icon: WarehouseIcon,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500",
  },
  {
    role: "Retailer",
    count: 312,
    icon: ShieldCheckIcon,
    color: "from-rose-500 to-red-500",
    bgColor: "bg-rose-500",
  },
];

// Recently joined approved users
const recentlyJoinedUsers = [
  {
    id: "USR-001",
    name: "John Smith",
    hashId: "0x7a9f3b2c1d8e4f5a6b7c8d9e0f1a2b3c",
    role: "Supplier",
    joinedAt: "2025-12-27 14:30:00",
    status: "approved",
  },
];

const UsersPage = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleViewActivity = (userId) => {
    console.log("Viewing activity for user:", userId);
    // Handle navigation to user activity
  };

  const filteredUsers = recentlyJoinedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.hashId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const colors = {
      Supplier: isDarkMode
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-50 text-blue-600",
      Transporter: isDarkMode
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
      Warehouse: isDarkMode
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",
      Retailer: isDarkMode
        ? "bg-rose-500/10 text-rose-400"
        : "bg-rose-50 text-rose-600",
    };
    return colors[role] || colors.Supplier;
  };

  const totalUsers = usersByRole.reduce((sum, r) => sum + r.count, 0);

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
            placeholder="Search user by name or ID..."
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {usersByRole.map((roleData, index) => {
            const IconComponent = roleData.icon;
            const percentage = ((roleData.count / totalUsers) * 100).toFixed(1);

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

      {/* Recently Joined Approved Users Table */}
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
                Recently Joined Users
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Approved users in the network
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
                <th className="pb-4 pr-4">User ID</th>
                <th className="pb-4 pr-4">Name</th>
                <th className="pb-4 pr-4">Hash ID</th>
                <th className="pb-4 pr-4">Role</th>
                <th className="pb-4 pr-4">Joined At</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
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
                        className={`font-mono text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {user.id}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {user.name}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          font-mono text-xs px-2 py-1 rounded-lg truncate max-w-[150px] inline-block
                          ${
                            isDarkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-700"
                          }
                        `}
                        title={user.hashId}
                      >
                        {user.hashId.slice(0, 10)}...{user.hashId.slice(-6)}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${getRoleBadge(user.role)}
                        `}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {user.joinedAt}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleViewActivity(user.id)}
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
                        View Activity
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center">
                    <p
                      className={`${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No users found matching your search.
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
