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

// Demo Supplier Wallet
export const DEMO_SUPPLIER_WALLET = {
  address: '0x742d35Cc6634C0532925a3b844Fc870F5FBcA678',
  shortAddress: '0x742d...A678',
  balance: '2.45 ETH',
  network: 'Ethereum Mainnet',
  isConnected: true,
};

// Demo Products with Batch History (for batch ID suggestions)
export const DEMO_PRODUCTS = {
  'Organic Olive Oil': {
    category: 'Food & Beverage',
    lastBatchId: 'OOO-2024-003',
    batchHistory: ['OOO-2024-001', 'OOO-2024-002', 'OOO-2024-003'],
  },
  'Premium Coffee Beans': {
    category: 'Food & Beverage',
    lastBatchId: 'PCB-2024-002',
    batchHistory: ['PCB-2024-001', 'PCB-2024-002'],
  },
  'Pharmaceutical Grade Insulin': {
    category: 'Pharmaceuticals',
    lastBatchId: 'PGI-2024-005',
    batchHistory: ['PGI-2024-003', 'PGI-2024-004', 'PGI-2024-005'],
  },
  'Electronic Components': {
    category: 'Electronics',
    lastBatchId: 'EC-2024-001',
    batchHistory: ['EC-2024-001'],
  },
  'Artisan Cheese Collection': {
    category: 'Food & Beverage',
    lastBatchId: null,
    batchHistory: [],
  },
};

// Common product names for quick selection
export const PRODUCT_SUGGESTIONS = Object.keys(DEMO_PRODUCTS);

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
 * Suggest the next batch ID based on product history
 */
export const suggestNextBatchId = (productName) => {
  const product = DEMO_PRODUCTS[productName];
  
  if (!product || !product.lastBatchId) {
    // Generate a new batch ID format for new products
    const prefix = productName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    const year = new Date().getFullYear();
    return `${prefix}-${year}-001`;
  }
  
  // Increment the last batch ID
  const lastBatch = product.lastBatchId;
  const parts = lastBatch.split('-');
  const lastNumber = parseInt(parts[parts.length - 1], 10);
  parts[parts.length - 1] = String(lastNumber + 1).padStart(3, '0');
  
  return parts.join('-');
};

/**
 * Check if a batch ID already exists for a product
 */
