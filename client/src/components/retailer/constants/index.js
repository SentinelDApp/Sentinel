// Retailer Dashboard Constants and Utilities

// Navigation Tabs (Sidebar)
export const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'incoming', label: 'Incoming', icon: '📦' },
  { id: 'qr-scan', label: 'Delivery Scan', icon: '📷' },
  { id: 'manage', label: 'Manage', icon: '⚙️' },
];

// Notification helper function - dispatches notifications to the Header
export const dispatchNotification = (title, message = '', type = 'info') => {
  window.dispatchEvent(new CustomEvent('retailer-notification', {
    detail: { title, message, type }
  }));
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};

// Order Status Constants
export const ORDER_STATUSES = {
  PENDING: 'Pending',
  IN_DELIVERY: 'In Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Status Colors for UI
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/25',
  },
  [ORDER_STATUSES.IN_DELIVERY]: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/25',
  },
  [ORDER_STATUSES.DELIVERED]: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/25',
  },
  [ORDER_STATUSES.CANCELLED]: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/25',
  },
};

// Shipment Status for Received Shipments
export const SHIPMENT_STATUSES = {
  RECEIVED: 'Received',
  VERIFIED: 'Verified',
  EXCEPTION: 'Exception',
  PENDING: 'Pending',
};

export const SHIPMENT_STATUS_COLORS = {
  [SHIPMENT_STATUSES.RECEIVED]: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  [SHIPMENT_STATUSES.VERIFIED]: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  [SHIPMENT_STATUSES.EXCEPTION]: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  [SHIPMENT_STATUSES.PENDING]: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
  },
};

// Sample Orders Data (empty - will be populated from API)
export const DEMO_ORDERS = [];

// Store Stats Configuration (matches warehouse style)
export const STORE_STATS = [
  {
    id: 'pending',
    title: 'Pending Arrival',
    description: 'Shipments on the way',
    value: '0',
    color: 'amber',
  },
  {
    id: 'received',
    title: 'Received',
    description: 'Scanned today',
    value: '0',
    color: 'blue',
  },
  {
    id: 'verified',
    title: 'Verified & Stored',
    description: 'Ready for sale',
    value: '0',
    color: 'emerald',
  },
  {
    id: 'concerns',
    title: 'Concerns',
    description: 'Issues reported',
    value: '0',
    color: 'rose',
  },
];

// Primary Header Actions
export const PRIMARY_ACTIONS = [
  { 
    id: 'accept', 
    label: 'Accept Shipment', 
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    primary: true 
  },
  { 
    id: 'received', 
    label: 'View Received', 
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    primary: false 
  },
  { 
    id: 'orders', 
    label: 'View Orders', 
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    primary: false 
  },
];

// Store Info (can be fetched from API later)
export const STORE_INFO = {
  name: 'Alim Store',
  id: 'RET-2024-0847',
  location: 'Mumbai, Maharashtra',
  verified: true,
  walletAddress: '0x7a3d...f829',
};
