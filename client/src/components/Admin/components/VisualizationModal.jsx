/**
 * VisualizationModal Component
 * 
 * Comprehensive supply chain visualization dashboard
 * Shows flow diagrams, charts, and analytics for the entire system
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FlowIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const NetworkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const TimelineIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BAR CHART
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedBarChart = ({ data, isDarkMode }) => {
  const [animated, setAnimated] = useState(false);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {item.label}
            </span>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {item.value}
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
              style={{ 
                width: animated ? `${(item.value / maxValue) * 100}%` : '0%',
                transitionDelay: `${index * 100}ms`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════

const DonutChart = ({ data, size = 200, isDarkMode, centerLabel, centerValue }) => {
  const [animated, setAnimated] = useState(false);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  let cumulativeOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
          strokeWidth={strokeWidth}
        />
        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = total > 0 ? item.value / total : 0;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativeOffset * circumference;
          cumulativeOffset += percentage;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={animated ? strokeDasharray : `0 ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ transitionDelay: `${index * 150}ms` }}
            />
          );
        })}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {centerValue}
        </span>
        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLY CHAIN FLOW VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const SupplyChainFlow = ({ stats, isDarkMode }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const stages = [
    { 
      id: 'created', 
      label: 'Created', 
      value: stats.created || 0, 
      color: 'from-slate-500 to-slate-600',
      bgColor: isDarkMode ? 'bg-slate-800' : 'bg-slate-100',
      icon: '📦'
    },
    { 
      id: 'dispatch', 
      label: 'Ready to Dispatch', 
      value: stats.readyForDispatch || 0, 
      color: 'from-amber-500 to-orange-500',
      bgColor: isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50',
      icon: '🏭'
    },
    { 
      id: 'transit', 
      label: 'In Transit', 
      value: stats.inTransit || 0, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
      icon: '🚚'
    },
    { 
      id: 'warehouse', 
      label: 'At Warehouse', 
      value: stats.atWarehouse || 0, 
      color: 'from-purple-500 to-pink-500',
      bgColor: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50',
      icon: '🏪'
    },
    { 
      id: 'delivered', 
      label: 'Delivered', 
      value: stats.delivered || 0, 
      color: 'from-green-500 to-emerald-500',
      bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
      icon: '✅'
    },
  ];

  const total = stages.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-8">
      {/* Flow Diagram */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            {/* Stage Node */}
            <div
              className={`
                relative flex flex-col items-center p-4 rounded-2xl min-w-[120px]
                transition-all duration-500 transform
                ${animated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                ${stage.bgColor}
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`text-3xl mb-2`}>{stage.icon}</div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stage.color} bg-clip-text text-transparent`}>
                {stage.value}
              </div>
              <div className={`text-xs text-center mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {stage.label}
              </div>
              {/* Percentage */}
              <div className={`
                absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium
                ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}
              `}>
                {total > 0 ? Math.round((stage.value / total) * 100) : 0}%
              </div>
            </div>

            {/* Arrow */}
            {index < stages.length - 1 && (
              <div 
                className={`
                  flex items-center mx-2 transition-all duration-500
                  ${animated ? 'opacity-100' : 'opacity-0'}
                `}
                style={{ transitionDelay: `${(index + 1) * 150}ms` }}
              >
                <div className={`w-8 h-0.5 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                <div className={`
                  w-0 h-0 border-t-4 border-b-4 border-l-6
                  border-t-transparent border-b-transparent
                  ${isDarkMode ? 'border-l-slate-600' : 'border-l-slate-300'}
                `} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flow Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Supply Chain Progress</span>
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {total > 0 ? Math.round((stats.delivered / total) * 100) : 0}% Complete
          </span>
        </div>
        <div className={`h-4 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`
                h-full bg-gradient-to-r ${stage.color} transition-all duration-1000
                ${index === 0 ? 'rounded-l-full' : ''}
                ${index === stages.length - 1 ? 'rounded-r-full' : ''}
              `}
              style={{ 
                width: animated && total > 0 ? `${(stage.value / total) * 100}%` : '0%',
                transitionDelay: `${index * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STAKEHOLDER NETWORK VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const StakeholderNetwork = ({ stakeholders, isDarkMode }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 500);
  }, []);

  const roles = [
    { id: 'supplier', label: 'Suppliers', count: stakeholders.suppliers || 0, color: 'from-blue-500 to-cyan-500', icon: '🏭' },
    { id: 'transporter', label: 'Transporters', count: stakeholders.transporters || 0, color: 'from-amber-500 to-orange-500', icon: '🚚' },
    { id: 'warehouse', label: 'Warehouses', count: stakeholders.warehouses || 0, color: 'from-purple-500 to-pink-500', icon: '🏪' },
    { id: 'retailer', label: 'Retailers', count: stakeholders.retailers || 0, color: 'from-green-500 to-emerald-500', icon: '🛒' },
  ];

  const total = roles.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Central Network Visualization */}
      <div className="relative h-64 flex items-center justify-center">
        {/* Center Hub */}
        <div className={`
          absolute z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center
          transition-all duration-700 transform
          ${animated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          ${isDarkMode ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl shadow-slate-900/50' : 'bg-gradient-to-br from-white to-slate-100 shadow-xl'}
        `}>
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{total}</span>
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total</span>
        </div>

        {/* Role Nodes */}
        {roles.map((role, index) => {
          const angle = (index * 90 - 45) * (Math.PI / 180);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={role.id}
              className={`
                absolute transition-all duration-700 transform
                ${animated ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
              `}
              style={{ 
                transform: `translate(${animated ? x : 0}px, ${animated ? y : 0}px)`,
                transitionDelay: `${index * 150 + 300}ms`
              }}
            >
              <div className={`
                flex flex-col items-center p-3 rounded-xl
                ${isDarkMode ? 'bg-slate-800/80' : 'bg-white shadow-lg'}
              `}>
                <span className="text-2xl">{role.icon}</span>
                <span className={`text-lg font-bold bg-gradient-to-r ${role.color} bg-clip-text text-transparent`}>
                  {role.count}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {role.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {roles.map((role, index) => {
            const angle = (index * 90 - 45) * (Math.PI / 180);
            const radius = 60;
            const x = Math.cos(angle) * radius + 128;
            const y = Math.sin(angle) * radius + 128;
            
            return (
              <line
                key={role.id}
                x1="128"
                y1="128"
                x2={animated ? x : 128}
                y2={animated ? y : 128}
                stroke={isDarkMode ? '#475569' : '#cbd5e1'}
                strokeWidth="2"
                strokeDasharray="4"
                className="transition-all duration-700"
                style={{ transitionDelay: `${index * 150 + 200}ms` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role, index) => (
          <div 
            key={role.id}
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-all duration-500
              ${animated ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
              ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}
            `}
            style={{ transitionDelay: `${index * 100 + 700}ms` }}
          >
            <span className="text-xl">{role.icon}</span>
            <div>
              <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {role.count}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {role.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

const ActivityTimeline = ({ activities, isDarkMode }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 300);
  }, []);

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div 
          key={index}
          className={`
            flex gap-4 transition-all duration-500
            ${animated ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
          `}
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg
              ${activity.bgColor || (isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}
            `}>
              {activity.icon}
            </div>
            {index < activities.length - 1 && (
              <div className={`w-0.5 flex-1 my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
            )}
          </div>

          {/* Content */}
          <div className={`flex-1 pb-4 ${index < activities.length - 1 ? 'border-b' : ''} ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activity.title}
                </p>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {activity.description}
                </p>
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {activity.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VISUALIZATION MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisualizationModal = ({ isOpen, onClose, shipments = [], containers = [], users = [] }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats from data
  const stats = useMemo(() => {
    const statusCounts = {
      created: shipments.filter(s => s.status === 'created').length,
      readyForDispatch: shipments.filter(s => s.status === 'ready_for_dispatch').length,
      inTransit: shipments.filter(s => s.status === 'in_transit').length,
      atWarehouse: shipments.filter(s => s.status === 'at_warehouse').length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
    };

    const containerStats = {
      total: containers.length,
      scanned: containers.filter(c => c.status !== 'CREATED').length,
      delivered: containers.filter(c => c.status === 'DELIVERED').length,
      pending: containers.filter(c => c.status === 'CREATED' || c.status === 'IN_TRANSIT').length,
    };

    return { ...statusCounts, containers: containerStats, total: shipments.length };
  }, [shipments, containers]);

  // Calculate stakeholder counts
  const stakeholders = useMemo(() => {
    const roleCounts = {
      suppliers: users.filter(u => u.role?.toLowerCase() === 'supplier').length,
      transporters: users.filter(u => u.role?.toLowerCase() === 'transporter').length,
      warehouses: users.filter(u => u.role?.toLowerCase() === 'warehouse').length,
      retailers: users.filter(u => u.role?.toLowerCase() === 'retailer').length,
    };
    return roleCounts;
  }, [users]);

  // Generate recent activities
  const recentActivities = useMemo(() => {
    const activities = shipments
      .slice(0, 6)
      .map(s => ({
        icon: s.status === 'delivered' ? '✅' : s.status === 'in_transit' ? '🚚' : '📦',
        title: `Shipment ${s.batchId || s.shipmentHash?.slice(0, 8)}`,
        description: `Status: ${s.status?.replace(/_/g, ' ').toUpperCase()}`,
        time: new Date(s.createdAt).toLocaleDateString(),
        bgColor: s.status === 'delivered' 
          ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-50')
          : s.status === 'in_transit'
            ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50')
            : (isDarkMode ? 'bg-slate-800' : 'bg-slate-100'),
      }));
    return activities;
  }, [shipments, isDarkMode]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'flow', label: 'Supply Chain', icon: <FlowIcon className="w-4 h-4" /> },
    { id: 'network', label: 'Network', icon: <NetworkIcon className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <TimelineIcon className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl
        ${isDarkMode ? 'bg-slate-900' : 'bg-white'}
      `}>
        {/* Header */}
        <div className={`
          sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b
          ${isDarkMode ? 'bg-slate-900/95 border-slate-800 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-xl
              ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50'}
            `}>
              <ChartIcon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Supply Chain Analytics
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Comprehensive visualization dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-xl transition-colors
              ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}
            `}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`
          flex gap-2 px-6 py-3 border-b overflow-x-auto
          ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}
        `}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'bg-blue-50 text-blue-600 shadow-lg shadow-blue-500/10'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shipment Status Distribution */}
              <div className={`
                p-6 rounded-2xl
                ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}
              `}>
                <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Shipment Status Distribution
                </h3>
                <div className="flex justify-center mb-6">
                  <DonutChart
                    data={[
                      { value: stats.delivered, color: '#10b981' },
                      { value: stats.inTransit, color: '#3b82f6' },
                      { value: stats.atWarehouse, color: '#8b5cf6' },
                      { value: stats.readyForDispatch + stats.created, color: '#f59e0b' },
                    ]}
                    size={180}
                    isDarkMode={isDarkMode}
                    centerLabel="Total"
                    centerValue={stats.total}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Delivered', value: stats.delivered, color: 'bg-green-500' },
                    { label: 'In Transit', value: stats.inTransit, color: 'bg-blue-500' },
                    { label: 'At Warehouse', value: stats.atWarehouse, color: 'bg-purple-500' },
                    { label: 'Pending', value: stats.readyForDispatch + stats.created, color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.label}: <strong>{item.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Container Scan Progress */}
              <div className={`
                p-6 rounded-2xl
                ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}
              `}>
                <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Container Scan Progress
                </h3>
                <AnimatedBarChart
                  data={[
                    { label: 'Total Containers', value: stats.containers.total, color: 'bg-gradient-to-r from-slate-500 to-slate-400' },
                    { label: 'Scanned', value: stats.containers.scanned, color: 'bg-gradient-to-r from-blue-500 to-cyan-400' },
                    { label: 'Delivered', value: stats.containers.delivered, color: 'bg-gradient-to-r from-green-500 to-emerald-400' },
                    { label: 'Pending', value: stats.containers.pending, color: 'bg-gradient-to-r from-amber-500 to-orange-400' },
                  ]}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Quick Stats */}
              <div className={`
                lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4
              `}>
                {[
                  { label: 'Total Shipments', value: stats.total, icon: '📦', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Success Rate', value: `${stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%`, icon: '✅', color: 'from-green-500 to-emerald-500' },
                  { label: 'Avg. Containers', value: stats.total > 0 ? Math.round(stats.containers.total / stats.total) : 0, icon: '📊', color: 'from-purple-500 to-pink-500' },
                  { label: 'Active Users', value: Object.values(stakeholders).reduce((a, b) => a + b, 0), icon: '👥', color: 'from-amber-500 to-orange-500' },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className={`
                      p-4 rounded-2xl text-center
                      ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}
                    `}
                  >
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supply Chain Flow Tab */}
          {activeTab === 'flow' && (
            <div className={`
              p-6 rounded-2xl
              ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}
            `}>
              <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Supply Chain Flow Visualization
              </h3>
              <SupplyChainFlow stats={stats} isDarkMode={isDarkMode} />
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className={`
              p-6 rounded-2xl
              ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}
            `}>
              <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Stakeholder Network
              </h3>
              <StakeholderNetwork stakeholders={stakeholders} isDarkMode={isDarkMode} />
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className={`
              p-6 rounded-2xl
              ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}
            `}>
              <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity Timeline
              </h3>
              {recentActivities.length > 0 ? (
                <ActivityTimeline activities={recentActivities} isDarkMode={isDarkMode} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📭</div>
                  <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    No recent activities
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizationModal;
