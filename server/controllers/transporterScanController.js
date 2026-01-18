/**
 * Transporter Scan Controller
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * TRANSPORTER-SPECIFIC CONTAINER SCANNING LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This controller implements the strict domain rules for transporter scanning:
 * 
 * FLOW:
 * 1. Validate containerId
 * 2. Fetch parent shipment via container.shipmentHash
 * 3. Enforce blockchain verification (txHash check)
 * 4. Enforce role check (TRANSPORTER only)
 * 5. Prevent duplicate scan (container status check)
 * 6. Record scan_log (even for rejected scans)
 * 7. If ACCEPTED: Update container and shipment status
 * 8. Handle concerns (optional)
 * 
 * RULES:
 * - QR code contains ONLY containerId
 * - Containers and shipments are stored OFF-CHAIN in MongoDB
 * - Blockchain is used ONLY to verify shipment lock (via txHash)
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
    nextTransporter: shipment.nextTransporter?.walletAddress || null,
    assignedRetailer: shipment.assignedRetailer?.walletAddress || null
  };
};

/**
 * Check if transporter is authorized to scan this shipment
 * Transporter can be assigned via either assignedTransporter OR nextTransporter
 */
const isTransporterAuthorized = (shipment, transporterWallet) => {
  const normalizedWallet = transporterWallet.toLowerCase();
  
  const isAssignedTransporter = 
    shipment.assignedTransporter?.walletAddress === normalizedWallet;
  const isNextTransporter = 
    shipment.nextTransporter?.walletAddress === normalizedWallet;
  
  return {
    isAuthorized: isAssignedTransporter || isNextTransporter,
    isAssignedTransporter,
    isNextTransporter,
    // Destination based on which field the transporter is assigned through
    destination: isNextTransporter ? 'RETAILER' : 'WAREHOUSE'
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
 * Derive shipment status from container statuses
 * Shipment transitions: CREATED → READY_FOR_DISPATCH → IN_TRANSIT → AT_WAREHOUSE → DELIVERED
 */
const deriveShipmentStatusFromContainers = (containers) => {
  if (!containers || containers.length === 0) {
    return 'CREATED';
  }

  const statusCounts = containers.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const total = containers.length;
  
  // If ALL containers are DELIVERED → shipment is DELIVERED
  if (statusCounts['DELIVERED'] === total) {
    return 'DELIVERED';
  }
  
  // If ALL containers are AT_WAREHOUSE → shipment is AT_WAREHOUSE
  if (statusCounts['AT_WAREHOUSE'] === total) {
    return 'AT_WAREHOUSE';
  }
  
  // If ANY container is IN_TRANSIT or beyond → shipment is IN_TRANSIT (first scan moves shipment)
  if (statusCounts['IN_TRANSIT'] > 0 || statusCounts['AT_WAREHOUSE'] > 0 || statusCounts['DELIVERED'] > 0) {
    // Check if all at warehouse or delivered
    if ((statusCounts['AT_WAREHOUSE'] || 0) + (statusCounts['DELIVERED'] || 0) === total) {
      return 'AT_WAREHOUSE';
    }
    return 'IN_TRANSIT';
  }
  
  // If ALL containers are CREATED → check if shipment has txHash
  return 'READY_FOR_DISPATCH';
};

/**
 * Notify supplier about concern (placeholder - implement with actual notification service)
 */
const notifySupplierAboutConcern = async (concern, shipment) => {
  try {
    // TODO: Implement actual notification logic
    // - Send email notification
    // - Send push notification
    // - Update real-time dashboard
    
    console.log(`📢 SUPPLIER NOTIFICATION: Concern raised for shipment ${shipment.shipmentHash}`);
    console.log(`   Concern ID: ${concern.concernId}`);
    console.log(`   Type: ${concern.type}`);
    console.log(`   Severity: ${concern.severity}`);
    console.log(`   Description: ${concern.description}`);
    console.log(`   Supplier: ${shipment.supplierWallet}`);
    
    // Mark notification as sent
    await ShipmentConcern.markNotificationSent(concern.concernId);
    
    return true;
  } catch (error) {
    console.error('Failed to notify supplier:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCAN ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/containers/scan/transporter
 * 
 * Transporter-specific container scanning endpoint
 * 
 * Request Body:
 * {
 *   containerId: string,      // From QR scan (ONLY data in QR code)
 *   concern: string           // Optional concern text
 * }
 * 
 * Note: actorWallet and role come from authenticated user (req.user)
 */
const scanContainerAsTransporter = async (req, res) => {
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
    action: SCAN_ACTION.CUSTODY_PICKUP,
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
    // CRITICAL: Shipment must be locked on blockchain to be scanned
    // ═════════════════════════════════════════════════════════════════════
    
    if (!shipment.txHash) {
      return res.status(400).json({
        success: false,
        status: 'REJECTED',
        reason: 'Shipment is not marked ready for dispatch',
        code: REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
        message: 'This shipment has not been confirmed and locked on the blockchain. The supplier must confirm the shipment before containers can be scanned.',
        shipment: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          isLockedOnBlockchain: false
        }
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 4: Enforce role check - TRANSPORTER only
    // ═════════════════════════════════════════════════════════════════════
    
    if (role.toLowerCase() !== 'transporter') {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        reason: 'Only transporters can use this scan endpoint',
        code: REJECTION_REASONS.ROLE_NOT_ALLOWED,
        message: `Role '${role}' is not allowed to scan containers in this flow. Only TRANSPORTER role is permitted.`
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 4b: Verify transporter is authorized to scan this shipment
    // Transporter must be assigned via assignedTransporter OR nextTransporter
    // ═════════════════════════════════════════════════════════════════════
    
    const transporterAuth = isTransporterAuthorized(shipment, actorWallet);
    
    if (!transporterAuth.isAuthorized) {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        reason: 'Transporter not authorized for this shipment',
        code: REJECTION_REASONS.ROLE_NOT_ALLOWED,
        message: 'You are not assigned to transport this shipment. Only the assigned transporter can scan containers.',
        shipment: {
          shipmentHash: shipment.shipmentHash,
          assignedTransporter: shipment.assignedTransporter?.walletAddress || null,
          nextTransporter: shipment.nextTransporter?.walletAddress || null
        }
      });
    }

    // Store destination info for response
    const transporterDestination = transporterAuth.destination;
    const isNextTransporter = transporterAuth.isNextTransporter;
    
    // Determine the specific transporter role for scan logs
    // assignedtransporter: handles supplier → warehouse leg
    // nexttransporter: handles warehouse → retailer leg
    const transporterRole = isNextTransporter ? 'nexttransporter' : 'assignedtransporter';
    
    // Update baseScanData with the specific transporter role
    baseScanData.actor.role = transporterRole;

    // ═════════════════════════════════════════════════════════════════════
    // STEP 5: Prevent duplicate scan based on transporter type
    // - assignedTransporter can scan when container is CREATED or SCANNED
    // - nextTransporter can scan when container is AT_WAREHOUSE
    // ═════════════════════════════════════════════════════════════════════
    
    if (isNextTransporter) {
      // nextTransporter scans containers that are AT_WAREHOUSE (ready for warehouse → retailer leg)
      if (container.status !== 'AT_WAREHOUSE') {
        return res.status(400).json({
          success: false,
          status: 'REJECTED',
          reason: 'Container not ready for next transport leg',
          code: REJECTION_REASONS.INVALID_STATUS_TRANSITION,
          message: `As the next transporter, you can only scan containers that are AT_WAREHOUSE. Current status: ${container.status}`,
          container: {
            containerId: container.containerId,
            status: container.status,
            lastScannedBy: container.lastScannedBy
          }
        });
      }
    } else {
      // assignedTransporter scans containers that are CREATED or SCANNED (supplier → warehouse leg)
      if (container.status !== 'CREATED' && container.status !== 'SCANNED') {
        return res.status(400).json({
          success: false,
          status: 'REJECTED',
          reason: 'Container already scanned',
          code: REJECTION_REASONS.ALREADY_SCANNED,
          message: `This container has already been scanned and is currently in status: ${container.status}`,
          container: {
            containerId: container.containerId,
            status: container.status,
            lastScannedBy: container.lastScannedBy
          }
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 6: Record scan_log (ACCEPTED)
    // ═════════════════════════════════════════════════════════════════════
    
    const previousContainerStatus = container.status;
    const nextContainerStatus = 'IN_TRANSIT';
    
    const scanLog = await ScanLog.create({
      scanId: ScanLog.generateScanId(),
      ...baseScanData,
      result: SCAN_RESULT.ACCEPTED,
      scannedAt: new Date()
    });

    // ═════════════════════════════════════════════════════════════════════
    // STEP 7: Update container status and lastScannedBy
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
            role: transporterRole, // Use specific role (assignedtransporter or nexttransporter)
            timestamp: now
          },
          updatedAt: now
        }
      }
    );

    // ═════════════════════════════════════════════════════════════════════
    // STEP 7b: DO NOT auto-update shipment status during scanning
    // Shipment status will be manually updated via API after all containers scanned
    // ═════════════════════════════════════════════════════════════════════
    
    const previousShipmentStatus = shipment.status;
    const shipmentStatusChanged = false;

    // ═════════════════════════════════════════════════════════════════════
    // STEP 8: Handle concern if provided
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
        
        // Notify supplier (async - don't block response)
        notifySupplierAboutConcern(newConcern, shipment);
        
        concernResult = {
          concernId: newConcern.concernId,
          status: 'RECORDED',
          message: 'Concern has been recorded and supplier will be notified'
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
    // STEP 9: Return success response
    // ═════════════════════════════════════════════════════════════════════
    
    return res.status(200).json({
      success: true,
      status: 'ACCEPTED',
      message: 'Container scanned successfully',
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
          role: transporterRole, // Use specific role (assignedtransporter or nexttransporter)
          timestamp: now
        }
      },
      shipment: {
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        previousStatus: previousShipmentStatus,
        currentStatus: previousShipmentStatus, // Status unchanged during scan
        statusChanged: shipmentStatusChanged, // Always false now
        numberOfContainers: shipment.numberOfContainers,
        isLockedOnBlockchain: true,
        txHash: shipment.txHash,
        blockNumber: shipment.blockNumber
      },
      // Transporter-specific info
      transporter: {
        role: transporterRole, // 'assignedtransporter' or 'nexttransporter'
        isNextTransporter, // true if assigned via nextTransporter field
        destination: transporterDestination, // "WAREHOUSE" or "RETAILER"
        destinationDetails: isNextTransporter 
          ? shipment.assignedRetailer || null 
          : shipment.assignedWarehouse || null
      },
      concern: concernResult,
      processingTimeMs: Date.now() - startTime
    });

  } catch (error) {
    console.error('Transporter scan error:', error);
    
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      reason: 'An error occurred during container scanning',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET /api/containers/scan/transporter/assigned
 * 
 * Get containers assigned to the current transporter that are ready to scan
 * Includes shipments from both assignedTransporter and nextTransporter fields
 */
const getAssignedContainers = async (req, res) => {
  const transporterWallet = req.user.walletAddress;
  const normalizedWallet = transporterWallet.toLowerCase();
  
  try {
    // Find shipments assigned to this transporter via either field
    // assignedTransporter: destination is warehouse
    // nextTransporter: destination is retailer
    const shipments = await Shipment.find({
      $or: [
        { 'assignedTransporter.walletAddress': normalizedWallet },
        { 'nextTransporter.walletAddress': normalizedWallet }
      ]
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
    
    // Group containers by shipment with destination info
    const shipmentData = shipments.map(shipment => {
      const shipmentContainers = containers.filter(c => c.shipmentHash === shipment.shipmentHash);
      const pendingContainers = shipmentContainers.filter(c => c.status === 'CREATED' || c.status === 'SCANNED');
      
      // Determine if this transporter is assigned via nextTransporter
      const isNextTransporter = 
        shipment.nextTransporter?.walletAddress === normalizedWallet;
      const destination = isNextTransporter ? 'RETAILER' : 'WAREHOUSE';
      
      return {
        shipmentId: shipment._id.toString(),
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        status: shipment.status,
        totalContainers: shipmentContainers.length,
        pendingScans: pendingContainers.length,
        scannedCount: shipmentContainers.length - pendingContainers.length,
        // Transporter-specific info
        isNextTransporter,
        destination,
        destinationDetails: isNextTransporter 
          ? shipment.assignedRetailer || null 
          : shipment.assignedWarehouse || null,
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
    const pendingScans = containers.filter(c => c.status === 'CREATED' || c.status === 'SCANNED').length;
    
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
  scanContainerAsTransporter,
  getAssignedContainers
};
