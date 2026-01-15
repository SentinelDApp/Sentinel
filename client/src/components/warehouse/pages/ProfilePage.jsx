import { useState } from "react";
import { useWarehouseTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

const ProfilePage = () => {
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();

  // Editable username state
  const defaultUsername =
    user?.fullName?.toLowerCase().replace(/\s+/g, "_") || "warehouse_user";
  const [username, setUsername] = useState(defaultUsername);

  const inputClasses = `
    w-full px-4 py-3 rounded-xl text-sm outline-none
    ${
      isDarkMode
        ? "bg-slate-800 text-slate-200 border border-slate-700"
        : "bg-slate-50 text-slate-700 border border-slate-200"
    }
  `;

  const readOnlyClasses = `${inputClasses} cursor-default`;

  const editableClasses = `${inputClasses} focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
    isDarkMode ? "hover:border-slate-600" : "hover:border-slate-300"
  }`;

  const labelClasses = `block text-xs font-medium uppercase tracking-wider mb-2 ${
    isDarkMode ? "text-slate-500" : "text-slate-400"
  }`;

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Profile Settings
        </h1>
        <p
          className={`text-sm mt-1 ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <div
        className={`
        rounded-2xl p-6 lg:p-8
        ${
          isDarkMode
            ? "bg-slate-800/50 border border-slate-700/50"
            : "bg-white border border-slate-200 shadow-sm"
        }
      `}
      >
        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">
              {user?.fullName?.charAt(0)?.toUpperCase() || "W"}
            </span>
          </div>
          <div>
            <h2
              className={`text-xl font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {user?.fullName || "Warehouse User"}
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              @{username}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`
                px-2.5 py-1 rounded-lg text-xs font-medium
                ${
                  isDarkMode
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                }
              `}
              >
                Warehouse
              </span>
              <span
                className={`
                px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5
                ${
                  user?.status === "ACTIVE"
                    ? isDarkMode
                      ? "bg-green-500/15 text-green-400"
                      : "bg-green-50 text-green-600"
                    : isDarkMode
                    ? "bg-red-500/15 text-red-400"
                    : "bg-red-50 text-red-600"
                }
              `}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user?.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {user?.status || "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3
              className={`text-sm font-semibold mb-4 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Full Name</label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/\s+/g, "_")
                    )
                  }
                  className={editableClasses}
                  placeholder="Enter username"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
            </div>
          </div>

          {/* Organization Section */}
          <div>
            <h3
              className={`text-sm font-semibold mb-4 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Organization Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Organization</label>
                <input
                  type="text"
                  value={user?.organizationName || ""}
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Address</label>
                <input
                  type="text"
                  value={user?.address || ""}
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3
              className={`text-sm font-semibold mb-4 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Role</label>
                <input
                  type="text"
                  value="Warehouse"
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Status</label>
                <input
                  type="text"
                  value={user?.status || "Active"}
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Member Since</label>
                <input
                  type="text"
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : user?.approvedAt
                      ? new Date(user.approvedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"
                  }
                  readOnly
                  className={readOnlyClasses}
                />
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div>
            <h3
              className={`text-sm font-semibold mb-4 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Blockchain
            </h3>
            <div>
              <label className={labelClasses}>Wallet Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.walletAddress || ""}
                  readOnly
                  className={`${readOnlyClasses} pr-12 font-mono text-xs`}
                />
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(user?.walletAddress || "")
                  }
                  className={`
                    absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors
                    ${
                      isDarkMode
                        ? "hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    }
                  `}
                  title="Copy"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
