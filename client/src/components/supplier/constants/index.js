/**
 * Supplier Dashboard Constants and Utilities
 *
 * SYSTEM PRINCIPLE:
 * Sentinel records shipment identity on-chain while enabling container-level
 * traceability using off-chain QR codes. The blockchain serves as a source of
 * truth for shipment lifecycle events, not as a database for operational data.
 * Off-chain systems handle workflow, while on-chain records provide tamper-proof
 * audit trails.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SHIPMENT STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const SHIPMENT_STATUSES = {
  CREATED: "created",
  READY_FOR_DISPATCH: "ready_for_dispatch",
  IN_TRANSIT: "in_transit",
  AT_WAREHOUSE: "at_warehouse",
  DELIVERED: "delivered",
  CONCERN_RAISED: "concern_raised",
};

// Status Colors for UI
export const STATUS_COLORS = {
  [SHIPMENT_STATUSES.CREATED]: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
    label: "Created",
  },
  [SHIPMENT_STATUSES.READY_FOR_DISPATCH]: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "Ready for Dispatch",
  },
  [SHIPMENT_STATUSES.IN_TRANSIT]: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
    label: "In Transit",
  },
  [SHIPMENT_STATUSES.AT_WAREHOUSE]: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    label: "At Warehouse",
  },
  [SHIPMENT_STATUSES.DELIVERED]: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "Delivered",
  },
  [SHIPMENT_STATUSES.CONCERN_RAISED]: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
    label: "Concern Raised",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CONTAINER_STATUSES = {
  CREATED: "CREATED",
  LOCKED: "LOCKED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
};

export const CONTAINER_STATUS_COLORS = {
  [CONTAINER_STATUSES.CREATED]: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
    label: "Created",
  },
  [CONTAINER_STATUSES.LOCKED]: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "Locked",
  },
  [CONTAINER_STATUSES.IN_TRANSIT]: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
    label: "In Transit",
  },
  [CONTAINER_STATUSES.DELIVERED]: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "Delivered",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONCERN CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CONCERN_TYPES = {
  TEMPERATURE_DEVIATION: "temperature_deviation",
  PACKAGE_DAMAGE: "package_damage",
  DELAY: "delay",
  DOCUMENTATION_ISSUE: "documentation_issue",
  QUANTITY_MISMATCH: "quantity_mismatch",
  OTHER: "other",
};

export const CONCERN_TYPE_LABELS = {
  [CONCERN_TYPES.TEMPERATURE_DEVIATION]: "Temperature Deviation",
  [CONCERN_TYPES.PACKAGE_DAMAGE]: "Package Damage",
  [CONCERN_TYPES.DELAY]: "Delivery Delay",
  [CONCERN_TYPES.DOCUMENTATION_ISSUE]: "Documentation Issue",
  [CONCERN_TYPES.QUANTITY_MISMATCH]: "Quantity Mismatch",
  [CONCERN_TYPES.OTHER]: "Other",
};

export const CONCERN_STATUS = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
  ESCALATED: "escalated",
};

export const CONCERN_STATUS_COLORS = {
  [CONCERN_STATUS.OPEN]: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    label: "Open",
  },
  [CONCERN_STATUS.ACKNOWLEDGED]: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    label: "Acknowledged",
  },
  [CONCERN_STATUS.RESOLVED]: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "Resolved",
  },
  [CONCERN_STATUS.ESCALATED]: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    label: "Escalated",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTER AGENCIES
// ═══════════════════════════════════════════════════════════════════════════

export const TRANSPORTER_AGENCIES = [
  {
    id: "trans_001",
    name: "FastTrack Logistics",
    rating: 4.8,
    specialization: "Cold Chain",
  },
  {
    id: "trans_002",
    name: "SecureMove Transport",
    rating: 4.6,
    specialization: "Fragile Goods",
  },
  {
    id: "trans_003",
    name: "GreenRoute Carriers",
    rating: 4.5,
    specialization: "Eco-Friendly",
  },
  {
    id: "trans_004",
    name: "PharmaFleet",
    rating: 4.9,
    specialization: "Pharmaceuticals",
  },
  {
    id: "trans_005",
    name: "GlobalChain Express",
    rating: 4.7,
    specialization: "International",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSES
// ═══════════════════════════════════════════════════════════════════════════

export const WAREHOUSES = [
  {
    id: "wh_001",
    name: "Central Distribution Hub",
    location: "Mumbai",
    capacity: "High",
    available: true,
  },
  {
    id: "wh_002",
    name: "Northern Logistics Center",
    location: "Delhi",
    capacity: "High",
    available: true,
  },
  {
    id: "wh_003",
    name: "Southern Storage Facility",
    location: "Chennai",
    capacity: "Medium",
    available: false,
    unavailableReason: "Under Maintenance",
  },
  {
    id: "wh_004",
    name: "Western Cold Storage",
    location: "Ahmedabad",
    capacity: "Medium",
    available: false,
    unavailableReason: "At Full Capacity",
  },
  {
    id: "wh_005",
    name: "Eastern Warehouse Complex",
    location: "Kolkata",
    capacity: "High",
    available: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a random short ID for container identification
 * @returns {string} A 6-character alphanumeric ID
 */
