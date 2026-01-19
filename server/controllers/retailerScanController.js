/**
 * Retailer Scan Controller
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * RETAILER-SPECIFIC CONTAINER SCANNING LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This controller implements the strict domain rules for retailer scanning:
 * 
 * FLOW:
 * 1. Warehouse assigns shipment to retailer
 * 2. Retailer scans container QR codes
 * 3. Each container status changes: AT_WAREHOUSE → DELIVERED
 * 4. When ALL containers scanned, shipment status → DELIVERED
 * 
 * RULES:
 * - QR code contains ONLY containerId
 * - Container must be AT_WAREHOUSE status (scanned by warehouse first)
 * - Shipment must be assigned to the retailer
 * - Containers can only be scanned ONCE by retailer
 * - No blockchain writes during scanning
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Container = require('../models/Container');
const Shipment = require('../models/Shipment');
const ScanLog = require('../models/ScanLog');
const ShipmentConcern = require('../models/ShipmentConcern');
const { REJECTION_REASONS, SCAN_RESULT, SCAN_ACTION } = require('../models/ScanLog');
const { CONCERN_TYPE, CONCERN_SEVERITY } = require('../models/ShipmentConcern');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create shipment snapshot for audit log
 */
const createShipmentSnapshot = (shipment) => {
  if (!shipment) return null;
  
  return {
    status: shipment.status,
    supplierWallet: shipment.supplierWallet,
    batchId: shipment.batchId,
    numberOfContainers: shipment.numberOfContainers,
    assignedTransporter: shipment.assignedTransporter?.walletAddress || null,
    assignedWarehouse: shipment.assignedWarehouse?.walletAddress || null,
    assignedRetailer: shipment.assignedRetailer?.walletAddress || null
  };
};

/**
 * Create blockchain verification snapshot
 */
const createBlockchainVerification = (shipment) => {
  return {
    txHash: shipment?.txHash || null,
    blockNumber: shipment?.blockNumber || null,
    isLocked: !!shipment?.txHash,
    verifiedAt: new Date()
  };
};

/**
 * Notify warehouse/supplier about concern
 */
