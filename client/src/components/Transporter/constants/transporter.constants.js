// Transporter Dashboard Constants
// Data is fetched from API - no mock data

/**
 * Job statuses for transporter dashboard
 * Maps to the shipment statuses from the supplier system
 */
export const JOB_STATUSES = {
  PENDING: 'Pending',        // created
  READY: 'Ready',            // ready_for_dispatch
  IN_TRANSIT: 'In Transit',  // in_transit
  AT_WAREHOUSE: 'At Warehouse', // at_warehouse
  DELIVERED: 'Delivered',    // delivered
};

export const CONDITION_OPTIONS = [
  {
    value: 'Good',
    label: 'Good',
    activeClasses: 'bg-emerald-600 text-white border-emerald-600',
    inactiveClasses: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
    darkInactiveClasses: 'bg-slate-800 text-emerald-400 border-emerald-500/30 hover:bg-slate-700',
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    activeClasses: 'bg-red-600 text-white border-red-600',
    inactiveClasses: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
    darkInactiveClasses: 'bg-slate-800 text-red-400 border-red-500/30 hover:bg-slate-700',
  },
  {
    value: 'Delayed',
    label: 'Delayed',
    activeClasses: 'bg-amber-500 text-white border-amber-500',
    inactiveClasses: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
    darkInactiveClasses: 'bg-slate-800 text-amber-400 border-amber-500/30 hover:bg-slate-700',
  },
];

export const STATUS_COLORS = {
  Pending: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    lightBorder: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  Ready: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    lightBorder: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'In Transit': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    lightBg: 'bg-purple-50',
    lightText: 'text-purple-700',
    lightBorder: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  'At Warehouse': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-700',
    lightBorder: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  Delivered: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    lightBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

export const STATUS_FILTERS = ['All', 'Pending', 'Ready', 'In Transit', 'At Warehouse', 'Delivered'];

export const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'active', label: 'Active Jobs', icon: '🚚' },
  { id: 'history', label: 'History', icon: '📋' },
];
