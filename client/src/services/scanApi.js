/**
 * Scan API Service
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QR SCANNING & VERIFICATION API CLIENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This service provides the frontend interface for QR code scanning
 * and verification operations.
 *
 * WORKFLOW:
 * 1. User scans QR code with camera
 * 2. Frontend calls verifyScan() with raw QR data
 * 3. Backend validates against database and blockchain
 * 4. If verified, user confirms the action
 * 5. Frontend calls confirmScan() to update status
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ═══════════════════════════════════════════════════════════════════════════
// SCAN RESULT TYPES (Matches backend ScanLog model)
// ═══════════════════════════════════════════════════════════════════════════

export const SCAN_STATUS = {
  ACCEPTED: "ACCEPTED", // Scan passed all validations
  REJECTED: "REJECTED", // Scan failed validation
  // Legacy alias for backward compatibility
  VERIFIED: "ACCEPTED",
};

// Action types for scan events
export const SCAN_ACTION = {
  SCAN_VERIFY: "SCAN_VERIFY", // Informational verification only
  CUSTODY_PICKUP: "CUSTODY_PICKUP", // Transporter picks up from supplier
  CUSTODY_HANDOVER: "CUSTODY_HANDOVER", // Handover to next party
  CUSTODY_RECEIVE: "CUSTODY_RECEIVE", // Warehouse receives shipment
  FINAL_DELIVERY: "FINAL_DELIVERY", // Retailer confirms final delivery
  DISPATCH_CONFIRM: "DISPATCH_CONFIRM", // Supplier confirms dispatch readiness
};

export const REJECTION_CODES = {
  INVALID_QR_FORMAT: "INVALID_QR_FORMAT",
  SHIPMENT_NOT_FOUND: "SHIPMENT_NOT_FOUND",
  CONTAINER_NOT_FOUND: "CONTAINER_NOT_FOUND",
  ALREADY_DELIVERED: "ALREADY_DELIVERED",
  UNAUTHORIZED_ROLE: "UNAUTHORIZED_ROLE",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  BLOCKCHAIN_MISMATCH: "BLOCKCHAIN_MISMATCH",
  NOT_READY_FOR_DISPATCH: "NOT_READY_FOR_DISPATCH",
  NOT_SCANNED_BY_TRANSPORTER: "NOT_SCANNED_BY_TRANSPORTER",
  ALREADY_SCANNED_BY_WAREHOUSE: "ALREADY_SCANNED_BY_WAREHOUSE",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("sentinel_token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    // Server returned HTML or non-JSON (likely 404 from wrong URL or server not running)
    const text = await response.text();
    console.error("Non-JSON response received:", text.substring(0, 200));
    const error = new Error(
      "Server unavailable or returned invalid response. Make sure the backend server is running on port 5000.",
    );
    error.status = response.status;
    error.data = {
      success: false,
      message: "Server unavailable. Check if backend is running.",
      code: "SERVER_ERROR",
    };
    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || data.reason || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify a scanned QR code
 *
 * @param {string} qrData - Raw QR code content from scanner
 * @param {Object} location - Optional GPS location { latitude, longitude, accuracy }
 * @returns {Promise<Object>} Verification result
 *
 * Success Response:
 * {
 *   status: "VERIFIED",
 *   scanId: "SCAN-XXX",
 *   shipment: { ... },
 *   container: { ... } | null,
 *   blockchain: { verified, status, match },
 *   transition: { currentStatus, nextStatus, action, message },
 *   nextAction: { action, description, requiresConfirmation }
 * }
 *
 * Rejection Response:
 * {
 *   status: "REJECTED",
 *   reason: "...",
 *   code: "REJECTION_CODE",
 *   scanId: "SCAN-XXX"
 * }
 */
export const verifyScan = async (qrData, location = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        qrData,
        location,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Verify scan error:", error);
    throw error;
  }
};

/**
 * Confirm a verified scan and update shipment status
 *
 * @param {string} scanId - Scan ID from verify response
 * @param {boolean} confirmed - Whether user confirms the action
 * @param {string} notes - Optional notes for the action
 * @returns {Promise<Object>} Confirmation result
 */
