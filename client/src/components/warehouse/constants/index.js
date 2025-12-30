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

// Storage Zones
export const STORAGE_ZONES = [
  { id: 'zone_a1', name: 'Zone A-1', type: 'General', capacity: 500, available: 145 },
  { id: 'zone_a2', name: 'Zone A-2', type: 'General', capacity: 500, available: 320 },
  { id: 'zone_b1', name: 'Zone B-1', type: 'Cold Storage', capacity: 200, available: 45 },
  { id: 'zone_b2', name: 'Zone B-2', type: 'Cold Storage', capacity: 200, available: 120 },
  { id: 'zone_c1', name: 'Zone C-1', type: 'High Security', capacity: 100, available: 35 },
  { id: 'zone_d1', name: 'Zone D-1', type: 'Hazardous', capacity: 50, available: 22 },
];

// Retailers/Destinations
export const RETAILERS = [
  { id: 'ret_001', name: 'MedPharm Retailers', location: 'Mumbai' },
  { id: 'ret_002', name: 'HealthCare Plus', location: 'Delhi' },
  { id: 'ret_003', name: 'Apollo Distributors', location: 'Chennai' },
  { id: 'ret_004', name: 'LifeCare Stores', location: 'Bangalore' },
  { id: 'ret_005', name: 'Wellness Hub', location: 'Hyderabad' },
];

// Demo Incoming Shipments
export const DEMO_SHIPMENTS = [
  {
    id: 'SHP-W001',
    productName: 'Pharmaceutical Supplies Batch A',
    supplier: 'PharmaCorp Industries',
    quantity: 500,
    expectedDate: '2024-12-30',
    status: SHIPMENT_STATUSES.PENDING,
    transporterName: 'FastTrack Logistics',
    temperature: '2-8°C',
    priority: 'high',
    batchNumber: 'BATCH-2024-001',
    metadata: {
      origin: 'Mumbai',
      weight: '250kg',
      dimensions: '2m x 1.5m x 1m',
    },
    blockchainTxId: '0x1a2b3c4d5e6f...',
    createdAt: '2024-12-28T10:30:00Z',
  },
  {
    id: 'SHP-W002',
    productName: 'Electronic Components Kit',
    supplier: 'TechParts Ltd',
    quantity: 1200,
    expectedDate: '2024-12-29',
    status: SHIPMENT_STATUSES.RECEIVED,
    transporterName: 'SecureMove Transport',
    temperature: 'Ambient',
    priority: 'medium',
    batchNumber: 'BATCH-2024-002',
    metadata: {
      origin: 'Delhi',
      weight: '180kg',
      dimensions: '1.5m x 1m x 0.8m',
    },
    blockchainTxId: '0x2b3c4d5e6f7a...',
    createdAt: '2024-12-27T14:15:00Z',
    receivedAt: '2024-12-29T09:00:00Z',
  },
  {
    id: 'SHP-W003',
    productName: 'Medical Equipment Set',
    supplier: 'MedEquip Solutions',
    quantity: 75,
    expectedDate: '2024-12-28',
    status: SHIPMENT_STATUSES.VERIFIED,
    transporterName: 'CarefulCargo',
    temperature: 'Ambient',
    priority: 'high',
    batchNumber: 'BATCH-2024-003',
    metadata: {
      origin: 'Chennai',
      weight: '450kg',
      dimensions: '3m x 2m x 1.5m',
    },
    blockchainTxId: '0x3c4d5e6f7a8b...',
    createdAt: '2024-12-26T08:45:00Z',
    receivedAt: '2024-12-28T10:30:00Z',
    verifiedAt: '2024-12-28T11:00:00Z',
    storageZone: 'zone_c1',
  },
  {
    id: 'SHP-W004',
    productName: 'Vaccine Batch Delta',
    supplier: 'BioVax Pharma',
    quantity: 2000,
    expectedDate: '2024-12-31',
    status: SHIPMENT_STATUSES.STORED,
    transporterName: 'ColdChain Express',
    temperature: '-20°C',
    priority: 'critical',
    batchNumber: 'BATCH-2024-004',
    metadata: {
      origin: 'Hyderabad',
      weight: '120kg',
      dimensions: '1m x 1m x 1m',
    },
    blockchainTxId: '0x4d5e6f7a8b9c...',
    createdAt: '2024-12-25T16:20:00Z',
    receivedAt: '2024-12-27T08:00:00Z',
    verifiedAt: '2024-12-27T09:15:00Z',
    storedAt: '2024-12-27T10:00:00Z',
    storageZone: 'zone_b1',
  },
  {
    id: 'SHP-W005',
    productName: 'Industrial Chemicals',
    supplier: 'ChemWorks Inc',
    quantity: 100,
    expectedDate: '2024-12-29',
    status: SHIPMENT_STATUSES.CONCERN_RAISED,
    transporterName: 'HazMat Movers',
    temperature: 'Controlled',
    priority: 'high',
    batchNumber: 'BATCH-2024-005',
    metadata: {
      origin: 'Bangalore',
      weight: '800kg',
      dimensions: '2m x 1.5m x 1.2m',
    },
    blockchainTxId: '0x5e6f7a8b9c0d...',
    createdAt: '2024-12-24T12:00:00Z',
    receivedAt: '2024-12-29T14:00:00Z',
    concern: {
      type: CONCERN_TYPES.SEAL_BROKEN,
      description: 'Container seal appears tampered. Requires inspection.',
      raisedAt: '2024-12-29T14:30:00Z',
      status: CONCERN_STATUS.OPEN,
    },
  },
];

