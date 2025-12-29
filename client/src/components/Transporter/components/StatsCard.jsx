import { useTransporterTheme } from "../context/ThemeContext";
import { BoxIcon, TruckIcon, PackageIcon, AlertTriangleIcon } from "../icons/Icons";

const StatsCard = ({ label, value, icon: Icon, color, trend, trendUp }) => {
  const { isDarkMode } = useTransporterTheme();

  const getColorClasses = () => {
    const colors = {
      blue: {
        iconBg: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
        iconColor: "text-blue-500",
      },
      emerald: {
        iconBg: isDarkMode ? "bg-emerald-500/20" : "bg-emerald-100",
        iconColor: "text-emerald-500",
      },
      amber: {
        iconBg: isDarkMode ? "bg-amber-500/20" : "bg-amber-100",
        iconColor: "text-amber-500",
      },
      red: {
        iconBg: isDarkMode ? "bg-red-500/20" : "bg-red-100",
        iconColor: "text-red-500",
      },
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses();

  return (
    <div
      className={`
        rounded-2xl p-5 border transition-colors duration-200
        ${isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white border-slate-200 shadow-sm"
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {label}
        </p>
        <div className={`p-2 rounded-xl ${colorClasses.iconBg}`}>
          <Icon className={`w-5 h-5 ${colorClasses.iconColor}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {trend && (
        <p className={`text-xs mt-2 ${trendUp ? "text-emerald-500" : "text-red-500"}`}>
          {trend}{" "}
          <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
            vs last month
          </span>
        </p>
      )}
    </div>
  );
};

const StatsGrid = ({ stats }) => {
  const statsConfig = [
    { label: "Total Shipments", value: stats.total, icon: BoxIcon, color: "blue", trend: "↑ 12%", trendUp: true },
    { label: "New Jobs", value: stats.new, icon: PackageIcon, color: "emerald", trend: "↑ 8%", trendUp: true },
    { label: "In Transit", value: stats.inTransit, icon: TruckIcon, color: "amber", trend: "↑ 23%", trendUp: true },
    { label: "Delayed", value: stats.delayed, icon: AlertTriangleIcon, color: "red", trend: "↓ 5%", trendUp: false },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsConfig.map((stat, idx) => (
        <StatsCard key={idx} {...stat} />
      ))}
    </div>
  );
};

export { StatsCard, StatsGrid };
export default StatsCard;