export const confirmScan = async (scanId, confirmed, notes = "") => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan/confirm`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        scanId,
        confirmed,
        notes,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Confirm scan error:", error);
    throw error;
  }
};

/**
 * Get scan history for a shipment
 *
 * @param {string} shipmentHash - Shipment identifier
 * @param {number} limit - Maximum number of records (default: 50)
 * @returns {Promise<Object>} Scan history
 */
export const getScanHistory = async (shipmentHash, limit = 50) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scan/history/${encodeURIComponent(shipmentHash)}?limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Get scan history error:", error);
    throw error;
  }
};

/**
 * Quick validation of QR format without full verification
 *
 * @param {string} qrData - Raw QR code content
 * @returns {Promise<Object>} Format validation result
 */
export const validateQRFormat = async (qrData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scan/validate/${encodeURIComponent(qrData)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Validate QR format error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse QR data locally (client-side validation before API call)
 * This mirrors the backend parsing logic for quick feedback
 *
 * @param {string} rawQrData - Raw string from QR scanner
 * @returns {Object} Parsed QR data or error
 */
export const parseQRDataLocal = (rawQrData) => {
  if (!rawQrData || typeof rawQrData !== "string") {
    return {
      isValid: false,
      error: "Empty or invalid QR data",
      type: null,
    };
  }

  const trimmed = rawQrData.trim();

  // Try parsing as JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (parsed.containerId) {
        return {
          isValid: true,
          type: "container",
          containerId: parsed.containerId,
          shipmentHash: parsed.shipmentHash || null,
        };
      }

      if (parsed.shipmentHash) {
        return {
          isValid: true,
          type: "shipment",
          shipmentHash: parsed.shipmentHash,
        };
      }

      return {
        isValid: false,
        error: "Invalid JSON format",
        type: null,
      };
    } catch (e) {
      return {
        isValid: false,
        error: "Invalid JSON format",
        type: null,
      };
    }
  }

  // Check for container ID format (CNT-XXXXXXXX-XXXXXXXX)
  // Pattern is case-insensitive and allows various formats
  if (trimmed.toUpperCase().startsWith("CNT-")) {
    const containerIdPattern = /^CNT-[A-Za-z0-9]+-[A-Za-z0-9]+$/i;
    if (containerIdPattern.test(trimmed)) {
      return {
        isValid: true,
        type: "container",
        containerId: trimmed.toUpperCase(), // Normalize to uppercase
      };
    }
    // Also accept shorter formats like CNT-XXXXX
    const shortPattern = /^CNT-[A-Za-z0-9]+$/i;
    if (shortPattern.test(trimmed)) {
      return {
        isValid: true,
        type: "container",
        containerId: trimmed.toUpperCase(),
      };
    }
    return {
      isValid: false,
      error: "Invalid container ID format",
      type: null,
    };
  }

  // Check for shipment hash format
  if (trimmed.startsWith("SHP-") || /^[a-fA-F0-9]{40,66}$/.test(trimmed)) {
    return {
      isValid: true,
      type: "shipment",
      shipmentHash: trimmed,
    };
  }

  // FALLBACK: Try to extract container ID from anywhere in the string
  // This handles cases where QR scanners add extra characters
  const containerMatch = trimmed.match(/CNT-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
  if (containerMatch) {
    console.log(
      "Fallback: Extracted container ID from string:",
      containerMatch[0],
    );
    return {
      isValid: true,
      type: "container",
      containerId: containerMatch[0].toUpperCase(),
    };
  }

  // FALLBACK: Try to extract shipment hash
  const shipmentMatch = trimmed.match(/SHP-[A-Za-z0-9-]+/i);
  if (shipmentMatch) {
    console.log(
      "Fallback: Extracted shipment hash from string:",
      shipmentMatch[0],
    );
    return {
      isValid: true,
      type: "shipment",
      shipmentHash: shipmentMatch[0],
    };
  }

  return {
    isValid: false,
    error: `Unrecognized QR code format. Scanned: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? "..." : ""}"`,
    type: null,
  };
};

/**
 * Get user-friendly message for rejection code
 *
 * @param {string} code - Rejection code
 * @returns {string} User-friendly message
 */
