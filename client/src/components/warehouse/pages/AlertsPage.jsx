import { useTheme } from "../context/ThemeContext";
import AlertsPanel from "../components/AlertsPanel";
import { ExclamationTriangleIcon } from "../icons/Icons";

const AlertsPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-500/10" : "bg-red-50"}`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Alerts & Exceptions
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          View and manage warehouse alerts and exception reports
        </p>
      </div>

      <div className="max-w-3xl">
        <AlertsPanel />
      </div>
    </div>
  );
};

export default AlertsPage;
