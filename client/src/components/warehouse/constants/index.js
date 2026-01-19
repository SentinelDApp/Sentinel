// Warehouse Dashboard Constants and Utilities

/**
 * WAREHOUSE STATE FLOW (LOCKED):
 * READY_FOR_DISPATCH → IN_TRANSIT → AT_WAREHOUSE → READY_FOR_DISPATCH (next leg)
 * 
 * WAREHOUSE ROLE:
 * - Can ONLY scan containers when shipment.status === "IN_TRANSIT"
 * - Each container can be scanned ONLY ONCE by warehouse
 * - When ALL containers are scanned → shipment.status becomes AT_WAREHOUSE
 * - ONLY AFTER AT_WAREHOUSE → can assign next transporter & retailer
 * - ONLY AFTER assignment → can mark READY_FOR_DISPATCH
 */

// Shipment Status Constants - matches backend SHIPMENT_STATUS
export const SHIPMENT_STATUSES = {
  CREATED: 'CREATED',
  READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_WAREHOUSE: 'AT_WAREHOUSE',
  DELIVERED: 'DELIVERED',
};

// Warehouse-specific UI status labels
export const WAREHOUSE_STATUS_LABELS = {
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: 'Awaiting Pickup',
  [SHIPMENT_STATUSES.IN_TRANSIT]: 'In Transit',
  [SHIPMENT_STATUSES.AT_WAREHOUSE]: 'At Warehouse',
  [SHIPMENT_STATUSES.DELIVERED]: 'Delivered',
};

// Status Colors for UI
export const STATUS_COLORS = {
  [SHIPMENT_STATUSES.CREATED]: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    label: 'Created',
  },
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Ready for Dispatch',
  },
  [SHIPMENT_STATUSES.IN_TRANSIT]: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'In Transit',
  },
  [SHIPMENT_STATUSES.AT_WAREHOUSE]: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'At Warehouse',
  },
  [SHIPMENT_STATUSES.DELIVERED]: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Delivered',
  },
};

// Helper to check if warehouse can scan this shipment
// Accepts both lowercase backend status and uppercase constants
export const canWarehouseScan = (shipmentStatus) => {
  const normalizedStatus = shipmentStatus?.toUpperCase() || '';
  return normalizedStatus === SHIPMENT_STATUSES.IN_TRANSIT || shipmentStatus === 'in_transit';
};

// Helper to check if warehouse can assign next leg
export const canAssignNextLeg = (shipmentStatus) => {
  const normalizedStatus = shipmentStatus?.toUpperCase() || '';
  return normalizedStatus === SHIPMENT_STATUSES.AT_WAREHOUSE || shipmentStatus === 'at_warehouse';
};

// Helper to check if warehouse can mark ready for dispatch
export const canMarkReadyForDispatch = (shipmentStatus, hasNextTransporter, hasRetailer) => {
  const normalizedStatus = shipmentStatus?.toUpperCase() || '';
  const isAtWarehouse = normalizedStatus === SHIPMENT_STATUSES.AT_WAREHOUSE || shipmentStatus === 'at_warehouse';
  return isAtWarehouse && hasNextTransporter && hasRetailer;
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

// Get status badge colors for a given status
export const getStatusBadge = (status) => {
  const normalizedStatus = status?.toUpperCase() || '';
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS[SHIPMENT_STATUSES.CREATED];
};

// Map backend status to display label
export const getStatusLabel = (status) => {
  const normalizedStatus = status?.toUpperCase() || '';
  const colors = STATUS_COLORS[normalizedStatus];
  return colors?.label || status || 'Unknown';
};

// Get display name for status (alias for getStatusLabel)
export const getStatusDisplayName = (status) => {
  return getStatusLabel(status);
};

// Get color variant for status badge
export const getStatusVariant = (status) => {
  const normalizedStatus = status?.toUpperCase() || '';
  switch (normalizedStatus) {
    case SHIPMENT_STATUSES.IN_TRANSIT:
      return 'blue';
    case SHIPMENT_STATUSES.AT_WAREHOUSE:
      return 'purple';
    case SHIPMENT_STATUSES.READY_FOR_DISPATCH:
      return 'amber';
    case SHIPMENT_STATUSES.DELIVERED:
      return 'emerald';
    default:
      return 'slate';
  }
};
