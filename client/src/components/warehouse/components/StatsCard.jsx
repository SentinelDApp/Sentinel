import { useTheme } from "../context/ThemeContext";

const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "emerald",
  className = "",
}) => {
  const { isDarkMode } = useTheme();

  const colorMap = {
    emerald: {
      gradient: "from-emerald-500 to-teal-500",
      bg: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
      border: isDarkMode ? "border-emerald-500/20" : "border-emerald-100",
      text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
    },
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      bg: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
      border: isDarkMode ? "border-blue-500/20" : "border-blue-100",
      text: isDarkMode ? "text-blue-400" : "text-blue-600",
    },
    amber: {
      gradient: "from-amber-500 to-orange-500",
      bg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50",
      border: isDarkMode ? "border-amber-500/20" : "border-amber-100",
      text: isDarkMode ? "text-amber-400" : "text-amber-600",
    },
    purple: {
      gradient: "from-purple-500 to-pink-500",
      bg: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      border: isDarkMode ? "border-purple-500/20" : "border-purple-100",
      text: isDarkMode ? "text-purple-400" : "text-purple-600",
    },
    red: {
      gradient: "from-red-500 to-rose-500",
      bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
      border: isDarkMode ? "border-red-500/20" : "border-red-100",
      text: isDarkMode ? "text-red-400" : "text-red-600",
    },
    green: {
      gradient: "from-green-500 to-emerald-500",
      bg: isDarkMode ? "bg-green-500/10" : "bg-green-50",
      border: isDarkMode ? "border-green-500/20" : "border-green-100",
      text: isDarkMode ? "text-green-400" : "text-green-600",
    },
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]
        ${isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50"
          : "bg-white border border-slate-200/50 hover:border-slate-300 shadow-sm hover:shadow-md"
        }
        ${className}
      `}
    >
      {/* Background Gradient Blob */}
      <div
        className={`
          absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20
          bg-gradient-to-br ${colors.gradient}
        `}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {title}
            </p>
            <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {value}
            </h3>
            {subtitle && (
              <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                {subtitle}
              </p>
            )}
          </div>

          {Icon && (
            <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-4">
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${trend === "up"
                  ? isDarkMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
                  : isDarkMode
                  ? "bg-red-500/10 text-red-400"
                  : "bg-red-50 text-red-600"
                }
              `}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </span>
            <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
