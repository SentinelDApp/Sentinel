/**
 * ProfileSettingsPage Component
 * Profile settings page for retailer role showing profile details
 * with editable profile name (stored locally, not in database)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RetailerThemeProvider,
  useRetailerTheme,
} from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import Header from "../layout/Header";
import { UserIcon, ChevronLeftIcon } from "../icons/Icons";

// Profile Settings Content
function ProfileSettingsContent() {
  const { isDarkMode } = useRetailerTheme();
  const { user, walletAddress } = useAuth();
  const navigate = useNavigate();

  // Get default profile name from user data
  const defaultProfileName =
    user?.fullName || user?.organizationName || "Retailer";

  // Profile name state - stored in localStorage, not database
  const [profileName, setProfileName] = useState(() => {
    const saved = localStorage.getItem("retailer_profile_name");
    return saved || defaultProfileName;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profileName);

  // Save profile name to localStorage when changed
  useEffect(() => {
    localStorage.setItem("retailer_profile_name", profileName);
  }, [profileName]);

  const handleSaveProfileName = () => {
    if (tempProfileName.trim()) {
      setProfileName(tempProfileName.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setTempProfileName(profileName);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    setProfileName(defaultProfileName);
    setTempProfileName(defaultProfileName);
    setIsEditing(false);
  };

  // Format wallet address for display
  const formatWallet = (address) => {
    if (!address) return "Not connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/retailer/dashboard")}
          className={`
            flex items-center gap-2 mb-6 px-3 py-2 rounded-xl transition-colors
            ${
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

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
            className={`mt-1 text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            View and manage your profile information
          </p>
        </div>

        {/* Profile Card */}
        <div
          className={`
          rounded-2xl overflow-hidden border
          ${
            isDarkMode
              ? "bg-slate-900/60 border-slate-700/50"
              : "bg-white border-slate-200"
          }
        `}
        >
          {/* Profile Header */}
          <div
            className={`
            px-6 py-8 border-b
            ${
              isDarkMode
                ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-slate-700/50"
                : "bg-gradient-to-r from-cyan-50 to-blue-50 border-slate-200"
            }
          `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                w-20 h-20 rounded-2xl flex items-center justify-center
                ${
                  isDarkMode
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-white border border-slate-200 shadow-sm"
                }
              `}
              >
                <UserIcon
                  className={`w-10 h-10 ${
                    isDarkMode ? "text-cyan-400" : "text-cyan-600"
                  }`}
                />
              </div>
              <div>
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {profileName}
                </h2>
                <div
                  className={`
                  inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm font-medium
                  ${
                    isDarkMode
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-cyan-50 text-cyan-600 border border-cyan-200"
                  }
                `}
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  Retailer
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Profile Name (Editable - Local Only) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Display Name
                </label>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDarkMode
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  Local Only
                </span>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempProfileName}
                    onChange={(e) => setTempProfileName(e.target.value)}
                    className={`
                      flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors border
                      ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500"
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                      }
                    `}
                    placeholder="Enter display name"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveProfileName}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-colors
                      ${
                        isDarkMode
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div
                    className={`
                    flex-1 px-4 py-3 rounded-xl text-sm border
                    ${
                      isDarkMode
                        ? "bg-slate-800/50 border-slate-700/50 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }
                  `}
                  >
                    {profileName}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`
                      ml-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                      ${
                        isDarkMode
                          ? "bg-slate-800 text-cyan-400 hover:bg-slate-700"
                          : "bg-cyan-50 text-cyan-600 hover:bg-cyan-100"
                      }
                    `}
                  >
                    Edit
                  </button>
                </div>
              )}
              <p
                className={`mt-2 text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                This name is stored locally on your device and won't be synced
                to the database.
              </p>
              {profileName !== defaultProfileName && (
                <button
                  onClick={handleResetToDefault}
                  className={`mt-2 text-xs ${
                    isDarkMode
                      ? "text-cyan-400 hover:text-cyan-300"
                      : "text-cyan-600 hover:text-cyan-700"
                  }`}
                >
                  Reset to default ({defaultProfileName})
                </button>
              )}
            </div>

            <div
              className={`h-px ${
                isDarkMode ? "bg-slate-700/50" : "bg-slate-200"
              }`}
            />

            {/* Two Column Grid for Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username (From Database) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Username
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  {user?.fullName || "Not set"}
                </div>
                <p
                  className={`mt-2 text-xs ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  This is your registered username from the database.
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Email Address
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  {user?.email || "Not provided"}
                </div>
              </div>

              {/* Organization Name */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Organization Name
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  {user?.organizationName || "Not provided"}
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Address
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  {user?.address || "Not provided"}
                </div>
              </div>

              {/* Account Role */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Account Role
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border flex items-center gap-2
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  <span className="capitalize">{user?.role || "Retailer"}</span>
                  <span
                    className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      isDarkMode
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }
                  `}
                  >
                    Verified
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Account Status
                </label>
                <div
                  className={`
                  px-4 py-3 rounded-xl text-sm border flex items-center gap-2
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </div>
              </div>
            </div>

            {/* Wallet Address - Full Width */}
            <div className="mt-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Wallet Address
              </label>
              <div
                className={`
                px-4 py-3 rounded-xl text-sm font-mono border flex items-center justify-between
                ${
                  isDarkMode
                    ? "bg-slate-800/50 border-slate-700/50 text-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }
              `}
              >
                <span>{walletAddress || "Not connected"}</span>
                {walletAddress && (
                  <button
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                    className={`
                      ml-2 p-1.5 rounded-lg transition-colors
                      ${
                        isDarkMode
                          ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300"
                          : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                      }
                    `}
                    title="Copy wallet address"
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
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main Component with Theme Provider
function ProfileSettingsPage() {
  return (
    <RetailerThemeProvider>
      <ProfileSettingsContent />
    </RetailerThemeProvider>
  );
}

export default ProfileSettingsPage;