export const generateShortId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a cryptographic shipment hash based on batch, wallet, and timestamp
 * This hash is system-generated and immutable once created
 * @param {string} batchId - The batch identifier
 * @param {string} walletAddress - The supplier's wallet address
 * @returns {string} A unique shipment hash
 */
export const generateShipmentHash = (batchId, walletAddress) => {
  const timestamp = Date.now();
  const dataString = `${batchId}-${walletAddress}-${timestamp}`;

  // Simple hash simulation (in production, use crypto.subtle or similar)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex and format
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `SHP-${hexHash}-${timestamp.toString(36).toUpperCase()}`;
};

/**
 * Generate a container ID for a specific shipment
 * Format: CONTAINER-{shipmentHash}-{randomShortId}
 * @param {string} shipmentHash - The parent shipment's hash
 * @returns {string} A unique container ID
 */
export const generateContainerId = (shipmentHash) => {
  const shortId = generateShortId();
  // Use last 8 chars of shipment hash for brevity
  const shipmentRef = shipmentHash.slice(-8);
  return `CONTAINER-${shipmentRef}-${shortId}`;
};

/**
 * Generate containers for a shipment
 * @param {string} shipmentHash - The parent shipment's hash
 * @param {number} numberOfContainers - Number of containers to generate
 * @param {string} batchId - The batch ID from the shipment
 * @returns {Array} Array of container objects
 */
export const generateContainers = (
  shipmentHash,
  numberOfContainers,
  batchId
) => {
  const containers = [];
  for (let i = 0; i < numberOfContainers; i++) {
    const containerId = generateContainerId(shipmentHash);

    containers.push({
      containerId,
      batchId,
      shipmentHash,
      qrData: containerId, // QR encodes ONLY the unique containerId
      status: CONTAINER_STATUSES.CREATED,
      scannedBy: null, // Will be set when scanned by transporter/warehouse
      scannedAt: null,
      createdAt: Date.now(),
    });
  }
  return containers;
};

/**
 * Generate a metadata hash for off-chain storage reference
 * @param {object} metadata - The metadata object to hash
 * @returns {string} A hash reference for the metadata
 */
export const generateMetadataHash = (metadata) => {
  const dataString = JSON.stringify(metadata);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `META-${Math.abs(hash).toString(16).toUpperCase().padStart(12, "0")}`;
};

/**
 * Decode QR data from container
 * @param {string} qrData - The QR code data string (containerId only)
 * @returns {object|null} Object with containerId or null if invalid
 *
 * QR Code Data Structure (simplified):
 * The QR code contains ONLY the unique containerId string.
 * Example: "CONTAINER-1A2B3C4D-XYZ789"
 */
export const decodeContainerQR = (qrData) => {
  try {
    // QR now contains only the containerId string
    if (!qrData || typeof qrData !== "string") {
      console.error("Invalid QR data: empty or not a string");
      return null;
    }

    // Validate containerId format (CONTAINER-{shipmentRef}-{shortId})
    if (!qrData.startsWith("CONTAINER-")) {
      console.error("Invalid QR data format:", qrData);
      return null;
    }

    return { containerId: qrData };
  } catch (error) {
    console.error("Failed to decode QR data:", error);
    return null;
  }
};

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get status label from status value
 * @param {string} status - The status value
 * @returns {string} Human-readable status label
 */
export const getStatusLabel = (status) => {
  return STATUS_COLORS[status]?.label || status;
};

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const SUPPLIER_ACTIONS = {
  CREATE_SHIPMENT: "create_shipment",
  ASSIGN_TRANSPORTER: "assign_transporter",
  MARK_READY: "mark_ready_for_dispatch",
  UPLOAD_METADATA: "upload_metadata",
  ACKNOWLEDGE_CONCERN: "acknowledge_concern",
  RESOLVE_CONCERN: "resolve_concern",
  VIEW_DETAILS: "view_details",
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
  [SHIPMENT_STATUSES.IN_TRANSIT]: [SUPPLIER_ACTIONS.VIEW_DETAILS],
  [SHIPMENT_STATUSES.AT_WAREHOUSE]: [SUPPLIER_ACTIONS.VIEW_DETAILS],
  [SHIPMENT_STATUSES.DELIVERED]: [SUPPLIER_ACTIONS.VIEW_DETAILS],
  [SHIPMENT_STATUSES.CONCERN_RAISED]: [
    SUPPLIER_ACTIONS.ACKNOWLEDGE_CONCERN,
    SUPPLIER_ACTIONS.RESOLVE_CONCERN,
    SUPPLIER_ACTIONS.VIEW_DETAILS,
  ],
};
