/**
 * Shipment API Service
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BLOCKCHAIN INDEXER API CLIENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service fetches shipment and container data from the backend API.
 * The backend acts as a blockchain indexer - all data originates from
 * ShipmentLocked events on the smart contract.
 * 
 * These are READ-ONLY operations - shipments are created by locking to
 * the blockchain, which triggers the backend indexer to store them.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map backend status (UPPERCASE) to frontend status (lowercase)
 */
const STATUS_MAP = {
  'READY_FOR_DISPATCH': 'ready_for_dispatch',
  'IN_TRANSIT': 'in_transit',
  'AT_WAREHOUSE': 'at_warehouse',
  'DELIVERED': 'delivered',
  'CREATED': 'created',
};

/**
 * Map frontend status to backend status
 */
const REVERSE_STATUS_MAP = {
  'ready_for_dispatch': 'READY_FOR_DISPATCH',
  'in_transit': 'IN_TRANSIT',
  'at_warehouse': 'AT_WAREHOUSE',
  'delivered': 'DELIVERED',
  'created': 'CREATED',
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA TRANSFORMERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform backend shipment data to frontend format
 */
const transformShipment = (backendShipment, containers = []) => {
  return {
    // Core identifiers
    id: backendShipment.shipmentHash,
    shipmentHash: backendShipment.shipmentHash,
    batchId: backendShipment.batchId,
    
    // Product info (derived from batchId for now)
    productName: `Batch ${backendShipment.batchId}`,
    
    // Quantities
    quantity: backendShipment.totalQuantity,
    numberOfContainers: backendShipment.numberOfContainers,
    quantityPerContainer: backendShipment.quantityPerContainer,
    totalQuantity: backendShipment.totalQuantity,
    unit: 'units',
    
    // Status (convert from backend uppercase to frontend lowercase)
    status: STATUS_MAP[backendShipment.status] || 'created',
    
    // Blockchain data - only locked if txHash exists
    isLocked: !!backendShipment.txHash,
    blockchainTxHash: backendShipment.txHash || null,
    txHash: backendShipment.txHash || null,
    blockNumber: backendShipment.blockNumber || null,
    blockchainTimestamp: backendShipment.blockchainTimestamp || null,
    
    // Supplier info
    supplierWallet: backendShipment.supplierWallet,
    
    // Containers (transformed)
    containers: containers.map(transformContainer),
    
    // Timestamps
    createdAt: backendShipment.createdAt,
    
    // Supporting documents (uploaded to Cloudinary)
    supportingDocuments: backendShipment.supportingDocuments || [],
    
    // Assigned stakeholders (new format)
    assignedTransporter: backendShipment.assignedTransporter || null,
    assignedWarehouse: backendShipment.assignedWarehouse || null,
    
    // Transporter info (legacy format for backward compatibility)
    transporterWallet: backendShipment.assignedTransporter?.walletAddress || backendShipment.transporterWallet || null,
    transporterName: backendShipment.assignedTransporter?.name || backendShipment.transporterName || null,
    
    // Warehouse info (legacy format for backward compatibility)
    warehouseWallet: backendShipment.assignedWarehouse?.walletAddress || backendShipment.warehouseWallet || null,
    warehouseName: backendShipment.assignedWarehouse?.name || backendShipment.warehouseName || null,
    
    // UI state defaults
    concerns: [],
    metadata: [],
  };
};

/**
 * Transform backend container data to frontend format
 */
const transformContainer = (backendContainer) => {
  return {
    id: backendContainer.containerId,
    containerId: backendContainer.containerId,
    containerNumber: backendContainer.containerNumber,
    quantity: backendContainer.quantity,
    status: backendContainer.status, // Keep as-is (CREATED, LOCKED, etc.)
    qrData: backendContainer.qrData,
    createdAt: backendContainer.createdAt,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all shipments for a supplier wallet
 * @param {string} supplierWallet - The supplier's Ethereum wallet address
 * @param {Object} options - Query options (page, limit, status)
 * @returns {Promise<{shipments: Array, pagination: Object}>}
 */
export const fetchShipments = async (supplierWallet, options = {}) => {
  const { page = 1, limit = 50, status } = options;
  
  let url = `${API_BASE_URL}/api/shipments?page=${page}&limit=${limit}`;
  
  if (supplierWallet) {
    url += `&supplierWallet=${supplierWallet}`;
  }
  
  if (status) {
    // Convert frontend status to backend format
    const backendStatus = REVERSE_STATUS_MAP[status] || status.toUpperCase();
    url += `&status=${backendStatus}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch shipments: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch shipments');
  }

  // Transform shipments to frontend format
  const shipments = result.data.map(shipment => transformShipment(shipment));

  return {
    shipments,
    pagination: result.pagination,
  };
};

/**
 * Fetch a single shipment by its hash
 * @param {string} shipmentHash - The unique shipment identifier
 * @returns {Promise<Object>} - Transformed shipment object
 */
export const fetchShipmentByHash = async (shipmentHash) => {
  const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentHash}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch shipment: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch shipment');
  }

  return transformShipment(result.data);
};

/**
 * Fetch containers for a shipment
 * @param {string} shipmentHash - The shipment identifier
 * @param {Object} options - Query options (page, limit, status)
 * @returns {Promise<{containers: Array, shipment: Object, pagination: Object}>}
 */
export const fetchContainers = async (shipmentHash, options = {}) => {
  const { page = 1, limit = 100, status } = options;
  
  let url = `${API_BASE_URL}/api/containers/${shipmentHash}?page=${page}&limit=${limit}`;
  
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      return { containers: [], shipment: null, pagination: null };
    }
    throw new Error(`Failed to fetch containers: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch containers');
  }

  return {
    containers: result.data.containers.map(transformContainer),
    shipment: result.data.shipment,
    pagination: result.pagination,
  };
};

/**
 * Fetch a single container by its ID
 * @param {string} containerId - The unique container identifier
 * @returns {Promise<{container: Object, shipment: Object}>}
 */
export const fetchContainerById = async (containerId) => {
  const response = await fetch(`${API_BASE_URL}/api/containers/single/${containerId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return { container: null, shipment: null };
    }
    throw new Error(`Failed to fetch container: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch container');
  }

  return {
    container: transformContainer(result.data.container),
    shipment: result.data.shipment,
  };
};

/**
 * Fetch shipment statistics
 * @param {string} supplierWallet - Optional supplier wallet to filter stats
 * @returns {Promise<Object>} - Statistics object
 */
export const fetchShipmentStats = async (supplierWallet) => {
  let url = `${API_BASE_URL}/api/shipments/stats/summary`;
  
  if (supplierWallet) {
    url += `?supplierWallet=${supplierWallet}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch shipment stats: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch shipment stats');
  }

  return result.data;
};

/**
 * Fetch blockchain indexer status
 * @returns {Promise<Object>} - Indexer status object
 */
export const fetchIndexerStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/api/indexer/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch indexer status: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch indexer status');
  }

  return result.data;
};

/**
 * Create a new shipment off-chain (before blockchain confirmation)
 * @param {Object} shipmentData - Shipment data
 * @returns {Promise<Object>} - Created shipment
 */
export const createShipment = async (shipmentData) => {
  const response = await fetch(`${API_BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipmentData),
  });

  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to create shipment');
  }

  return transformShipment(result.data);
};

/**
 * Lock a shipment on blockchain (update with txHash)
 * @param {string} shipmentHash - The shipment identifier
 * @param {Object} lockData - Blockchain lock data (txHash, blockNumber, blockchainTimestamp)
 * @returns {Promise<Object>} - Updated shipment
 */
export const lockShipment = async (shipmentHash, lockData) => {
  const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentHash}/lock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lockData),
  });

  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to lock shipment');
  }

  return transformShipment(result.data);
};

