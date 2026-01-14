/**
 * Container Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * READ-ONLY API ENDPOINTS FOR CONTAINER DATA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sentinel backend acts as a blockchain indexer, transforming immutable 
 * on-chain shipment events into queryable off-chain records for dashboards 
 * and analytics.
 * 
 * Containers are OFF-CHAIN entities created when ShipmentLocked events are
 * indexed. Each container has a unique ID and QR code for physical tracking.
 * 
 * These endpoints fetch container data from MongoDB.
 * 
 * ❌ NO CREATE/UPDATE/DELETE OPERATIONS
 * ❌ NO BLOCKCHAIN INTERACTION
 * ✅ READ-ONLY QUERIES FROM MONGODB
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const Container = require('../models/Container');
const Shipment = require('../models/Shipment');

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

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
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
