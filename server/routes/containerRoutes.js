/**
 * Container Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * API ENDPOINTS FOR CONTAINER DATA AND SCANNING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sentinel backend acts as a blockchain indexer, transforming immutable 
 * on-chain shipment events into queryable off-chain records for dashboards 
 * and analytics.
 * 
 * Containers are OFF-CHAIN entities created when ShipmentLocked events are
 * indexed. Each container has a unique ID and QR code for physical tracking.
 * 
 * READ ENDPOINTS:
 * ✅ GET  /api/containers/:shipmentHash     - Get containers for shipment
 * ✅ GET  /api/containers/single/:containerId - Get single container
 * ✅ GET  /api/containers/:shipmentHash/stats - Get container stats
 * 
 * SCAN ENDPOINT:
 * ✅ POST /api/containers/scan              - Scan a container QR code
 * 
 * ❌ NO CREATE/UPDATE/DELETE OPERATIONS (except via scan)
 * ❌ NO BLOCKCHAIN WRITES
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const Container = require('../models/Container');
const Shipment = require('../models/Shipment');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const scanController = require('../controllers/scanController');
const transporterScanController = require('../controllers/transporterScanController');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse pagination parameters
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  return { page, limit };
};

/**
 * Validate container scan request body
 */
const validateContainerScanRequest = (req, res, next) => {
  const { containerId } = req.body;
  
  if (!containerId || typeof containerId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'containerId is required and must be a string'
    });
  }
  
  // Basic format validation for container ID
  const trimmed = containerId.trim();
  if (trimmed.length < 5 || trimmed.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid containerId format'
    });
  }
  
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// SCAN ROUTE (Must be defined BEFORE parameterized routes)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/containers/scan
 * 
 * Scan a container QR code
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL DOMAIN RULES:
 * - QR codes contain ONLY containerId (no shipmentHash, no metadata)
 * - Containers can ONLY be scanned IF parent shipment has valid txHash
 * - If txHash is missing → FAIL with "Shipment is not marked ready for dispatch"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Requires: Authentication
 * Allowed Roles: transporter, warehouse, retailer
 * 
 * Request Body:
 * {
 *   containerId: string    // From QR scan (the ONLY data in QR code)
 * }
 * 
 * Note: actorWallet and role are extracted from authenticated user (req.user)
 *       and are NOT accepted from request body for security.
 * 
 * Response (Success):
 * {
 *   success: true,
 *   status: "VERIFIED",
 *   scanId: string,
 *   container: { containerId, previousStatus, currentStatus, ... },
 *   shipment: { shipmentHash, previousStatus, currentStatus, txHash, ... }
 * }
 * 
 * Response (Failure - Not Ready):
 * {
 *   success: false,
 *   status: "REJECTED",
 *   reason: "Shipment is not marked ready for dispatch",
 *   code: "NOT_READY_FOR_DISPATCH"
 * }
 */
router.post(
  '/scan',
  authMiddleware,
  roleMiddleware(['transporter', 'warehouse', 'retailer']),
  validateContainerScanRequest,
  scanController.scanContainer
);

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTER-SPECIFIC SCAN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/containers/scan/transporter
 * 
 * Transporter-specific container scanning endpoint with strict domain rules:
 * - ONLY transporters can use this endpoint
 * - Container must belong to a blockchain-locked shipment (txHash required)
 * - Container can only be scanned ONCE by transporter
 * - Optional concern can be raised during scan
 * 
 * Request Body:
 * {
 *   containerId: string,    // From QR scan
 *   concern: string         // Optional concern text
 * }
 */
router.post(
  '/scan/transporter',
  authMiddleware,
  roleMiddleware(['transporter']),
  validateContainerScanRequest,
  transporterScanController.scanContainerAsTransporter
);

/**
 * GET /api/containers/scan/transporter/assigned
 * 
 * Get containers assigned to the current transporter that are ready to scan
 */
router.get(
  '/scan/transporter/assigned',
  authMiddleware,
  roleMiddleware(['transporter']),
  transporterScanController.getAssignedContainers
);

// ═══════════════════════════════════════════════════════════════════════════
// READ ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/containers/:shipmentHash
 * 
 * Get all containers for a specific shipment
 * 
 * Path Parameters:
 * - shipmentHash: The shipment identifier
 * 
 * Query Parameters:
 * - status: Filter by container status (optional)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     shipment: { ...shipmentSummary },
 *     containers: [...containers]
 *   },
 *   pagination: { page, limit, total, totalPages }
 * }
 */
