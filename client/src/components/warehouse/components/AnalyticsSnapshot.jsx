import { useTheme } from "../context/ThemeContext";
import { ChartBarIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon } from "../icons/Icons";

const AnalyticsSnapshot = () => {
  const { isDarkMode } = useTheme();

  const stats = {
    processedToday: 47,
    avgVerificationTime: "4.2 min",
    pendingCount: 12,
    completedCount: 35,
  };

  // Simple donut chart data
  const total = stats.pendingCount + stats.completedCount;
  const completedPercentage = (stats.completedCount / total) * 100;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const completedDash = (completedPercentage / 100) * circumference;

  // Bar chart data for weekly shipments
  const weeklyData = [
    { day: "Mon", value: 35 },
    { day: "Tue", value: 42 },
    { day: "Wed", value: 38 },
    { day: "Thu", value: 55 },
    { day: "Fri", value: 48 },
    { day: "Sat", value: 25 },
    { day: "Sun", value: 47 },
  ];
  const maxValue = Math.max(...weeklyData.map(d => d.value));

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
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
            <ChartBarIcon className={`w-5 h-5 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Analytics Snapshot
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              Today's performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`
              p-4 rounded-xl
              ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowPathIcon className={`w-4 h-4 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Processed Today
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {stats.processedToday}
            </p>
          </div>

          <div
            className={`
              p-4 rounded-xl
              ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Avg. Verification
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {stats.avgVerificationTime}
            </p>
          </div>
        </div>

        {/* Donut Chart - Pending vs Completed */}
        <div className="mb-6">
          <h4 className={`text-sm font-medium mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Pending vs Completed Ratio
          </h4>
          <div className="flex items-center justify-center gap-8">
            {/* Chart */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="12"
                  className={isDarkMode ? "stroke-slate-800" : "stroke-slate-200"}
                />
                {/* Completed arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-emerald-500"
                  strokeDasharray={`${completedDash} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {Math.round(completedPercentage)}%
                </span>
                <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Complete
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Completed
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {stats.completedCount}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isDarkMode ? "bg-slate-700" : "bg-slate-300"}`} />
                  <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Pending
                  </span>
                </div>
                <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {stats.pendingCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart - Weekly Shipments */}
        <div>
          <h4 className={`text-sm font-medium mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Weekly Shipments
          </h4>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              const isToday = index === weeklyData.length - 1;

              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className={`
                        absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-300
                        ${isToday
                          ? "bg-gradient-to-t from-emerald-500 to-teal-500"
                          : isDarkMode
                          ? "bg-slate-700 hover:bg-slate-600"
                          : "bg-slate-300 hover:bg-slate-400"
                        }
                      `}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span
                    className={`
                      text-xs font-medium
                      ${isToday
                        ? isDarkMode
                          ? "text-emerald-400"
                          : "text-emerald-600"
                        : isDarkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                      }
                    `}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSnapshot;
