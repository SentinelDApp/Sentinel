/**
 * StatsCard Component
 * Stats cards matching Transporter dashboard style
 */

import { useRetailerTheme } from '../context/ThemeContext';

// Icons
const BoxIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PackageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const TruckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SingleStatsCard = ({ label, value, icon: Icon, color }) => {
  const { isDarkMode } = useRetailerTheme();

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
      cyan: {
        iconBg: isDarkMode ? "bg-cyan-500/20" : "bg-cyan-100",
        iconColor: "text-cyan-500",
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
    </div>
  );
};

const StatsGrid = ({ stats }) => {
  const statsConfig = [
    { label: "Total Shipments", value: stats.total, icon: BoxIcon, color: "blue" },
    { label: "Pending/Ready", value: stats.pending, icon: PackageIcon, color: "emerald" },
    { label: "In Transit", value: stats.inTransit, icon: TruckIcon, color: "amber" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircleIcon, color: "emerald" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsConfig.map((stat, idx) => (
        <SingleStatsCard key={idx} {...stat} />
      ))}
    </div>
  );
};

// Default export for backward compatibility
function StatsCard({ stats }) {
  return <StatsGrid stats={stats} />;
}

export { SingleStatsCard, StatsGrid };
export default StatsCard;
