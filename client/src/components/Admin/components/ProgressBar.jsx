import { useTheme } from "../context/ThemeContext";

const ProgressBar = ({
  label,
  value,
  total,
  color = "blue",
  showPercentage = true,
  size = "md",
  className = "",
}) => {
  const { isDarkMode } = useTheme();
  const percentage = Math.round((value / total) * 100);

  const colorMap = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
  };

  const sizeMap = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium ${
            isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {value.toLocaleString()} / {total.toLocaleString()}
          </span>
          {showPercentage && (
            <span
              className={`
                text-xs font-semibold px-2 py-0.5 rounded-full
                ${
                  isDarkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }
              `}
            >
              {percentage}%
            </span>
          )}
        </div>
      </div>
      <div
        className={`
          w-full rounded-full overflow-hidden
          ${sizeMap[size]}
          ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}
        `}
      >
        <div
          className={`
            h-full rounded-full bg-gradient-to-r ${colorMap[color]}
            transition-all duration-500 ease-out
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