export const getRejectionMessage = (code) => {
  const messages = {
    INVALID_QR_FORMAT:
      "The QR code format is not recognized. Please scan a valid Sentinel QR code.",
    SHIPMENT_NOT_FOUND:
      "This shipment was not found in the system. It may not be registered yet.",
    CONTAINER_NOT_FOUND: "This container was not found in the system.",
    ALREADY_DELIVERED:
      "This shipment has already been delivered. No further actions allowed.",
    ALREADY_SCANNED:
      "This container has already been scanned. Duplicate scans are not allowed.",
    UNAUTHORIZED_ROLE:
      "You are not authorized to perform this action at the current shipment status.",
    ROLE_NOT_ALLOWED: "Your role is not permitted to scan in this flow.",
    INVALID_STATUS_TRANSITION: "This status transition is not allowed.",
    BLOCKCHAIN_MISMATCH:
      "There is a mismatch between database and blockchain records.",
    NOT_READY_FOR_DISPATCH:
      "This shipment has not been locked on the blockchain yet. The supplier must confirm the shipment before it can be scanned.",
    NOT_SCANNED_BY_TRANSPORTER:
      "This container has not been scanned by the transporter yet. The transporter must pick up the container before it can be received at the warehouse.",
    ALREADY_SCANNED_BY_WAREHOUSE:
      "This container has already been scanned and received at the warehouse.",
  };

  return messages[code] || "Verification failed. Please try again.";
};

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTER-SPECIFIC API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan a container as a transporter
 *
 * This endpoint enforces strict domain rules:
 * - Only transporters can use this endpoint
 * - Container must belong to a blockchain-locked shipment
 * - Container can only be scanned ONCE by transporter
 * - Optional concern can be raised during scan
 *
 * @param {string} containerId - Container ID from QR code
 * @param {Object} options - Optional parameters
 * @param {string} options.concern - Optional concern text
 * @param {string} options.location - Optional location string
 * @returns {Promise<Object>} Scan result
 */
export const scanContainerAsTransporter = async (containerId, options = {}) => {
  const { concern, location } = options;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/containers/scan/transporter`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          containerId,
          concern: concern || null,
          location: location || null,
        }),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Transporter scan error:", error);
    throw error;
  }
};

/**
 * Get containers assigned to the current transporter
 * Returns containers that are ready to be scanned
 *
 * @returns {Promise<Object>} Assigned containers data
 */
export const getTransporterAssignedContainers = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/containers/scan/transporter/assigned`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Get assigned containers error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RETAILER-SPECIFIC API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan a container as a retailer
 *
 * This endpoint enforces strict domain rules:
 * - Only retailers can use this endpoint
 * - Container must be AT_WAREHOUSE status
 * - Shipment must be assigned to this retailer
 * - Container can only be scanned ONCE by retailer
 * - When all containers scanned, shipment status → DELIVERED
 *
 * @param {string} containerId - Container ID from QR code
 * @param {Object} options - Optional parameters
 * @param {string} options.concern - Optional concern text
 * @param {string} options.location - Optional location string
 * @returns {Promise<Object>} Scan result
 */
export const scanContainerAsRetailer = async (containerId, options = {}) => {
  const { concern, location } = options;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/containers/scan/retailer`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          containerId,
          concern: concern || null,
          location: location || null,
        }),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Retailer scan error:", error);
    throw error;
  }
};

/**
 * Get containers assigned to the current retailer
 * Returns containers that are ready to be scanned (AT_WAREHOUSE status)
 *
 * @returns {Promise<Object>} Assigned containers data
 */
export const getRetailerAssignedContainers = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/containers/scan/retailer/assigned`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Get retailer assigned containers error:", error);
    throw error;
  }
};

/**
 * Get status color for UI display
 *
 * @param {string} status - Scan status (VERIFIED, REJECTED, ERROR)
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status) => {
  const colors = {
    VERIFIED: "text-green-600",
    ACCEPTED: "text-green-600",
    REJECTED: "text-red-600",
    ERROR: "text-yellow-600",
  };
  return colors[status] || "text-gray-600";
};

/**
 * Get background color for status
 *
 * @param {string} status - Scan status
 * @returns {string} Tailwind background class
 */
export const getStatusBgColor = (status) => {
  const colors = {
    VERIFIED: "bg-green-100",
    ACCEPTED: "bg-green-100",
    REJECTED: "bg-red-100",
    ERROR: "bg-yellow-100",
  };
  return colors[status] || "bg-gray-100";
};

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE-SPECIFIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get shipment containers for warehouse scanning
 *
 * @param {string} shipmentHash - Shipment identifier
 * @returns {Promise<Object>} Shipment and containers data
 */
