/**
 * Indexer Status Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BLOCKCHAIN INDEXER MONITORING ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides endpoints to monitor the blockchain indexer service status,
 * sync state, and health information for dashboards and operations.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const blockchainIndexer = require('../services/blockchainIndexer');
const SyncState = require('../models/SyncState');

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/indexer/status
 * 
 * Get the current status of the blockchain indexer
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     isRunning: boolean,
 *     connected: boolean,
 *     contractAddress: string,
 *     chainId: number,
 *     currentBlock: number,
 *     syncState: { ... }
 *   }
 * }
 */
router.get('/status', async (req, res) => {
  try {
    const status = await blockchainIndexer.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching indexer status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch indexer status'
    });
  }
});

/**
 * GET /api/indexer/health
 * 
 * Health check endpoint for the indexer service
 * Returns simplified health status for monitoring systems
 * 
 * Response:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: string,
 *   details: { ... }
 * }
 */
router.get('/health', async (req, res) => {
  try {
    const status = await blockchainIndexer.getStatus();

    let healthStatus = 'healthy';
    const issues = [];

    // Check if indexer is running
    if (!status.isRunning) {
      healthStatus = 'degraded';
      issues.push('Indexer is not running');
    }

    // Check if connected to blockchain
    if (!status.connected) {
      healthStatus = 'unhealthy';
      issues.push('Not connected to blockchain');
    }

    // Check sync state
    if (status.syncState) {
      if (status.syncState.status === 'ERROR') {
        healthStatus = 'degraded';
        issues.push(`Sync error: ${status.syncState.lastError}`);
      }

      // Check if sync is stale (more than 5 minutes behind)
      if (status.currentBlock && status.syncState.lastSyncedBlock) {
        const blocksBehind = status.currentBlock - status.syncState.lastSyncedBlock;
        if (blocksBehind > 100) {
          healthStatus = healthStatus === 'healthy' ? 'degraded' : healthStatus;
          issues.push(`Sync is ${blocksBehind} blocks behind`);
        }
      }
    }

    const httpStatus = healthStatus === 'healthy' ? 200 : 
                       healthStatus === 'degraded' ? 200 : 503;

    res.status(httpStatus).json({
      status: healthStatus,
      timestamp: new Date().toISOString(),
      details: {
        isRunning: status.isRunning,
        connected: status.connected,
        currentBlock: status.currentBlock,
        lastSyncedBlock: status.syncState?.lastSyncedBlock,
        issues: issues.length > 0 ? issues : undefined
      }
    });
  } catch (error) {
    console.error('Error checking indexer health:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        error: 'Failed to check indexer health'
      }
    });
  }
});

/**
 * GET /api/indexer/sync-history
 * 
 * Get all sync states (useful for debugging multi-indexer setups)
 * 
 * Response:
 * {
 *   success: true,
 *   data: [...syncStates]
 * }
 */
router.get('/sync-history', async (req, res) => {
  try {
    const syncStates = await SyncState.find({})
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: syncStates.map(state => ({
        key: state.key,
        lastSyncedBlock: state.lastSyncedBlock,
        chainId: state.chainId,
        contractAddress: state.contractAddress,
        totalEventsProcessed: state.totalEventsProcessed,
        status: state.status,
        lastSyncAt: state.lastSyncAt,
        lastError: state.lastError
      }))
    });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync history'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
