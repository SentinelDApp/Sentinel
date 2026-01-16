import { useTransporterTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

/**
 * LeftSidebar - Navigation sidebar for Transporter Dashboard
 * Similar to the supplier sidebar layout
 */
const LeftSidebar = ({ activeTab, setActiveTab }) => {
  const { isDarkMode } = useTransporterTheme();
  const { logout } = useAuth();

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: "active",
      label: "Active Jobs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "manage",
      label: "Manage",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: "history",
      label: "History",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const getActiveStyles = () => {
    return isDarkMode
      ? "bg-slate-800 text-white"
      : "bg-slate-100 text-slate-900";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r transition-colors duration-200 ${
          isDarkMode
            ? "bg-slate-900/70 border-slate-700/50"
            : "bg-white/80 border-slate-200"
        }`}
      >
        {/* Logo/Brand */}
        <div
          className={`p-5 border-b ${
            isDarkMode ? "border-slate-700/50" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20"
                  : "bg-gradient-to-br from-purple-100 to-cyan-100"
              }`}
            >
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h1
                className={`text-base font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Sentinel
              </h1>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Transporter Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors duration-150 ${
                activeTab === tab.id
                  ? getActiveStyles()
                  : isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div
          className={`p-3 border-t ${
            isDarkMode ? "border-slate-700/50" : "border-slate-200"
          }`}
        >
          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-2 mb-2`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Blockchain synced
            </span>
          </div>
          {/* Logout Button */}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors duration-150 ${
              isDarkMode
                ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                : "text-slate-600 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/50"
            : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "text-purple-400"
                    : "text-purple-600"
                  : isDarkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">
                {tab.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default LeftSidebar;
