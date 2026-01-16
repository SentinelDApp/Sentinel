/**
 * NavigationTabs Component
 * Sidebar navigation for Retailer Dashboard matching Warehouse design.
 */

import { useRetailerTheme } from "../context/ThemeContext";
import { NAVIGATION_TABS } from "../constants";

// Desktop Sidebar Navigation
const Sidebar = ({ activeTab, setActiveTab, isDarkMode }) => {
  return (
    <nav
      className={`
        w-56 shrink-0 h-[calc(100vh-73px)] sticky top-[73px] p-4 border-r overflow-y-auto hidden lg:block
        ${isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white/50 border-slate-200"
        }
      `}
    >
      <div className="space-y-1">
        {NAVIGATION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? isDarkMode
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-900"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Mobile Bottom Navigation
const MobileNav = ({ activeTab, setActiveTab, isDarkMode }) => {
  return (
    <nav
      className={`
        lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2
        ${isDarkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-200"
        }
      `}
    >
      <div className="flex justify-around">
        {NAVIGATION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? isDarkMode
                  ? "text-white"
                  : "text-slate-900"
                : isDarkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const { isDarkMode } = useRetailerTheme();

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
    </>
  );
};

export default NavigationTabs;
