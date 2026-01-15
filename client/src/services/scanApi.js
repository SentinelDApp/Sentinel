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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════════════════
// SCAN RESULT TYPES (Matches backend ScanLog model)
// ═══════════════════════════════════════════════════════════════════════════

export const SCAN_STATUS = {
  ACCEPTED: 'ACCEPTED',   // Scan passed all validations
  REJECTED: 'REJECTED',   // Scan failed validation
  // Legacy alias for backward compatibility
  VERIFIED: 'ACCEPTED'
};

// Action types for scan events
export const SCAN_ACTION = {
  SCAN_VERIFY: 'SCAN_VERIFY',           // Informational verification only
  CUSTODY_PICKUP: 'CUSTODY_PICKUP',     // Transporter picks up from supplier
  CUSTODY_HANDOVER: 'CUSTODY_HANDOVER', // Handover to next party
  CUSTODY_RECEIVE: 'CUSTODY_RECEIVE',   // Warehouse receives shipment
  FINAL_DELIVERY: 'FINAL_DELIVERY',     // Retailer confirms final delivery
  DISPATCH_CONFIRM: 'DISPATCH_CONFIRM'  // Supplier confirms dispatch readiness
};

export const REJECTION_CODES = {
  INVALID_QR_FORMAT: 'INVALID_QR_FORMAT',
  SHIPMENT_NOT_FOUND: 'SHIPMENT_NOT_FOUND',
  CONTAINER_NOT_FOUND: 'CONTAINER_NOT_FOUND',
  ALREADY_DELIVERED: 'ALREADY_DELIVERED',
  UNAUTHORIZED_ROLE: 'UNAUTHORIZED_ROLE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  BLOCKCHAIN_MISMATCH: 'BLOCKCHAIN_MISMATCH',
  NOT_READY_FOR_DISPATCH: 'NOT_READY_FOR_DISPATCH'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('sentinel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || data.reason || 'Request failed');
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
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        qrData,
        location
      })
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Verify scan error:', error);
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
export const confirmScan = async (scanId, confirmed, notes = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        scanId,
        confirmed,
        notes
      })
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Confirm scan error:', error);
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
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get scan history error:', error);
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
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Validate QR format error:', error);
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
  if (!rawQrData || typeof rawQrData !== 'string') {
    return {
      isValid: false,
      error: 'Empty or invalid QR data',
      type: null
    };
  }

  const trimmed = rawQrData.trim();

  // Try parsing as JSON
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      
      if (parsed.containerId) {
        return {
          isValid: true,
          type: 'container',
          containerId: parsed.containerId,
          shipmentHash: parsed.shipmentHash || null
        };
      }
      
      if (parsed.shipmentHash) {
        return {
          isValid: true,
          type: 'shipment',
          shipmentHash: parsed.shipmentHash
        };
      }
      
      return {
        isValid: false,
        error: 'Invalid JSON format',
        type: null
      };
    } catch (e) {
      return {
        isValid: false,
        error: 'Invalid JSON format',
        type: null
      };
    }
  }

  // Check for container ID format (CNT-XXXXXXXX-XXXXXXXX)
  // Pattern is case-insensitive and allows various formats
  if (trimmed.toUpperCase().startsWith('CNT-')) {
    const containerIdPattern = /^CNT-[A-Za-z0-9]+-[A-Za-z0-9]+$/i;
    if (containerIdPattern.test(trimmed)) {
      return {
        isValid: true,
        type: 'container',
        containerId: trimmed.toUpperCase() // Normalize to uppercase
      };
    }
    // Also accept shorter formats like CNT-XXXXX
    const shortPattern = /^CNT-[A-Za-z0-9]+$/i;
    if (shortPattern.test(trimmed)) {
      return {
        isValid: true,
        type: 'container',
        containerId: trimmed.toUpperCase()
      };
    }
    return {
      isValid: false,
      error: 'Invalid container ID format',
      type: null
    };
  }

  // Check for shipment hash format
  if (trimmed.startsWith('SHP-') || /^[a-fA-F0-9]{40,66}$/.test(trimmed)) {
    return {
      isValid: true,
      type: 'shipment',
      shipmentHash: trimmed
    };
  }

  // FALLBACK: Try to extract container ID from anywhere in the string
  // This handles cases where QR scanners add extra characters
  const containerMatch = trimmed.match(/CNT-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
  if (containerMatch) {
    console.log('Fallback: Extracted container ID from string:', containerMatch[0]);
    return {
      isValid: true,
      type: 'container',
      containerId: containerMatch[0].toUpperCase()
    };
  }

  // FALLBACK: Try to extract shipment hash
  const shipmentMatch = trimmed.match(/SHP-[A-Za-z0-9-]+/i);
  if (shipmentMatch) {
    console.log('Fallback: Extracted shipment hash from string:', shipmentMatch[0]);
    return {
      isValid: true,
      type: 'shipment',
      shipmentHash: shipmentMatch[0]
    };
  }

  return {
    isValid: false,
    error: `Unrecognized QR code format. Scanned: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}"`,
    type: null
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
    INVALID_QR_FORMAT: 'The QR code format is not recognized. Please scan a valid Sentinel QR code.',
    SHIPMENT_NOT_FOUND: 'This shipment was not found in the system. It may not be registered yet.',
    CONTAINER_NOT_FOUND: 'This container was not found in the system.',
    ALREADY_DELIVERED: 'This shipment has already been delivered. No further actions allowed.',
    UNAUTHORIZED_ROLE: 'You are not authorized to perform this action at the current shipment status.',
    INVALID_STATUS_TRANSITION: 'This status transition is not allowed.',
    BLOCKCHAIN_MISMATCH: 'There is a mismatch between database and blockchain records.',
    NOT_READY_FOR_DISPATCH: 'This shipment has not been locked on the blockchain yet. The supplier must confirm the shipment before it can be scanned.'
  };
  
  return messages[code] || 'Verification failed. Please try again.';
};

/**
 * Get status color for UI display
 * 
 * @param {string} status - Scan status (VERIFIED, REJECTED, ERROR)
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status) => {
  const colors = {
    VERIFIED: 'text-green-600',
    REJECTED: 'text-red-600',
    ERROR: 'text-yellow-600'
  };
  return colors[status] || 'text-gray-600';
};

/**
 * Get background color for status
 * 
 * @param {string} status - Scan status
 * @returns {string} Tailwind background class
 */
export const getStatusBgColor = (status) => {
  const colors = {
    VERIFIED: 'bg-green-100',
    REJECTED: 'bg-red-100',
    ERROR: 'bg-yellow-100'
  };
  return colors[status] || 'bg-gray-100';
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
  SCAN_STATUS,
  REJECTION_CODES
};
