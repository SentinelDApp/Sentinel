import { useTheme } from "../context/ThemeContext";
import { ExclamationTriangleIcon, XCircleIcon, DocumentDuplicateIcon, BoxIcon } from "../icons/Icons";

const AlertsPanel = () => {
  const { isDarkMode } = useTheme();

  // Empty array - no dummy data
  const alerts = [];

  const getAlertIcon = (type) => {
    switch (type) {
      case "missing":
        return BoxIcon;
      case "unauthorized":
        return XCircleIcon;
      case "duplicate":
        return DocumentDuplicateIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "high":
        return {
          badge: isDarkMode
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : "bg-red-50 text-red-600 border-red-200",
          icon: isDarkMode ? "text-red-400" : "text-red-600",
          border: isDarkMode ? "border-l-red-500" : "border-l-red-500",
        };
      case "medium":
        return {
          badge: isDarkMode
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-amber-50 text-amber-600 border-amber-200",
          icon: isDarkMode ? "text-amber-400" : "text-amber-600",
          border: isDarkMode ? "border-l-amber-500" : "border-l-amber-500",
        };
      case "low":
        return {
          badge: isDarkMode
            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
            : "bg-blue-50 text-blue-600 border-blue-200",
          icon: isDarkMode ? "text-blue-400" : "text-blue-600",
          border: isDarkMode ? "border-l-blue-500" : "border-l-blue-500",
        };
      default:
        return {
          badge: isDarkMode
            ? "bg-slate-500/10 text-slate-400 border-slate-500/30"
            : "bg-slate-50 text-slate-600 border-slate-200",
          icon: isDarkMode ? "text-slate-400" : "text-slate-600",
          border: isDarkMode ? "border-l-slate-500" : "border-l-slate-500",
        };
    }
  };

  const highCount = alerts.filter(a => a.severity === "high").length;
  const mediumCount = alerts.filter(a => a.severity === "medium").length;
  const lowCount = alerts.filter(a => a.severity === "low").length;

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50"
          : "bg-white border border-slate-200/50 shadow-sm"
        }
      `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-500/10" : "bg-red-50"}`}>
              <ExclamationTriangleIcon className={`w-5 h-5 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Alerts & Exceptions
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Issues requiring attention
              </p>
            </div>
          </div>
          
          {/* Severity Counts */}
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                {highCount} High
              </span>
            )}
            {mediumCount > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                {mediumCount} Medium
              </span>
            )}
            {lowCount > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                {lowCount} Low
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className={`p-12 text-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No alerts</p>
            <p className="text-sm">All systems are running smoothly</p>
          </div>
        ) : (
        alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          const styles = getSeverityStyles(alert.severity);

          return (
            <div
              key={alert.id}
              className={`
                p-4 border-b border-l-4 transition-colors cursor-pointer
                ${isDarkMode ? "border-b-slate-800 hover:bg-slate-800/50" : "border-b-slate-100 hover:bg-slate-50"}
                ${styles.border}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Icon className={`w-4 h-4 ${styles.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {alert.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${styles.badge}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-mono ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                      {alert.shipmentId}
                    </span>
                    <span className={isDarkMode ? "text-slate-600" : "text-slate-400"}>•</span>
                    <span className={isDarkMode ? "text-slate-500" : "text-slate-500"}>
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* View All Link */}
      <div className={`px-6 py-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <button
          className={`
            text-sm font-medium transition-colors
            ${isDarkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}
          `}
        >
          View all alerts →
        </button>
      </div>
    </div>
  );
};

export default AlertsPanel;
