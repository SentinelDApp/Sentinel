/**
 * NavigationTabs Component
 * Tab navigation for Retailer Dashboard matching Transporter design.
 */

import { useRetailerTheme } from "../context/ThemeContext";
import { NAVIGATION_TABS } from "../constants";

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const { isDarkMode } = useRetailerTheme();

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
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
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

export default NavigationTabs;
