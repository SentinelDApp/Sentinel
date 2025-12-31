import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon } from "../icons/Icons";

// Toggle component defined outside SettingsPage
const Toggle = ({ enabled, onChange, isDarkMode }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`
      relative w-11 h-6 rounded-full transition-colors
      ${enabled
        ? "bg-emerald-500"
        : isDarkMode ? "bg-slate-700" : "bg-slate-300"
      }
    `}
  >
    <div
      className={`
        absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
        ${enabled ? "translate-x-5" : "translate-x-0"}
      `}
    />
  </button>
);

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoVerify, setAutoVerify] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-500/10" : "bg-slate-100"}`}>
            <CogIcon className={`w-6 h-6 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Settings
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Manage your warehouse dashboard preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div
          className={`
            rounded-2xl p-6
            ${isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <UserIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} />
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Profile
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Name
              </label>
              <input
                type="text"
                defaultValue="Warehouse Admin"
                className={`
                  w-full px-4 py-2 rounded-lg border outline-none
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                  }
                `}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Email
              </label>
              <input
                type="email"
                defaultValue="warehouse@sentinel.io"
                className={`
                  w-full px-4 py-2 rounded-lg border outline-none
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                  }
                `}
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div
          className={`
            rounded-2xl p-6
            ${isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} />
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Appearance
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={isDarkMode ? "text-white" : "text-slate-900"}>Dark Mode</p>
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Toggle dark/light theme
              </p>
            </div>
            <Toggle enabled={isDarkMode} onChange={toggleTheme} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Notifications Section */}
        <div
          className={`
            rounded-2xl p-6
            ${isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <BellIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} />
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Notifications
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={isDarkMode ? "text-white" : "text-slate-900"}>Push Notifications</p>
                <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Receive push notifications for alerts
                </p>
              </div>
              <Toggle enabled={notifications} onChange={setNotifications} isDarkMode={isDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={isDarkMode ? "text-white" : "text-slate-900"}>Email Alerts</p>
                <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Receive email alerts for critical issues
                </p>
              </div>
              <Toggle enabled={emailAlerts} onChange={setEmailAlerts} isDarkMode={isDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={isDarkMode ? "text-white" : "text-slate-900"}>Auto-Verify</p>
                <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Automatically verify matching shipments
                </p>
              </div>
              <Toggle enabled={autoVerify} onChange={setAutoVerify} isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          className={`
            w-full py-3 rounded-xl font-medium transition-all
            bg-gradient-to-r from-emerald-500 to-teal-500 text-white
            hover:from-emerald-600 hover:to-teal-600
          `}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
