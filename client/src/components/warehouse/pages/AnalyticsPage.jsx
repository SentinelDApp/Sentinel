import { useTheme } from "../context/ThemeContext";
import AnalyticsSnapshot from "../components/AnalyticsSnapshot";
import { ChartBarIcon } from "../icons/Icons";

const AnalyticsPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
            <ChartBarIcon className={`w-6 h-6 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Analytics
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          View warehouse performance metrics and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsSnapshot />
        
        {/* Additional Analytics Card */}
        <div
          className={`
            rounded-2xl p-6
            ${isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <h3 className={`font-semibold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Monthly Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Total Shipments</span>
              <span className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Verified</span>
              <span className={`font-bold text-green-500`}>1,198</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Exceptions</span>
              <span className={`font-bold text-amber-500`}>49</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Avg. Processing Time</span>
              <span className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>3.8 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
