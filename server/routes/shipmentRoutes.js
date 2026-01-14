/**
 * Shipment Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * READ-ONLY API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sentinel backend acts as a blockchain indexer, transforming immutable 
 * on-chain shipment events into queryable off-chain records for dashboards 
 * and analytics.
 * 
 * These endpoints fetch data from MongoDB ONLY - they do NOT interact with
 * the blockchain directly. All data served here was indexed from blockchain
 * events by the BlockchainIndexer service.
 * 
 * ❌ NO CREATE/UPDATE/DELETE OPERATIONS
 * ❌ NO BLOCKCHAIN WRITES
 * ✅ READ-ONLY QUERIES FROM MONGODB
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate Ethereum address format
 */
const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Parse pagination parameters
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/shipments
 * 
 * List shipments with optional filtering by supplier wallet
 * 
 * Query Parameters:
 * - supplierWallet: Filter by supplier Ethereum address (optional)
 * - status: Filter by shipment status (optional)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * 
 * Response:
 * {
 *   success: true,
 *   data: [...shipments],
 *   pagination: { page, limit, total, totalPages }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const { supplierWallet, status } = req.query;
    const { page, limit } = parsePagination(req.query);

    // Build query
    const query = {};

    // Filter by supplier wallet if provided
    if (supplierWallet) {
      if (!isValidAddress(supplierWallet)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier wallet address format'
        });
      }
      query.supplierWallet = supplierWallet.toLowerCase();
    }

    // Filter by status if provided
    if (status) {
      const validStatuses = Object.values(Shipment.schema.path('status').enumValues || 
        ['READY_FOR_DISPATCH', 'IN_TRANSIT', 'AT_WAREHOUSE', 'DELIVERED']);
      
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
        });
      }
      query.status = status.toUpperCase();
    }

    // Get total count for pagination
    const total = await Shipment.countDocuments(query);

    // Fetch shipments
    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform to response format
    const data = shipments.map(shipment => ({
      shipmentHash: shipment.shipmentHash,
      supplierWallet: shipment.supplierWallet,
      batchId: shipment.batchId,
      numberOfContainers: shipment.numberOfContainers,
      quantityPerContainer: shipment.quantityPerContainer,
      totalQuantity: shipment.totalQuantity,
      txHash: shipment.txHash,
      blockNumber: shipment.blockNumber,
      blockchainTimestamp: shipment.blockchainTimestamp,
      status: shipment.status,
      createdAt: shipment.createdAt
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments'
    });
  }
});

/**
 * GET /api/shipments/:shipmentHash
 * 
 * Get detailed information about a specific shipment by its hash
 * 
 * Path Parameters:
 * - shipmentHash: The unique shipment identifier
 * 
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.get('/:shipmentHash', async (req, res) => {
  try {
    const { shipmentHash } = req.params;

    if (!shipmentHash || shipmentHash.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shipment hash is required'
      });
    }

    // Find shipment by hash
    const shipment = await Shipment.findOne({ shipmentHash }).lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    res.json({
      success: true,
      data: {
        shipmentHash: shipment.shipmentHash,
        supplierWallet: shipment.supplierWallet,
        batchId: shipment.batchId,
        numberOfContainers: shipment.numberOfContainers,
        quantityPerContainer: shipment.quantityPerContainer,
        totalQuantity: shipment.totalQuantity,
        txHash: shipment.txHash,
        blockNumber: shipment.blockNumber,
        blockchainTimestamp: shipment.blockchainTimestamp,
        status: shipment.status,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment'
    });
  }
});

/**
 * GET /api/shipments/stats/summary
 * 
 * Get summary statistics for shipments
 * Optional: Filter by supplier wallet
 * 
 * Query Parameters:
 * - supplierWallet: Filter stats by supplier (optional)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     totalShipments: number,
 *     totalContainers: number,
 *     totalQuantity: number,
 *     byStatus: { ... }
 *   }
 * }
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { supplierWallet } = req.query;
    
    // Build match stage
    const matchStage = {};
    if (supplierWallet) {
      if (!isValidAddress(supplierWallet)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier wallet address format'
        });
      }
      matchStage.supplierWallet = supplierWallet.toLowerCase();
    }

    // Aggregate statistics
    const stats = await Shipment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalContainers: { $sum: '$numberOfContainers' },
          totalQuantity: { $sum: '$totalQuantity' }
        }
      }
    ]);

    // Get counts by status
    const statusCounts = await Shipment.aggregate([
      { $match: matchStage },
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

    const summaryData = stats[0] || {
      totalShipments: 0,
      totalContainers: 0,
      totalQuantity: 0
    };

    res.json({
      success: true,
      data: {
        totalShipments: summaryData.totalShipments,
        totalContainers: summaryData.totalContainers,
        totalQuantity: summaryData.totalQuantity,
        byStatus
      }
    });
  } catch (error) {
    console.error('Error fetching shipment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment statistics'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
