// Warehouse Dashboard Constants and Utilities

// Shipment Status Constants
export const SHIPMENT_STATUSES = {
  PENDING: 'pending',
  RECEIVED: 'received',
  VERIFIED: 'verified',
  STORED: 'stored',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  DISPATCHED: 'dispatched',
  CONCERN_RAISED: 'concern_raised',
};

// Status Colors for UI
export const STATUS_COLORS = {
  [SHIPMENT_STATUSES.PENDING]: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Pending',
  },
  [SHIPMENT_STATUSES.RECEIVED]: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Received',
  },
  [SHIPMENT_STATUSES.VERIFIED]: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    label: 'Verified',
  },
  [SHIPMENT_STATUSES.STORED]: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'Stored',
  },
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    label: 'Ready for Dispatch',
  },
  [SHIPMENT_STATUSES.DISPATCHED]: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Dispatched',
  },
  [SHIPMENT_STATUSES.CONCERN_RAISED]: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Concern Raised',
  },
};

// Concern Types
export const CONCERN_TYPES = {
  TEMPERATURE_DEVIATION: 'temperature_deviation',
  PACKAGE_DAMAGE: 'package_damage',
  QUANTITY_MISMATCH: 'quantity_mismatch',
  DOCUMENTATION_ISSUE: 'documentation_issue',
  SEAL_BROKEN: 'seal_broken',
  DELAY: 'delay',
  OTHER: 'other',
};

export const CONCERN_TYPE_LABELS = {
  [CONCERN_TYPES.TEMPERATURE_DEVIATION]: 'Temperature Deviation',
  [CONCERN_TYPES.PACKAGE_DAMAGE]: 'Package Damage',
  [CONCERN_TYPES.QUANTITY_MISMATCH]: 'Quantity Mismatch',
  [CONCERN_TYPES.DOCUMENTATION_ISSUE]: 'Documentation Issue',
  [CONCERN_TYPES.SEAL_BROKEN]: 'Seal Broken',
  [CONCERN_TYPES.DELAY]: 'Delivery Delay',
  [CONCERN_TYPES.OTHER]: 'Other',
};

// Concern Status
export const CONCERN_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
};

export const CONCERN_STATUS_COLORS = {
  [CONCERN_STATUS.OPEN]: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Open',
  },
  [CONCERN_STATUS.ACKNOWLEDGED]: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    label: 'Acknowledged',
  },
  [CONCERN_STATUS.RESOLVED]: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    label: 'Resolved',
  },
  [CONCERN_STATUS.ESCALATED]: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    label: 'Escalated',
  },
};

// Storage Zones - Empty (will be populated from API)
export const STORAGE_ZONES = [];

// Retailers/Destinations - Empty (will be populated from API)
export const RETAILERS = [];

// Demo Incoming Shipments - Empty (will be populated from API)
export const DEMO_SHIPMENTS = [];

// Demo Alerts - Empty (will be populated from API)
export const DEMO_ALERTS = [];

// Demo Blockchain Activities - Empty (will be populated from API)
export const DEMO_BLOCKCHAIN_ACTIVITIES = [];

// Utility functions
export const generateShipmentId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SHP-W${timestamp}${random}`;
};

export const generateTxHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};
