// Retailer Dashboard Constants and Utilities

// Navigation Tabs
export const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '�' },
  { id: 'inventory', label: 'Inventory', icon: '🗃️' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'shipments', label: 'Shipments', icon: '🚛' },
];

// Demo Notifications
export const DEMO_NOTIFICATIONS = [
  { id: 1, title: 'New shipment SHP-1024 arrived', time: '5 min ago', type: 'success' },
  { id: 2, title: 'Low stock alert: Basmati Rice', time: '1 hour ago', type: 'warning' },
  { id: 3, title: 'Order ORD-1045 ready for delivery', time: '3 hours ago', type: 'info' },
];

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

// Sample Orders Data
export const DEMO_ORDERS = [
  { id: 'ORD-1045', customerName: 'Ayesha Khan', product: 'Basmati Rice (5kg)', status: ORDER_STATUSES.PENDING, date: 'Today' },
  { id: 'ORD-1044', customerName: 'Rohit Sharma', product: 'Sunflower Oil (1L)', status: ORDER_STATUSES.IN_DELIVERY, date: 'Today' },
  { id: 'ORD-1043', customerName: 'Meera Patel', product: 'Toothpaste', status: ORDER_STATUSES.DELIVERED, date: 'Today' },
  { id: 'ORD-1042', customerName: 'Arjun Singh', product: 'Tea Pack (500g)', status: ORDER_STATUSES.DELIVERED, date: 'Yesterday' },
  { id: 'ORD-1041', customerName: 'Sara Ali', product: 'Hand Soap', status: ORDER_STATUSES.DELIVERED, date: 'Yesterday' },
  { id: 'ORD-1040', customerName: 'Vikram Mehta', product: 'Coffee Powder', status: ORDER_STATUSES.DELIVERED, date: '2 days ago' },
  { id: 'ORD-1039', customerName: 'Priya Nair', product: 'Sugar (1kg)', status: ORDER_STATUSES.DELIVERED, date: '2 days ago' },
  { id: 'ORD-1038', customerName: 'Anil Kumar', product: 'Milk Powder', status: ORDER_STATUSES.DELIVERED, date: '3 days ago' },
];

// Store Stats Configuration
export const STORE_STATS = [
  {
    id: 'products',
    title: 'Total Products',
    description: 'Items available in your shop',
    value: '248',
    iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    id: 'stock',
    title: 'Stock Available',
    description: 'Total quantity in store',
    value: '1,920',
    iconPath: 'M3 7h18M3 12h18M3 17h18',
  },
  {
    id: 'orders',
    title: 'Orders Pending',
    description: 'Orders waiting to be delivered',
    value: '17',
    iconPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  },
  {
    id: 'shipments',
    title: 'Shipments Coming',
    description: 'Products arriving soon',
    value: '6',
    iconPath: 'M9 17a2 2 0 104 0m-4 0a2 2 0 114 0m6-10l2 2v6a2 2 0 01-2 2h-1m-6-1h6M3 5h11a2 2 0 012 2v10H3V5z',
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
