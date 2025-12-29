import { useTransporterTheme } from "../context/ThemeContext";
import { RefreshIcon } from "../icons/Icons";
import { NAVIGATION_TABS } from "../constants/transporter.constants";

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const { isDarkMode } = useTransporterTheme();

  return (
    <nav
      className={`
        backdrop-blur-xl border-b transition-colors duration-200
        ${isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white/50 border-slate-200"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 py-3 overflow-x-auto">
          {NAVIGATION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                  : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

const DashboardHeader = ({ title, subtitle, isRefreshing, onRefresh }) => {
  const { isDarkMode } = useTransporterTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {title}
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {subtitle}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isDarkMode
            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
          }
          disabled:opacity-50
        `}
      >
        <RefreshIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
};

export { NavigationTabs, DashboardHeader };
export default NavigationTabs;