const notifyAboutConcern = async (concern, shipment) => {
  try {
    console.log(`📢 CONCERN NOTIFICATION: Concern raised for shipment ${shipment.shipmentHash}`);
    console.log(`   Concern ID: ${concern.concernId}`);
    console.log(`   Type: ${concern.type}`);
    console.log(`   Severity: ${concern.severity}`);
    console.log(`   Description: ${concern.description}`);
    
    await ShipmentConcern.markNotificationSent(concern.concernId);
    return true;
  } catch (error) {
    console.error('Failed to notify about concern:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCAN ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/containers/scan/retailer
 * 
 * Retailer-specific container scanning endpoint
 * 
 * Request Body:
 * {
 *   containerId: string,      // From QR scan (ONLY data in QR code)
 *   concern: string           // Optional concern text
 * }
 * 
 * Note: actorWallet and role come from authenticated user (req.user)
 */
const scanContainerAsRetailer = async (req, res) => {
  const startTime = Date.now();
  
  // Extract request data - actorWallet and role from auth, NOT from body
  const { containerId, concern, location } = req.body;
  const actorWallet = req.user.walletAddress;
  const role = req.user.role;
  
  // Base scan log data for audit
  const baseScanData = {
    actor: {
      walletAddress: actorWallet,
      role: role
    },
    action: SCAN_ACTION.FINAL_DELIVERY,
    location: location || null
  };

  try {
    // ═════════════════════════════════════════════════════════════════════
    // STEP 1: Validate containerId
    // ═════════════════════════════════════════════════════════════════════
    
    if (!containerId || typeof containerId !== 'string') {
      return res.status(400).json({
        success: false,
        status: 'REJECTED',
        reason: 'Container ID is required',
        code: REJECTION_REASONS.INVALID_QR_FORMAT
      });
    }

    // Normalize containerId (uppercase for consistency)
    const normalizedContainerId = containerId.trim().toUpperCase();
    baseScanData.containerId = normalizedContainerId;
    
    // Find container by containerId
    const container = await Container.findOne({ containerId: normalizedContainerId });
    
    if (!container) {
      return res.status(404).json({
        success: false,
        status: 'REJECTED',
        reason: 'Container not found',
        code: REJECTION_REASONS.CONTAINER_NOT_FOUND,
        message: `Container ${normalizedContainerId} does not exist in the system`
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 2: Fetch parent shipment via container.shipmentHash
    // ═════════════════════════════════════════════════════════════════════
    
    const shipment = await Shipment.findOne({ shipmentHash: container.shipmentHash });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        status: 'REJECTED',
        reason: 'Parent shipment not found',
        code: REJECTION_REASONS.SHIPMENT_NOT_FOUND,
        message: 'The parent shipment for this container could not be found'
      });
    }

    // Update base scan data with shipment info
    baseScanData.shipmentHash = shipment.shipmentHash;
    baseScanData.shipmentSnapshot = createShipmentSnapshot(shipment);
    baseScanData.blockchainVerification = createBlockchainVerification(shipment);

    // ═════════════════════════════════════════════════════════════════════
    // STEP 3: Enforce blockchain verification (txHash check)
    // ═════════════════════════════════════════════════════════════════════
    
    if (!shipment.txHash) {
      return res.status(400).json({
        success: false,
        status: 'REJECTED',
        reason: 'Shipment is not verified on blockchain',
        code: REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
        message: 'This shipment has not been confirmed and locked on the blockchain.',
        shipment: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          isLockedOnBlockchain: false
        }
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 4: Enforce role check - RETAILER only
    // ═════════════════════════════════════════════════════════════════════
    
    if (role.toLowerCase() !== 'retailer') {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        reason: 'Only retailers can use this scan endpoint',
        code: REJECTION_REASONS.ROLE_NOT_ALLOWED,
        message: `Role '${role}' is not allowed to scan containers in this flow. Only RETAILER role is permitted.`
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 5: Verify shipment is assigned to this retailer
    // ═════════════════════════════════════════════════════════════════════
    
    const assignedRetailerWallet = shipment.assignedRetailer?.walletAddress?.toLowerCase();
    if (!assignedRetailerWallet || assignedRetailerWallet !== actorWallet.toLowerCase()) {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        reason: 'Shipment not assigned to you',
        code: REJECTION_REASONS.ROLE_NOT_ALLOWED,
        message: 'This shipment is not assigned to you. Only the assigned retailer can scan containers.',
        shipment: {
          shipmentHash: shipment.shipmentHash,
          assignedRetailer: assignedRetailerWallet || 'Not assigned'
        }
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 6: Check container status - must be IN_TRANSIT or AT_WAREHOUSE
    // Retailer can scan after transporter has picked up the container
    // Flow: CREATED → IN_TRANSIT (transporter) → DELIVERED (retailer)
    // ═════════════════════════════════════════════════════════════════════
    
    if (container.status !== 'IN_TRANSIT' && container.status !== 'AT_WAREHOUSE') {
      // Check if already delivered
      if (container.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          status: 'REJECTED',
          reason: 'Container already delivered',
          code: REJECTION_REASONS.ALREADY_SCANNED,
          message: 'This container has already been scanned and marked as DELIVERED.',
          container: {
            containerId: container.containerId,
            status: container.status,
            lastScannedBy: container.lastScannedBy
          }
        });
      }
      
      // Check if transporter hasn't scanned yet
      if (container.status === 'CREATED' || container.status === 'READY_FOR_DISPATCH' || container.status === 'LOCKED' || container.status === 'SCANNED') {
        return res.status(400).json({
          success: false,
          status: 'REJECTED',
          reason: 'Transporter has not scanned this container yet',
          code: REJECTION_REASONS.INVALID_STATUS_TRANSITION,
          message: 'The transporter must scan this container first before you can mark it as delivered. Current status: ' + container.status,
          container: {
            containerId: container.containerId,
            status: container.status,
            lastScannedBy: container.lastScannedBy
          }
        });
      }
      
      // Generic fallback for any other status
      return res.status(400).json({
        success: false,
        status: 'REJECTED',
        reason: 'Container not ready for delivery',
        code: REJECTION_REASONS.INVALID_STATUS_TRANSITION,
        message: `Container must be IN_TRANSIT or AT_WAREHOUSE before it can be delivered. Current status: ${container.status}`,
        container: {
          containerId: container.containerId,
          status: container.status,
          lastScannedBy: container.lastScannedBy
        }
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 7: Record scan_log (ACCEPTED)
    // ═════════════════════════════════════════════════════════════════════
    
    const previousContainerStatus = container.status;
    const nextContainerStatus = 'DELIVERED';
    
    const scanLog = await ScanLog.create({
      scanId: ScanLog.generateScanId(),
      ...baseScanData,
      result: SCAN_RESULT.ACCEPTED,
      scannedAt: new Date()
    });

    // ═════════════════════════════════════════════════════════════════════
    // STEP 8: Update container status and lastScannedBy
    // ═════════════════════════════════════════════════════════════════════
    
    const now = new Date();
    
    await Container.updateOne(
      { containerId: normalizedContainerId },
      {
        $set: {
          status: nextContainerStatus,
          lastScanAt: now,
          lastScannedBy: {
            wallet: actorWallet,
            role: role,
            timestamp: now
          },
          updatedAt: now
        }
      }
    );

    // ═════════════════════════════════════════════════════════════════════
    // STEP 9: Check if all containers are now DELIVERED
    // If yes, auto-update shipment status to DELIVERED
    // ═════════════════════════════════════════════════════════════════════
    
    const allContainers = await Container.find({ shipmentHash: shipment.shipmentHash });
    const allDelivered = allContainers.every(c => 
      c.containerId === normalizedContainerId ? true : c.status === 'DELIVERED'
    );
    
    const previousShipmentStatus = shipment.status;
    let shipmentStatusChanged = false;
    let newShipmentStatus = previousShipmentStatus;
    
    if (allDelivered) {
      await Shipment.updateOne(
        { shipmentHash: shipment.shipmentHash },
        { 
          $set: { 
            status: 'DELIVERED',
            updatedAt: now,
            lastUpdatedBy: actorWallet
          }
        }
      );
      shipmentStatusChanged = true;
      newShipmentStatus = 'DELIVERED';
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 10: Handle concern if provided
    // ═════════════════════════════════════════════════════════════════════
    
    let concernResult = null;
    
    if (concern && concern.trim().length > 0) {
      try {
        const newConcern = await ShipmentConcern.createConcern({
          shipmentHash: shipment.shipmentHash,
          containerId: normalizedContainerId,
          scanId: scanLog.scanId,
          type: CONCERN_TYPE.OTHER,
          severity: CONCERN_SEVERITY.MEDIUM,
          description: concern.trim(),
          reporterWallet: actorWallet,
          reporterRole: role,
          supplierWallet: shipment.supplierWallet
        });
        
        notifyAboutConcern(newConcern, shipment);
        
        concernResult = {
          concernId: newConcern.concernId,
          status: 'RECORDED',
          message: 'Concern has been recorded and relevant parties will be notified'
        };
      } catch (concernError) {
        console.error('Failed to record concern:', concernError);
        concernResult = {
          status: 'FAILED',
          message: 'Concern could not be recorded, but scan was successful'
        };
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 11: Return success response
    // ═════════════════════════════════════════════════════════════════════
    
    // Calculate remaining containers
    const deliveredCount = allContainers.filter(c => 
      c.containerId === normalizedContainerId || c.status === 'DELIVERED'
    ).length;
    const pendingCount = allContainers.length - deliveredCount;
    
    return res.status(200).json({
      success: true,
      status: 'ACCEPTED',
      message: allDelivered 
        ? 'All containers delivered! Shipment marked as DELIVERED.' 
        : 'Container scanned and marked as delivered',
      scanId: scanLog.scanId,
      scannedAt: scanLog.scannedAt,
      container: {
        containerId: container.containerId,
        containerNumber: container.containerNumber,
        previousStatus: previousContainerStatus,
        currentStatus: nextContainerStatus,
        quantity: container.quantity,
        lastScannedBy: {
          wallet: actorWallet,
          role: role,
          timestamp: now
        }
      },
      shipment: {
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        previousStatus: previousShipmentStatus,
        currentStatus: newShipmentStatus,
        statusChanged: shipmentStatusChanged,
        numberOfContainers: shipment.numberOfContainers,
        deliveredContainers: deliveredCount,
        pendingContainers: pendingCount,
        allDelivered: allDelivered,
        isLockedOnBlockchain: true,
        txHash: shipment.txHash,
        blockNumber: shipment.blockNumber
      },
      concern: concernResult,
      processingTimeMs: Date.now() - startTime
    });

  } catch (error) {
    console.error('Retailer scan error:', error);
    
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      reason: 'An error occurred during container scanning',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/containers/scan/retailer/assigned
 * 
 * Get containers assigned to the current retailer that are ready to scan
 * (i.e., containers with status AT_WAREHOUSE from shipments assigned to this retailer)
 */
const getAssignedContainers = async (req, res) => {
  const retailerWallet = req.user.walletAddress.toLowerCase();
  
  try {
    // Find shipments assigned to this retailer
    const shipments = await Shipment.find({
      'assignedRetailer.walletAddress': retailerWallet
    }).lean();
    
    if (shipments.length === 0) {
      return res.json({
        success: true,
        data: {
          shipments: [],
          totalContainers: 0,
          pendingScans: 0
        }
      });
    }
    
    // Get all containers for these shipments
    const shipmentHashes = shipments.map(s => s.shipmentHash);
    const containers = await Container.find({
      shipmentHash: { $in: shipmentHashes }
    }).lean();
    
    // Group containers by shipment
    const shipmentData = shipments.map(shipment => {
      const shipmentContainers = containers.filter(c => c.shipmentHash === shipment.shipmentHash);
      // Pending containers are those IN_TRANSIT or AT_WAREHOUSE (ready for retailer scan)
      const pendingContainers = shipmentContainers.filter(c => c.status === 'IN_TRANSIT' || c.status === 'AT_WAREHOUSE');
      const deliveredContainers = shipmentContainers.filter(c => c.status === 'DELIVERED');
      
      return {
        shipmentId: shipment._id.toString(),
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        status: shipment.status,
        totalContainers: shipmentContainers.length,
        pendingScans: pendingContainers.length,
        scannedCount: deliveredContainers.length,
        allDelivered: pendingContainers.length === 0 && deliveredContainers.length === shipmentContainers.length,
        containers: shipmentContainers.map(c => ({
          containerId: c.containerId,
          containerNumber: c.containerNumber,
          status: c.status,
          quantity: c.quantity,
          lastScannedBy: c.lastScannedBy
        }))
      };
    });
    
    const totalContainers = containers.length;
    const pendingScans = containers.filter(c => c.status === 'IN_TRANSIT' || c.status === 'AT_WAREHOUSE').length;
    
    return res.json({
      success: true,
      data: {
        shipments: shipmentData,
        totalContainers,
        pendingScans
      }
    });
  } catch (error) {
    console.error('Get assigned containers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned containers'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  scanContainerAsRetailer,
  getAssignedContainers
};