// ═══════════════════════════════════════════════════════════════════════════
// USER FETCHING API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch users by role for assignment purposes
 * @param {string} role - The role to filter by (TRANSPORTER, WAREHOUSE)
 * @param {string} authToken - JWT token for authentication
 * @returns {Promise<Array>} - Array of users
 */
export const fetchUsersByRole = async (role, authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/users?role=${role}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${role} users: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || `Failed to fetch ${role} users`);
  }

  return result.data;
};

/**
 * Fetch all active transporters
 * @param {string} authToken - JWT token for authentication
 * @returns {Promise<Array>} - Array of transporter users
 */
export const fetchTransporters = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/users/transporters`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transporters: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch transporters');
  }

  return result.data;
};

/**
 * Fetch all active warehouses
 * @param {string} authToken - JWT token for authentication
 * @returns {Promise<Array>} - Array of warehouse users
 */
export const fetchWarehouses = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/users/warehouses`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch warehouses');
  }

  return result.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-BASED SHIPMENT FETCHING API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch shipments assigned to a transporter
 * @param {string} transporterWallet - The transporter's wallet address
 * @param {Object} options - Query options (page, limit, status)
 * @returns {Promise<{shipments: Array, pagination: Object}>}
 */
export const fetchTransporterShipments = async (transporterWallet, options = {}) => {
  const { page = 1, limit = 50, status } = options;
  
  let url = `${API_BASE_URL}/api/shipments/transporter/${transporterWallet}?page=${page}&limit=${limit}`;
  
  if (status) {
    const backendStatus = REVERSE_STATUS_MAP[status] || status.toUpperCase();
    url += `&status=${backendStatus}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transporter shipments: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch transporter shipments');
  }

  const shipments = result.data.map(shipment => transformShipment(shipment));

  return {
    shipments,
    pagination: result.pagination,
  };
};

/**
 * Fetch shipments assigned to a warehouse
 * @param {string} warehouseWallet - The warehouse's wallet address
 * @param {Object} options - Query options (page, limit, status)
 * @returns {Promise<{shipments: Array, pagination: Object}>}
 */
export const fetchWarehouseShipments = async (warehouseWallet, options = {}) => {
  const { page = 1, limit = 50, status } = options;
  
  let url = `${API_BASE_URL}/api/shipments/warehouse/${warehouseWallet}?page=${page}&limit=${limit}`;
  
  if (status) {
    const backendStatus = REVERSE_STATUS_MAP[status] || status.toUpperCase();
    url += `&status=${backendStatus}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse shipments: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch warehouse shipments');
  }

  const shipments = result.data.map(shipment => transformShipment(shipment));

  return {
    shipments,
    pagination: result.pagination,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  fetchShipments,
  fetchShipmentByHash,
  fetchContainers,
  fetchContainerById,
  fetchShipmentStats,
  fetchIndexerStatus,
  createShipment,
  lockShipment,
  // User fetching
  fetchUsersByRole,
  fetchTransporters,
  fetchWarehouses,
  // Role-based shipment fetching
  fetchTransporterShipments,
  fetchWarehouseShipments,
};