// Demo Alerts
export const DEMO_ALERTS = [
  {
    id: 'ALT-001',
    type: 'warning',
    title: 'Temperature Excursion Detected',
    message: 'Zone B-1 temperature exceeded threshold by 2°C for 15 minutes',
    timestamp: '2024-12-30T08:15:00Z',
    resolved: false,
  },
  {
    id: 'ALT-002',
    type: 'critical',
    title: 'Shipment Seal Integrity Issue',
    message: 'SHP-W005 container seal appears tampered',
    timestamp: '2024-12-29T14:30:00Z',
    resolved: false,
  },
  {
    id: 'ALT-003',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'Cold storage Zone B-2 maintenance scheduled for tomorrow',
    timestamp: '2024-12-30T06:00:00Z',
    resolved: false,
  },
  {
    id: 'ALT-004',
    type: 'success',
    title: 'Verification Complete',
    message: 'SHP-W003 successfully verified and stored in Zone C-1',
    timestamp: '2024-12-28T11:00:00Z',
    resolved: true,
  },
];

// Demo Blockchain Activities
export const DEMO_BLOCKCHAIN_ACTIVITIES = [
  {
    id: 'TX-001',
    type: 'shipment_received',
    shipmentId: 'SHP-W002',
    txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    timestamp: '2024-12-29T09:00:00Z',
    blockNumber: 19847562,
    gasUsed: '45,234',
    status: 'confirmed',
  },
  {
    id: 'TX-002',
    type: 'verification_complete',
    shipmentId: 'SHP-W003',
    txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    timestamp: '2024-12-28T11:00:00Z',
    blockNumber: 19847123,
    gasUsed: '52,891',
    status: 'confirmed',
  },
  {
    id: 'TX-003',
    type: 'storage_assigned',
    shipmentId: 'SHP-W004',
    txHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    timestamp: '2024-12-27T10:00:00Z',
    blockNumber: 19846789,
    gasUsed: '38,456',
    status: 'confirmed',
  },
  {
    id: 'TX-004',
    type: 'concern_raised',
    shipmentId: 'SHP-W005',
    txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    timestamp: '2024-12-29T14:30:00Z',
    blockNumber: 19847890,
    gasUsed: '61,234',
    status: 'confirmed',
  },
];

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
