import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  BlockchainIcon,
  CheckCircleIcon,
} from "../icons/Icons";

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    shipmentUpdates: true,
    securityAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const cardClass = isDarkMode
    ? "bg-slate-900/50 border border-slate-800/50"
    : "bg-white border border-slate-200/50 shadow-sm";

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? "bg-blue-500" : isDarkMode ? "bg-slate-700" : "bg-slate-300"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>
          Settings
        </h1>
        <p className={`mt-1 ${textSecondary}`}>
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Appearance Section */}
      <div className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDarkMode ? "bg-purple-500/10" : "bg-purple-50"
          }`}>
            <CogIcon className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
          </div>
          <div>
            <h2 className={`font-semibold ${textPrimary}`}>Appearance</h2>
            <p className={`text-sm ${textSecondary}`}>Customize how the app looks</p>
          </div>
        </div>

        <div className={`flex items-center justify-between py-4 border-t ${
          isDarkMode ? "border-slate-800" : "border-slate-200"
        }`}>
          <div>
            <p className={`font-medium ${textPrimary}`}>Dark Mode</p>
            <p className={`text-sm ${textSecondary}`}>Use dark theme across the application</p>
          </div>
          <ToggleSwitch enabled={isDarkMode} onChange={toggleTheme} />
        </div>
      </div>

      {/* Notifications Section */}
      <div className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
          }`}>
            <BellIcon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <div>
            <h2 className={`font-semibold ${textPrimary}`}>Notifications</h2>
            <p className={`text-sm ${textSecondary}`}>Configure notification preferences</p>
          </div>
        </div>

        <div className="space-y-1">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "push", label: "Push Notifications", desc: "Browser push notifications" },
            { key: "shipmentUpdates", label: "Shipment Updates", desc: "Get notified about shipment status changes" },
            { key: "securityAlerts", label: "Security Alerts", desc: "Important security notifications" },
          ].map((item, index) => (
            <div
              key={item.key}
              className={`flex items-center justify-between py-4 ${
                index > 0 ? `border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}` : ""
              }`}
            >
              <div>
                <p className={`font-medium ${textPrimary}`}>{item.label}</p>
                <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
              </div>
              <ToggleSwitch
                enabled={notifications[item.key]}
                onChange={(val) => setNotifications({ ...notifications, [item.key]: val })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDarkMode ? "bg-green-500/10" : "bg-green-50"
          }`}>
            <ShieldCheckIcon className={`w-5 h-5 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
          </div>
          <div>
            <h2 className={`font-semibold ${textPrimary}`}>Security</h2>
            <p className={`text-sm ${textSecondary}`}>Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`flex items-center justify-between py-4 border-t ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}>
            <div>
              <p className={`font-medium ${textPrimary}`}>Two-Factor Authentication</p>
              <p className={`text-sm ${textSecondary}`}>Add an extra layer of security</p>
            </div>
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}>
              Enable
            </button>
          </div>

          <div className={`flex items-center justify-between py-4 border-t ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}>
            <div>
              <p className={`font-medium ${textPrimary}`}>Change Password</p>
              <p className={`text-sm ${textSecondary}`}>Update your account password</p>
            </div>
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}>
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Blockchain Section */}
      <div className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDarkMode ? "bg-cyan-500/10" : "bg-cyan-50"
          }`}>
            <BlockchainIcon className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`} />
          </div>
          <div>
            <h2 className={`font-semibold ${textPrimary}`}>Blockchain</h2>
            <p className={`text-sm ${textSecondary}`}>Blockchain network settings</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${textPrimary}`}>Network</p>
              <p className={`text-xs ${textSecondary}`}>Sepolia Testnet</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-sm ${isDarkMode ? "text-green-400" : "text-green-600"}`}>Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          Save Changes
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
