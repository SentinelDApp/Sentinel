/**
 * Scan Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * QR CODE SCANNING API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * These endpoints handle the QR scanning verification workflow:
 * 
 * POST   /api/scan              - Verify a scanned QR code
 * POST   /api/scan/confirm      - Confirm scan and update status
 * GET    /api/scan/history/:id  - Get scan history for a shipment
 * GET    /api/scan/validate/:qr - Quick QR format validation
 * 
 * SECURITY:
 * - All endpoints require JWT authentication
 * - Role-based access control for scan operations
 * - Complete audit trail of all scan attempts
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const scanController = require('../controllers/scanController');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate scan request body
 */
const validateScanRequest = (req, res, next) => {
  const { qrData } = req.body;
  
  if (!qrData || typeof qrData !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'qrData is required and must be a string'
    });
  }
  
  // Limit QR data size to prevent abuse
  if (qrData.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'QR data exceeds maximum allowed length'
    });
  }
  
  next();
};

/**
 * Validate confirm request body
 */
const validateConfirmRequest = (req, res, next) => {
  const { scanId, confirmed } = req.body;
  
  if (!scanId || typeof scanId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'scanId is required and must be a string'
    });
  }
  
  if (typeof confirmed !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'confirmed is required and must be a boolean'
    });
  }
  
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/scan
 * 
 * Verify a scanned QR code
 * 
 * Requires: Authentication
 * Allowed Roles: supplier, transporter, warehouse, retailer
 * 
 * Body:
 * {
 *   qrData: string,           // Raw QR code content
 *   location?: {              // Optional GPS coordinates
 *     latitude: number,
 *     longitude: number,
 *     accuracy?: number
 *   }
 * }
 * 
 * Response:
 * {
 *   status: "VERIFIED" | "REJECTED",
 *   scanId: string,
 *   shipment: { ... },
 *   container: { ... } | null,
 *   transition: { ... },
 *   nextAction: { ... }
 * }
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['supplier', 'transporter', 'warehouse', 'retailer']),
  validateScanRequest,
  scanController.verifyScan
);

/**
 * POST /api/scan/confirm
 * 
 * Confirm a verified scan and update shipment status
 * 
 * Requires: Authentication
 * Allowed Roles: supplier, transporter, warehouse, retailer
 * 
 * Body:
 * {
 *   scanId: string,
 *   confirmed: boolean,
 *   notes?: string
 * }
 */
router.post(
  '/confirm',
  authMiddleware,
  roleMiddleware(['supplier', 'transporter', 'warehouse', 'retailer']),
  validateConfirmRequest,
  scanController.confirmScan
);

/**
 * GET /api/scan/history/:shipmentHash
 * 
 * Get scan history for a specific shipment
 * 
 * Requires: Authentication
 * Allowed Roles: All authenticated users
 * 
 * Query Parameters:
 * - limit: number (default: 50, max: 100)
 */
router.get(
  '/history/:shipmentHash',
  authMiddleware,
  scanController.getScanHistory
);

/**
 * GET /api/scan/validate/:qrData
 * 
 * Quick validation of QR format without full verification
 * Used for preview before full scan
 * 
 * Requires: Authentication
 * 
 * Response:
 * {
 *   isValid: boolean,
 *   type: "container" | "shipment" | null,
 *   containerId: string | null,
 *   shipmentHash: string | null,
 *   error: string | null
 * }
 */
router.get(
  '/validate/:qrData',
  authMiddleware,
  scanController.validateQRFormat
);

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
