// Transporter Dashboard Constants

export const MOCK_JOBS = [
  {
    id: 'TRK-001',
    product: 'Electronic Components (Fragile)',
    origin: 'Mumbai Warehouse',
    dest: 'Delhi Distribution Center',
    status: 'New',
    expectedQuantity: 50,
    weight: '45 kg',
    createdAt: 'Dec 26, 2025, 03:49 PM',
  },
  {
    id: 'TRK-002',
    product: 'Pharmaceutical Supplies',
    origin: 'Chennai Port',
    dest: 'Bangalore Medical Hub',
    status: 'In Transit',
    expectedQuantity: 100,
    weight: '120 kg',
    createdAt: 'Dec 24, 2025, 03:49 PM',
  },
  {
    id: 'TRK-003',
    product: 'Automotive Parts',
    origin: 'Pune Factory',
    dest: 'Hyderabad Assembly',
    status: 'New',
    expectedQuantity: 200,
    weight: '350 kg',
    createdAt: 'Dec 28, 2025, 03:49 PM',
  },
  {
    id: 'TRK-004',
    product: 'Textile Materials',
    origin: 'Surat Mills',
    dest: 'Kolkata Exports',
    status: 'Delayed',
    expectedQuantity: 75,
    weight: '80 kg',
    createdAt: 'Dec 27, 2025, 03:49 PM',
  },
];

export const JOB_STATUSES = {
  NEW: 'New',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  DELAYED: 'Delayed',
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
  New: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    lightBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'In Transit': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    lightBorder: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  Delivered: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    lightBg: 'bg-slate-100',
    lightText: 'text-slate-600',
    lightBorder: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  Delayed: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    lightBorder: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

export const STATUS_FILTERS = ['All', 'New', 'In Transit', 'Delivered', 'Delayed'];

export const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'active', label: 'Active Jobs', icon: '🚚' },
  { id: 'history', label: 'History', icon: '📋' },
];

export const DEMO_NOTIFICATIONS = [
  { id: 1, title: 'New shipment TRK-005 assigned', time: '5 min ago', type: 'success' },
  { id: 2, title: 'Delivery deadline approaching for TRK-002', time: '1 hour ago', type: 'warning' },
  { id: 3, title: 'TRK-001 ready for pickup', time: '3 hours ago', type: 'info' },
];