export const getShipmentContainers = async (shipmentHash) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/containers/${encodeURIComponent(shipmentHash)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse(response);

    // Transform to expected format
    return {
      success: true,
      shipment: data.data?.shipment || data.shipment,
      containers: data.data?.containers || data.containers || [],
    };
  } catch (error) {
    console.error("Get shipment containers error:", error);
    // Return error response instead of throwing
    return {
      success: false,
      message:
        error.message ||
        error.data?.message ||
        "Failed to load shipment containers",
      error: error,
    };
  }
};

/**
 * Scan a container for warehouse receiving
 * Validates:
 * - Container exists on blockchain (has txHash)
 * - Container was scanned by transporter (IN_TRANSIT status)
 * - Container not already scanned by warehouse (prevents duplicates)
 *
 * @param {string} containerId - Container ID from QR code
 * @param {Object} location - Optional location data
 * @returns {Promise<Object>} Scan result
 */
export const scanContainerForWarehouse = async (
  containerId,
  location = null,
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scan/warehouse/container`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          containerId,
          location,
        }),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Warehouse container scan error:", error);
    // Return the error data for proper handling
    if (error.data) {
      return {
        success: false,
        ...error.data,
      };
    }
    throw error;
  }
};

/**
 * Update shipment status
 * Called when all containers are scanned by warehouse
 *
 * @param {string} shipmentHash - Shipment identifier
 * @param {string} newStatus - New status (e.g., 'AT_WAREHOUSE')
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Update result
 */
export const updateShipmentStatus = async (
  shipmentHash,
  newStatus,
  notes = "",
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/shipments/${encodeURIComponent(shipmentHash)}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          notes,
        }),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Update shipment status error:", error);
    throw error;
  }
};

/**
 * Assign a retailer to a shipment
 * Called by warehouse when shipment is ready for delivery
 *
 * @param {string} shipmentHash - Shipment identifier
 * @param {string} retailerWallet - Retailer's wallet address
 * @param {Object} options - Optional parameters
 * @param {string} options.retailerName - Optional retailer name
 * @param {string} options.retailerOrganization - Optional organization name
 * @returns {Promise<Object>} Assignment result
 */
export const assignRetailerToShipment = async (
  shipmentHash,
  retailerWallet,
  options = {},
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/shipments/${encodeURIComponent(shipmentHash)}/assign-retailer`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          retailerWallet,
          retailerName: options.retailerName || null,
          retailerOrganization: options.retailerOrganization || null,
        }),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Assign retailer error:", error);
    throw error;
  }
};

/**
 * Get shipments assigned to a retailer
 * Used by retailer dashboard to show incoming shipments
 *
 * @param {string} walletAddress - Retailer's wallet address
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by shipment status (optional)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @returns {Promise<Object>} Assigned shipments list
 */
export const getRetailerShipments = async (walletAddress, options = {}) => {
  try {
    const { status, page = 1, limit = 20 } = options;
    
    // Ensure wallet address is lowercase for consistent matching
    const normalizedWallet = walletAddress?.toLowerCase();

    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/shipments/retailer/${normalizedWallet}?${params.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Get retailer shipments error:", error);
    throw error;
  }
};

/**
 * Get all committed shipments at warehouse
 * Shipments where all containers have been scanned and received
 *
 * @param {Object} options - Query options
 * @param {string} options.warehouseWallet - Filter by warehouse wallet (optional)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @returns {Promise<Object>} Committed shipments list
 */
export const getCommittedShipments = async (options = {}) => {
  try {
    const { warehouseWallet, page = 1, limit = 20 } = options;

    const params = new URLSearchParams();
    if (warehouseWallet) params.append("warehouseWallet", warehouseWallet);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/shipments/warehouse/committed?${params.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Get committed shipments error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  verifyScan,
  confirmScan,
  getScanHistory,
  validateQRFormat,
  parseQRDataLocal,
  getRejectionMessage,
  getStatusColor,
  getStatusBgColor,
  scanContainerAsTransporter,
  getTransporterAssignedContainers,
  scanContainerAsRetailer,
  getRetailerAssignedContainers,
  getRetailerShipments,
  getShipmentContainers,
  scanContainerForWarehouse,
  updateShipmentStatus,
  assignRetailerToShipment,
  getCommittedShipments,
  SCAN_STATUS,
  REJECTION_CODES,
};