router.get('/:shipmentHash', async (req, res) => {
  try {
    const { shipmentHash } = req.params;
    const { status } = req.query;
    const { page, limit } = parsePagination(req.query);

    if (!shipmentHash || shipmentHash.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shipment hash is required'
      });
    }

    // Verify shipment exists
    const shipment = await Shipment.findOne({ shipmentHash }).lean();
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Build query for containers
    const query = { shipmentHash };

    // Filter by status if provided
    if (status) {
      const validStatuses = ['CREATED', 'SCANNED', 'IN_TRANSIT', 'AT_WAREHOUSE', 'DELIVERED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
        });
      }
      query.status = status.toUpperCase();
    }

    // Get total count for pagination
    const total = await Container.countDocuments(query);

    // Fetch containers
    const containers = await Container.find(query)
      .sort({ containerNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform to response format
    const containerData = containers.map(container => ({
      containerId: container.containerId,
      containerNumber: container.containerNumber,
      quantity: container.quantity,
      status: container.status,
      qrData: container.qrData,
      lastScanLocation: container.lastScanLocation,
      lastScanAt: container.lastScanAt,
      lastScannedBy: container.lastScannedBy,
      createdAt: container.createdAt
    }));

    res.json({
      success: true,
      data: {
        shipment: {
          shipmentHash: shipment.shipmentHash,
          batchId: shipment.batchId,
          supplierWallet: shipment.supplierWallet,
          numberOfContainers: shipment.numberOfContainers,
          quantityPerContainer: shipment.quantityPerContainer,
          totalQuantity: shipment.totalQuantity,
          status: shipment.status
        },
        containers: containerData
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch containers'
    });
  }
});

/**
 * GET /api/containers/single/:containerId
 * 
 * Get a specific container by its unique ID
 * Useful for QR code scanning lookups
 * 
 * Path Parameters:
 * - containerId: The unique container identifier
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     container: { ...containerDetails },
 *     shipment: { ...parentShipmentDetails }
 *   }
 * }
 */
router.get('/single/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;

    if (!containerId || containerId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Container ID is required'
      });
    }

    // Find container by ID
    const container = await Container.findOne({ containerId }).lean();

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    // Get parent shipment
    const shipment = await Shipment.findOne({ 
      shipmentHash: container.shipmentHash 
    }).lean();

    res.json({
      success: true,
      data: {
        container: {
          containerId: container.containerId,
          shipmentHash: container.shipmentHash,
          containerNumber: container.containerNumber,
          quantity: container.quantity,
          status: container.status,
          qrData: container.qrData,
          lastScanLocation: container.lastScanLocation,
          lastScanAt: container.lastScanAt,
          lastScannedBy: container.lastScannedBy,
          createdAt: container.createdAt
        },
        shipment: shipment ? {
          shipmentHash: shipment.shipmentHash,
          batchId: shipment.batchId,
          supplierWallet: shipment.supplierWallet,
          numberOfContainers: shipment.numberOfContainers,
          quantityPerContainer: shipment.quantityPerContainer,
          totalQuantity: shipment.totalQuantity,
          status: shipment.status,
          txHash: shipment.txHash,
          blockNumber: shipment.blockNumber
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching container:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch container'
    });
  }
});

/**
 * GET /api/containers/:shipmentHash/stats
 * 
 * Get container statistics for a shipment
 * 
 * Path Parameters:
 * - shipmentHash: The shipment identifier
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     total: number,
 *     byStatus: { CREATED: n, SCANNED: n, ... }
 *   }
 * }
 */
router.get('/:shipmentHash/stats', async (req, res) => {
  try {
    const { shipmentHash } = req.params;

    if (!shipmentHash || shipmentHash.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shipment hash is required'
      });
    }

    // Verify shipment exists
    const shipmentExists = await Shipment.exists({ shipmentHash });
    if (!shipmentExists) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Get total count
    const total = await Container.countDocuments({ shipmentHash });

    // Get counts by status
    const statusCounts = await Container.aggregate([
      { $match: { shipmentHash } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byStatus = {};
    statusCounts.forEach(item => {
      byStatus[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus
      }
    });
  } catch (error) {
    console.error('Error fetching container stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch container statistics'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
