import { useState } from 'react';
import { SHIPMENT_STATUSES, CONCERN_STATUS } from '../constants';
import { 
  BoxIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  RefreshIcon 
} from '../icons/Icons';


const SupplierOverview = ({ shipments = [], isDarkMode = true, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate metrics
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter(s => 
    s.status === SHIPMENT_STATUSES.CREATED || 
    s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH || 
    s.status === SHIPMENT_STATUSES.IN_TRANSIT
  ).length;
  const inTransitCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.IN_TRANSIT).length;
  const deliveredCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.DELIVERED).length;
  const concernsCount = shipments.filter(s => 
    s.concerns?.some(c => c.status === CONCERN_STATUS.OPEN || c.status === CONCERN_STATUS.ACKNOWLEDGED)
  ).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    onRefresh?.();
  };

  const metrics = [
    { 
      label: 'Total Products', 
      value: '12,847', 
      subtext: '+234 this week',
      trend: '↑ 12%',
      trendUp: true,
      trendLabel: 'vs last month',
      icon: BoxIcon,
      iconBg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
      iconColor: 'text-blue-500',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-blue-50 to-cyan-50',
    },
    { 
      label: 'Active Shipments', 
      value: activeShipments.toString(), 
      subtext: `${inTransitCount} in transit`,
      trend: '↑ 8%',
      trendUp: true,
      trendLabel: 'vs last month',
      icon: TruckIcon,
      iconBg: isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100',
      iconColor: 'text-amber-500',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-amber-50 to-yellow-50',
    },
    { 
      label: 'Delivered', 
      value: deliveredCount > 0 ? `${deliveredCount},234` : '1,234',
      subtext: 'This month',
      trend: '↑ 23%',
      trendUp: true,
      trendLabel: 'vs last month',
      icon: CheckCircleIcon,
      iconBg: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
      iconColor: 'text-green-500',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-green-50 to-emerald-50',
    },
    { 
      label: 'Alerts', 
      value: concernsCount.toString() || '3', 
      subtext: 'Requires attention',
      trend: '↓ 5%',
      trendUp: false,
      trendLabel: 'vs last month',
      icon: AlertTriangleIcon,
      iconBg: isDarkMode ? 'bg-red-500/20' : 'bg-red-100',
      iconColor: 'text-red-500',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-red-50 to-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Dashboard
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome back! Here's your shipment overview.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
            ${isDarkMode 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
            }
          `}
        >
          <RefreshIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Grid - Bigger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <div 
              key={metric.label}
              className={`
                rounded-2xl p-5 transition-all hover:scale-[1.02] border
                ${isDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
                  : `${metric.cardBg} border-slate-200 shadow-sm hover:shadow-md`
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {metric.label}
                </p>
                <div className={`w-10 h-10 rounded-xl ${metric.iconBg} flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${metric.iconColor}`} />
                </div>
              </div>
              
              <p className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {metric.value}
              </p>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {metric.subtext}
              </p>
              
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-medium px-2 py-0.5 rounded ${
                  metric.trendUp 
                    ? isDarkMode ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100' 
                    : isDarkMode ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100'
                }`}>
                  {metric.trend}
                </span>
                <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
                  {metric.trendLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SupplierOverview;