export const isBatchIdDuplicate = (productName, batchId) => {
  const product = DEMO_PRODUCTS[productName];
  if (!product) return false;
  return product.batchHistory.includes(batchId);
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

// Demo Shipments with Concerns
export const DEMO_SHIPMENTS = [
  {
    id: 'SHP-A3F2C891-LK8M2N',
    batchId: 'OOO-2024-003',
    productName: 'Organic Olive Oil',
    quantity: 500,
    unit: 'bottles',
    status: SHIPMENT_STATUSES.IN_TRANSIT,
    createdAt: Date.now() - 86400000 * 3,
    transporterId: 'trans_001',
    transporterName: 'FastTrack Logistics',
    metadata: {
      hash: 'META-0A1B2C3D4E5F',
      documents: ['certificate_of_origin.pdf', 'quality_report.pdf'],
      uploadedAt: Date.now() - 86400000 * 2,
    },
    concerns: [],
  },
  {
    id: 'SHP-B7E4D123-MN9P3Q',
    batchId: 'PCB-2024-002',
    productName: 'Premium Coffee Beans',
    quantity: 200,
    unit: 'kg',
    status: SHIPMENT_STATUSES.CONCERN_RAISED,
    createdAt: Date.now() - 86400000 * 5,
    transporterId: 'trans_003',
    transporterName: 'GreenRoute Carriers',
    metadata: {
      hash: 'META-1F2E3D4C5B6A',
      documents: ['organic_certification.pdf'],
      uploadedAt: Date.now() - 86400000 * 4,
    },
    concerns: [
      {
        id: 'CON-001',
        type: CONCERN_TYPES.DELAY,
        status: CONCERN_STATUS.OPEN,
        raisedBy: 'Transporter',
        raisedAt: Date.now() - 86400000,
        description: 'Unexpected road closure causing 2-day delay in delivery schedule.',
        acknowledgedAt: null,
        resolvedAt: null,
        resolution: null,
      },
    ],
  },
  {
    id: 'SHP-C9F8E567-QR2S4T',
    batchId: 'PGI-2024-005',
    productName: 'Pharmaceutical Grade Insulin',
    quantity: 1000,
    unit: 'units',
    status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
    createdAt: Date.now() - 86400000,
    transporterId: 'trans_004',
    transporterName: 'PharmaFleet',
    metadata: null,
    concerns: [],
  },
  {
    id: 'SHP-D2A1B345-UV5W6X',
    batchId: 'EC-2024-001',
    productName: 'Electronic Components',
    quantity: 5000,
    unit: 'pieces',
    status: SHIPMENT_STATUSES.CREATED,
    createdAt: Date.now() - 3600000 * 2,
    transporterId: null,
    transporterName: null,
    metadata: null,
    concerns: [],
  },
  {
    id: 'SHP-E5C4D678-YZ7A8B',
    batchId: 'OOO-2024-002',
    productName: 'Organic Olive Oil',
    quantity: 300,
    unit: 'bottles',
    status: SHIPMENT_STATUSES.DELIVERED,
    createdAt: Date.now() - 86400000 * 10,
    transporterId: 'trans_002',
    transporterName: 'SecureMove Transport',
    metadata: {
      hash: 'META-9A8B7C6D5E4F',
      documents: ['delivery_confirmation.pdf', 'invoice.pdf'],
      uploadedAt: Date.now() - 86400000 * 9,
    },
    concerns: [
      {
        id: 'CON-002',
        type: CONCERN_TYPES.PACKAGE_DAMAGE,
        status: CONCERN_STATUS.RESOLVED,
        raisedBy: 'Receiver',
        raisedAt: Date.now() - 86400000 * 8,
        description: 'Minor damage to outer packaging of 5 bottles. Contents intact.',
        acknowledgedAt: Date.now() - 86400000 * 7,
        resolvedAt: Date.now() - 86400000 * 6,
        resolution: 'Replacement shipment sent for damaged packaging. Claim filed with transporter.',
      },
    ],
  },
  // Additional sample data for testing
  {
    id: 'SHP-F6G7H890-CD3E4F',
    batchId: 'ACC-2024-001',
    productName: 'Artisan Cheese Collection',
    quantity: 150,
    unit: 'boxes',
    status: SHIPMENT_STATUSES.IN_TRANSIT,
    createdAt: Date.now() - 86400000 * 2,
    transporterId: 'trans_001',
    transporterName: 'FastTrack Logistics',
    metadata: {
      hash: 'META-2B3C4D5E6F7G',
      documents: ['temperature_log.pdf', 'cold_chain_cert.pdf'],
      uploadedAt: Date.now() - 86400000 * 1.5,
    },
    concerns: [
      {
        id: 'CON-003',
        type: CONCERN_TYPES.TEMPERATURE_DEVIATION,
        status: CONCERN_STATUS.ACKNOWLEDGED,
        raisedBy: 'Transporter',
        raisedAt: Date.now() - 86400000 * 0.5,
        description: 'Temperature rose to 8°C for 30 minutes during transfer. Now stabilized at 4°C.',
        acknowledgedAt: Date.now() - 3600000 * 6,
        resolvedAt: null,
        resolution: null,
      },
    ],
  },
  {
    id: 'SHP-G8H9I012-EF5G6H',
    batchId: 'WNE-2024-004',
    productName: 'Premium Red Wine',
    quantity: 240,
    unit: 'bottles',
    status: SHIPMENT_STATUSES.DELIVERED,
    createdAt: Date.now() - 86400000 * 15,
    transporterId: 'trans_002',
    transporterName: 'SecureMove Transport',
    metadata: {
      hash: 'META-3C4D5E6F7G8H',
      documents: ['age_verification.pdf', 'customs_clearance.pdf', 'delivery_receipt.pdf'],
      uploadedAt: Date.now() - 86400000 * 14,
    },
    concerns: [],
  },
  {
    id: 'SHP-H1I2J345-GH7I8J',
    batchId: 'MED-2024-012',
    productName: 'Medical Supplies Kit',
    quantity: 500,
    unit: 'kits',
    status: SHIPMENT_STATUSES.CONCERN_RAISED,
    createdAt: Date.now() - 86400000 * 4,
    transporterId: 'trans_004',
    transporterName: 'PharmaFleet',
    metadata: {
      hash: 'META-4D5E6F7G8H9I',
      documents: ['fda_approval.pdf', 'sterility_cert.pdf'],
      uploadedAt: Date.now() - 86400000 * 3.5,
    },
    concerns: [
      {
        id: 'CON-004',
        type: CONCERN_TYPES.QUANTITY_MISMATCH,
        status: CONCERN_STATUS.OPEN,
        raisedBy: 'Receiver',
        raisedAt: Date.now() - 3600000 * 12,
        description: 'Received 485 kits instead of 500. 15 kits missing from the shipment.',
        acknowledgedAt: null,
        resolvedAt: null,
        resolution: null,
      },
      {
        id: 'CON-005',
        type: CONCERN_TYPES.DOCUMENTATION_ISSUE,
        status: CONCERN_STATUS.ACKNOWLEDGED,
        raisedBy: 'Customs',
        raisedAt: Date.now() - 86400000 * 2,
        description: 'Missing import declaration form for medical supplies.',
        acknowledgedAt: Date.now() - 86400000 * 1.5,
        resolvedAt: null,
        resolution: null,
      },
    ],
  },
  {
    id: 'SHP-I3J4K567-IJ9K0L',
    batchId: 'ORG-2024-007',
    productName: 'Organic Honey',
    quantity: 1000,
    unit: 'jars',
    status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
    createdAt: Date.now() - 86400000 * 0.5,
    transporterId: 'trans_003',
    transporterName: 'GreenRoute Carriers',
    metadata: {
      hash: 'META-5E6F7G8H9I0J',
      documents: ['organic_cert.pdf'],
      uploadedAt: Date.now() - 3600000 * 8,
    },
    concerns: [],
  },
  {
    id: 'SHP-J5K6L789-KL1M2N',
    batchId: 'TEX-2024-003',
    productName: 'Premium Silk Fabric',
    quantity: 2000,
    unit: 'meters',
    status: SHIPMENT_STATUSES.CREATED,
    createdAt: Date.now() - 3600000 * 5,
    transporterId: null,
    transporterName: null,
    metadata: null,
    concerns: [],
  },
  {
    id: 'SHP-K7L8M901-MN3O4P',
    batchId: 'SPR-2024-008',
    productName: 'Auto Spare Parts',
    quantity: 350,
    unit: 'units',
    status: SHIPMENT_STATUSES.IN_TRANSIT,
    createdAt: Date.now() - 86400000 * 6,
    transporterId: 'trans_005',
    transporterName: 'GlobalChain Express',
    metadata: {
      hash: 'META-6F7G8H9I0J1K',
      documents: ['parts_manifest.pdf', 'warranty_docs.pdf'],
      uploadedAt: Date.now() - 86400000 * 5.5,
    },
    concerns: [],
  },
  {
    id: 'SHP-L9M0N123-OP5Q6R',
    batchId: 'FRZ-2024-002',
    productName: 'Frozen Seafood',
    quantity: 800,
    unit: 'kg',
    status: SHIPMENT_STATUSES.DELIVERED,
    createdAt: Date.now() - 86400000 * 20,
    transporterId: 'trans_001',
    transporterName: 'FastTrack Logistics',
    metadata: {
      hash: 'META-7G8H9I0J1K2L',
      documents: ['cold_chain_log.pdf', 'health_cert.pdf', 'customs_docs.pdf'],
      uploadedAt: Date.now() - 86400000 * 19,
    },
    concerns: [
      {
        id: 'CON-006',
        type: CONCERN_TYPES.TEMPERATURE_DEVIATION,
        status: CONCERN_STATUS.RESOLVED,
        raisedBy: 'Quality Inspector',
        raisedAt: Date.now() - 86400000 * 18,
        description: 'Temperature spike detected during cross-dock transfer.',
        acknowledgedAt: Date.now() - 86400000 * 17.5,
        resolvedAt: Date.now() - 86400000 * 17,
        resolution: 'Product inspected and cleared. Temperature was within safe limits for seafood.',
      },
    ],
  },
  {
    id: 'SHP-M1N2O345-QR7S8T',
    batchId: 'COS-2024-006',
    productName: 'Luxury Cosmetics Set',
    quantity: 600,
    unit: 'sets',
    status: SHIPMENT_STATUSES.IN_TRANSIT,
    createdAt: Date.now() - 86400000 * 1,
    transporterId: 'trans_002',
    transporterName: 'SecureMove Transport',
    metadata: {
      hash: 'META-8H9I0J1K2L3M',
      documents: ['product_catalog.pdf', 'msds.pdf'],
      uploadedAt: Date.now() - 3600000 * 18,
    },
    concerns: [],
  },
  {
    id: 'SHP-N3O4P567-ST9U0V',
    batchId: 'CHM-2024-001',
    productName: 'Industrial Chemicals',
    quantity: 50,
    unit: 'drums',
    status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
    createdAt: Date.now() - 3600000 * 36,
    transporterId: 'trans_005',
    transporterName: 'GlobalChain Express',
    metadata: {
      hash: 'META-9I0J1K2L3M4N',
      documents: ['hazmat_cert.pdf', 'handling_instructions.pdf', 'emergency_response.pdf'],
      uploadedAt: Date.now() - 3600000 * 30,
    },
    concerns: [],
  },
  {
    id: 'SHP-O5P6Q789-UV1W2X',
    batchId: 'VIT-2024-009',
    productName: 'Vitamin Supplements',
    quantity: 10000,
    unit: 'bottles',
    status: SHIPMENT_STATUSES.DELIVERED,
    createdAt: Date.now() - 86400000 * 25,
    transporterId: 'trans_004',
    transporterName: 'PharmaFleet',
    metadata: {
      hash: 'META-0J1K2L3M4N5O',
      documents: ['gmp_cert.pdf', 'lab_analysis.pdf', 'batch_record.pdf'],
      uploadedAt: Date.now() - 86400000 * 24,
    },
    concerns: [],
  },
  {
    id: 'SHP-P7Q8R901-WX3Y4Z',
    batchId: 'BAK-2024-011',
    productName: 'Artisan Bakery Items',
    quantity: 250,
    unit: 'assorted',
    status: SHIPMENT_STATUSES.CONCERN_RAISED,
    createdAt: Date.now() - 86400000 * 1.5,
    transporterId: 'trans_003',
    transporterName: 'GreenRoute Carriers',
    metadata: null,
    concerns: [
      {
        id: 'CON-007',
        type: CONCERN_TYPES.PACKAGE_DAMAGE,
        status: CONCERN_STATUS.OPEN,
        raisedBy: 'Transporter',
        raisedAt: Date.now() - 3600000 * 8,
        description: 'Outer packaging damaged during loading. Some items may be affected.',
        acknowledgedAt: null,
        resolvedAt: null,
        resolution: null,
      },
    ],
  },
];

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
