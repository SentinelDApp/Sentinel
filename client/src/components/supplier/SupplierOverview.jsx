import { DEMO_SUPPLIER_WALLET, SHIPMENT_STATUSES, CONCERN_STATUS } from './supplier.constants';


const SupplierOverview = ({ shipments = [] }) => {
  // Calculate metrics
  const totalShipments = shipments.length;
  const createdCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.CREATED).length;
  const readyCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH).length;
  const inTransitCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.IN_TRANSIT).length;
  const deliveredCount = shipments.filter(s => s.status === SHIPMENT_STATUSES.DELIVERED).length;
  const concernsCount = shipments.filter(s => 
    s.concerns?.some(c => c.status === CONCERN_STATUS.OPEN || c.status === CONCERN_STATUS.ACKNOWLEDGED)
  ).length;

  const metrics = [
    { 
      label: 'Total Shipments', 
      value: totalShipments, 
      icon: '📦',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    { 
      label: 'Created', 
      value: createdCount, 
      icon: '✨',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
    },
    { 
      label: 'Ready for Dispatch', 
      value: readyCount, 
      icon: '🚀',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    { 
      label: 'In Transit', 
      value: inTransitCount, 
      icon: '🚚',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    { 
      label: 'Delivered', 
      value: deliveredCount, 
      icon: '✅',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    { 
      label: 'With Concerns', 
      value: concernsCount, 
      icon: '⚠️',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      highlight: concernsCount > 0,
    },
  ];

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 mb-1">
              {getGreeting()}, Supplier! 👋
            </h1>
            <p className="text-slate-400">
              Welcome to your Sentinel dashboard. Manage your shipments and track deliveries.
            </p>
          </div>
          
          {/* Wallet Status */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🔐</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Connected Wallet</p>
              <p className="font-mono text-sm text-slate-200">{DEMO_SUPPLIER_WALLET.shortAddress}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.label}
            className={`${metric.bgColor} border ${metric.borderColor} rounded-xl p-4 transition-all hover:scale-105 ${
              metric.highlight ? 'ring-2 ring-red-500/50' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{metric.icon}</span>
              <span className="text-xs text-slate-400 truncate">{metric.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-50">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierOverview;
