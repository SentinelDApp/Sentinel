// Supplier Dashboard Constants and Utilities

// Shipment Status Constants
export const SHIPMENT_STATUSES = {
  CREATED: 'created',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CONCERN_RAISED: 'concern_raised',
};

// Status Colors for UI
export const STATUS_COLORS = {
  [SHIPMENT_STATUSES.CREATED]: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Created',
  },
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Ready for Dispatch',
  },
  [SHIPMENT_STATUSES.IN_TRANSIT]: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'In Transit',
  },
  [SHIPMENT_STATUSES.DELIVERED]: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Delivered',
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
  DELAY: 'delay',
  DOCUMENTATION_ISSUE: 'documentation_issue',
  QUANTITY_MISMATCH: 'quantity_mismatch',
  OTHER: 'other',
};

export const CONCERN_TYPE_LABELS = {
  [CONCERN_TYPES.TEMPERATURE_DEVIATION]: 'Temperature Deviation',
  [CONCERN_TYPES.PACKAGE_DAMAGE]: 'Package Damage',
  [CONCERN_TYPES.DELAY]: 'Delivery Delay',
  [CONCERN_TYPES.DOCUMENTATION_ISSUE]: 'Documentation Issue',
  [CONCERN_TYPES.QUANTITY_MISMATCH]: 'Quantity Mismatch',
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

// Transporter Agencies
export const TRANSPORTER_AGENCIES = [
  { id: 'trans_001', name: 'FastTrack Logistics', rating: 4.8, specialization: 'Cold Chain' },
  { id: 'trans_002', name: 'SecureMove Transport', rating: 4.6, specialization: 'Fragile Goods' },
  { id: 'trans_003', name: 'GreenRoute Carriers', rating: 4.5, specialization: 'Eco-Friendly' },
  { id: 'trans_004', name: 'PharmaFleet', rating: 4.9, specialization: 'Pharmaceuticals' },
  { id: 'trans_005', name: 'GlobalChain Express', rating: 4.7, specialization: 'International' },
];



/**
 * Generate a cryptographic shipment ID based on product, batch, wallet, and timestamp
 * Uses a simple hash simulation for demo purposes
 */
export const generateShipmentId = (productName, batchId, walletAddress) => {
  const timestamp = Date.now();
  const dataString = `${productName}-${batchId}-${walletAddress}-${timestamp}`;
  
  // Simple hash simulation (in production, use crypto.subtle or similar)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and format
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `SHP-${hexHash}-${timestamp.toString(36).toUpperCase()}`;
};

/**
 * Generate a metadata hash for off-chain storage reference
 */
export const generateMetadataHash = (metadata) => {
  const dataString = JSON.stringify(metadata);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `META-${Math.abs(hash).toString(16).toUpperCase().padStart(12, '0')}`;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status label from status value
 */
export const getStatusLabel = (status) => {
  return STATUS_COLORS[status]?.label || status;
};

// Supplier Actions (what supplier can do)
export const SUPPLIER_ACTIONS = {
  CREATE_SHIPMENT: 'create_shipment',
  ASSIGN_TRANSPORTER: 'assign_transporter',
  MARK_READY: 'mark_ready_for_dispatch',
  UPLOAD_METADATA: 'upload_metadata',
  ACKNOWLEDGE_CONCERN: 'acknowledge_concern',
  RESOLVE_CONCERN: 'resolve_concern',
  VIEW_DETAILS: 'view_details',
};

// Actions available per status
export const ACTIONS_BY_STATUS = {
  [SHIPMENT_STATUSES.CREATED]: [
    SUPPLIER_ACTIONS.ASSIGN_TRANSPORTER,
    SUPPLIER_ACTIONS.UPLOAD_METADATA,
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: [
    SUPPLIER_ACTIONS.UPLOAD_METADATA,
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
  [SHIPMENT_STATUSES.IN_TRANSIT]: [
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
  [SHIPMENT_STATUSES.DELIVERED]: [
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
  [SHIPMENT_STATUSES.CONCERN_RAISED]: [
    SUPPLIER_ACTIONS.ACKNOWLEDGE_CONCERN,
    SUPPLIER_ACTIONS.RESOLVE_CONCERN,
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
};
