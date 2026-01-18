/**
 * WarehouseStatsGrid Component
 * 
 * Displays warehouse dashboard metrics in a grid of stat cards.
 * Similar to Transporter's StatsGrid.
 */

import { useWarehouseTheme } from '../context/ThemeContext';

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'purple', trend = null }) => {
  const { isDarkMode } = useWarehouseTheme();

  const colorClasses = {
    purple: {
      bg: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50',
      border: isDarkMode ? 'border-purple-500/20' : 'border-purple-200',
      iconBg: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100',
      iconText: 'text-purple-500',
    },
    blue: {
      bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      border: isDarkMode ? 'border-blue-500/20' : 'border-blue-200',
      iconBg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
      iconText: 'text-blue-500',
    },
    amber: {
      bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50',
      border: isDarkMode ? 'border-amber-500/20' : 'border-amber-200',
      iconBg: isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100',
      iconText: 'text-amber-500',
    },
    emerald: {
      bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
      border: isDarkMode ? 'border-emerald-500/20' : 'border-emerald-200',
      iconBg: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
      iconText: 'text-emerald-500',
    },
    cyan: {
      bg: isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50',
      border: isDarkMode ? 'border-cyan-500/20' : 'border-cyan-200',
      iconBg: isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
      iconText: 'text-cyan-500',
    },
  };

  const colors = colorClasses[color] || colorClasses.purple;

  return (
    <div className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          )}
          {trend !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={trend >= 0 
                    ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                    : "M19 14l-7 7m0 0l-7-7m7 7V3"
                  } 
                />
              </svg>
              {Math.abs(trend)}% vs last week
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
            <Icon className={`w-6 h-6 ${colors.iconText}`} />
          </div>
        )}
      </div>
    </div>
  );
};

// Default icons
const InTransitIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const AtWarehouseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ReadyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DeliveredIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Main Stats Grid Component
const WarehouseStatsGrid = ({ stats }) => {
  const defaultStats = {
    inTransit: 0,
    atWarehouse: 0,
    readyForDispatch: 0,
    delivered: 0,
    total: 0,
    ...stats
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="In Transit"
        value={defaultStats.inTransit}
        subtitle="Awaiting arrival"
        icon={InTransitIcon}
        color="blue"
      />
      <StatCard
        title="At Warehouse"
        value={defaultStats.atWarehouse}
        subtitle="Ready for processing"
        icon={AtWarehouseIcon}
        color="purple"
      />
      <StatCard
        title="Ready for Dispatch"
        value={defaultStats.readyForDispatch}
        subtitle="Awaiting pickup"
        icon={ReadyIcon}
        color="amber"
      />
      <StatCard
        title="Delivered"
        value={defaultStats.delivered}
        subtitle="Completed"
        icon={DeliveredIcon}
        color="emerald"
      />
    </div>
  );
};

export { WarehouseStatsGrid, StatCard };
export default WarehouseStatsGrid;
