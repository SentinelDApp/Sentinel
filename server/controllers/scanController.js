/**
 * Scan Controller
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QR CODE SCANNING & VERIFICATION LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles the complete QR scan verification workflow:
 * 1. Decode and validate QR format
 * 2. Lookup container/shipment in database
 * 3. Verify against blockchain (if available)
 * 4. Check scanner authorization
 * 5. Validate status transition
 * 6. Log scan event
 * 7. Return structured response
 *
 * SECURITY:
 * - All endpoints require authentication
 * - Role-based authorization for scans
 * - Complete audit trail of all scan attempts
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Container = require("../models/Container");
const Shipment = require("../models/Shipment");
const ScanLog = require("../models/ScanLog");
const {
  REJECTION_REASONS,
  SCAN_RESULT,
  SCAN_ACTION,
} = require("../models/ScanLog");
const { blockchainService } = require("../services/blockchainService");

// ═══════════════════════════════════════════════════════════════════════════
// QR DATA NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize raw QR data for consistent storage
 * - Removes double-stringification (e.g., '"CNT-XXX"' → 'CNT-XXX')
 * - Trims whitespace
 * - Returns clean string for logging
 * @param {string} rawData - Raw data from QR scanner
 * @returns {string} Normalized QR data
 */
const normalizeRawQrData = (rawData) => {
  if (!rawData || typeof rawData !== "string") return "";

  let normalized = rawData.trim();

  // Remove double-stringification (QR scanners sometimes wrap in extra quotes)
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }

  return normalized;
};

// ═══════════════════════════════════════════════════════════════════════════
// QR FORMAT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * QR Code Format:
 *
 * Simple format (Container ID only):
 *   CNT-{timestamp}-{random}
 *   Example: CNT-LX1B2C3D-ABCD1234
 *
 * Extended format (JSON with signature):
 *   { "containerId": "CNT-...", "shipmentHash": "...", "checksum": "..." }
 *
 * Legacy format (Shipment hash directly):
 *   SHP-{hash} or raw shipment hash
 */

/**
 * Parse and validate QR code data
 * @param {string} rawQrData - Raw string from QR scanner
 * @returns {Object} Parsed QR data or error
 */
const parseQRData = (rawQrData) => {
  if (!rawQrData || typeof rawQrData !== "string") {
    return {
      isValid: false,
      error: "Empty or invalid QR data",
      type: null,
    };
  }

  const trimmed = rawQrData.trim();

  // Try parsing as JSON (extended format)
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (parsed.containerId) {
        return {
          isValid: true,
          type: "container",
          containerId: parsed.containerId,
          shipmentHash: parsed.shipmentHash || null,
          checksum: parsed.checksum || null,
        };
      }

      if (parsed.shipmentHash) {
        return {
          isValid: true,
          type: "shipment",
          shipmentHash: parsed.shipmentHash,
          checksum: parsed.checksum || null,
        };
      }

      return {
        isValid: false,
        error: "Invalid JSON format: missing containerId or shipmentHash",
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
  // Pattern is case-insensitive to handle various QR scanner outputs
  if (trimmed.toUpperCase().startsWith("CNT-")) {
    const containerIdPattern = /^CNT-[A-Za-z0-9]+-[A-Za-z0-9]+$/i;
    if (containerIdPattern.test(trimmed)) {
      return {
        isValid: true,
        type: "container",
        containerId: trimmed.toUpperCase(), // Normalize to uppercase
        shipmentHash: null,
        checksum: null,
      };
    }
    // Also accept shorter formats like CNT-XXXXX
    const shortPattern = /^CNT-[A-Za-z0-9]+$/i;
    if (shortPattern.test(trimmed)) {
      return {
        isValid: true,
        type: "container",
        containerId: trimmed.toUpperCase(),
        shipmentHash: null,
        checksum: null,
      };
    }
    return {
      isValid: false,
      error: "Invalid container ID format",
      type: null,
    };
  }

  // Check for shipment hash format (SHP-... or raw hash)
  if (trimmed.startsWith("SHP-") || /^[a-fA-F0-9]{40,66}$/.test(trimmed)) {
    return {
      isValid: true,
      type: "shipment",
      shipmentHash: trimmed,
      containerId: null,
      checksum: null,
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
      shipmentHash: null,
      checksum: null,
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
      containerId: null,
      checksum: null,
    };
  }

  // Unknown format
  return {
    isValid: false,
    error: `Unrecognized QR code format: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? "..." : ""}"`,
    type: null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/scan
 *
 * Main QR scan verification endpoint
 *
 * Request Body:
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
 *   reason?: string,          // Only for REJECTED
 *   scanId: string,           // Unique scan event ID
 *   shipment: {...},          // Shipment details (if found)
 *   container: {...},         // Container details (if applicable)
 *   nextAction: {...}         // What the scanner should do next
 * }
 */
const verifyScan = async (req, res) => {
  const startTime = Date.now();

  // Extract request data
  const { qrData, location } = req.body;
  const user = req.user; // Set by authMiddleware

  // Guard: Ensure user is authenticated
  if (!user || !user.walletAddress || !user.role) {
    console.error("❌ Auth error: user not properly set on request");
    return res.status(401).json({
      status: "ERROR",
      reason: "Authentication error",
      message: "User not authenticated properly",
    });
  }

  // Base scan log data (minimal - only what's needed for audit)
  const baseScanData = {
    actor: {
      walletAddress: user.walletAddress,
      role: user.role,
    },
    location: location || null, // Human-readable location string from client
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Validate QR format
    // ═══════════════════════════════════════════════════════════════════════

    if (!qrData) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.INVALID_QR_FORMAT,
      );

      return res.status(400).json({
        status: "REJECTED",
        reason: "QR data is required",
        code: REJECTION_REASONS.INVALID_QR_FORMAT,
        scanId: scanLog.scanId,
      });
    }

    const parsedQR = parseQRData(qrData);

    if (!parsedQR.isValid) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.INVALID_QR_FORMAT,
      );

      return res.status(400).json({
        status: "REJECTED",
        reason: parsedQR.error,
        code: REJECTION_REASONS.INVALID_QR_FORMAT,
        scanId: scanLog.scanId,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Lookup container/shipment in database
    // ═══════════════════════════════════════════════════════════════════════

    let container = null;
    let shipment = null;

    if (parsedQR.type === "container") {
      // Lookup container by ID
      container = await Container.findOne({
        containerId: parsedQR.containerId,
      });

      if (!container) {
        const scanLog = await ScanLog.logRejected(
          { ...baseScanData, containerId: parsedQR.containerId },
          REJECTION_REASONS.CONTAINER_NOT_FOUND,
        );

        return res.status(404).json({
          status: "REJECTED",
          reason: "Container not found",
          code: REJECTION_REASONS.CONTAINER_NOT_FOUND,
          scanId: scanLog.scanId,
        });
      }

      // Get parent shipment
      shipment = await Shipment.findOne({
        shipmentHash: container.shipmentHash,
      });
    } else {
      // Direct shipment lookup
      shipment = await Shipment.findOne({
        shipmentHash: parsedQR.shipmentHash,
      });
    }

    if (!shipment) {
      const scanLog = await ScanLog.logRejected(
        {
          ...baseScanData,
          containerId: parsedQR.containerId,
          shipmentHash: parsedQR.shipmentHash,
        },
        REJECTION_REASONS.SHIPMENT_NOT_FOUND,
      );

      return res.status(404).json({
        status: "REJECTED",
        reason: "Shipment not found",
        code: REJECTION_REASONS.SHIPMENT_NOT_FOUND,
        scanId: scanLog.scanId,
      });
    }

    // Update base scan data with found IDs
    baseScanData.containerId = container?.containerId || null;
    baseScanData.shipmentHash = shipment.shipmentHash;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: CRITICAL - Enforce READY_FOR_DISPATCH gate (txHash check)
    // ═══════════════════════════════════════════════════════════════════════
    // A shipment can ONLY be scanned if it has been locked on the blockchain.
    // The txHash field is set when the supplier clicks "Confirm & Lock Shipment".
    // If txHash is null/empty, the shipment is NOT ready for dispatch.

    if (!shipment.txHash) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
      );

      return res.status(400).json({
        status: "REJECTED",
        reason: "Shipment is not marked ready for dispatch",
        code: REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
        scanId: scanLog.scanId,
        message:
          "This shipment has not been locked on the blockchain. The supplier must confirm the shipment before it can be scanned.",
        shipment: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          isLockedOnBlockchain: false,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Verify against blockchain (if available)
    // ═══════════════════════════════════════════════════════════════════════

    let isBlockchainLocked = !!shipment.txHash; // Use txHash as primary indicator

    try {
      if (await blockchainService.isAvailable()) {
        const blockchainData = await blockchainService.getShipment(
          shipment.shipmentHash,
        );

        if (blockchainData) {
          isBlockchainLocked = blockchainData.isLocked || isBlockchainLocked;

          // Check for blockchain mismatch (potential tampering)
          if (blockchainData.status !== shipment.status) {
            console.warn(
              `⚠️  Status mismatch for ${shipment.shipmentHash}: DB=${shipment.status}, Chain=${blockchainData.status}`,
            );
          }
        }
      }
    } catch (blockchainError) {
      console.error("Blockchain verification error:", blockchainError.message);
      // Continue with txHash-based check
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Check if shipment is already delivered
    // ═══════════════════════════════════════════════════════════════════════

    if (shipment.status === "DELIVERED") {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.ALREADY_DELIVERED,
      );

      return res.status(400).json({
        status: "REJECTED",
        reason:
          "Shipment has already been delivered. No further scans allowed.",
        code: REJECTION_REASONS.ALREADY_DELIVERED,
        scanId: scanLog.scanId,
        shipment: sanitizeShipmentData(shipment),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Validate user role and status transition
    // ═══════════════════════════════════════════════════════════════════════

    const transitionResult = blockchainService.validateStatusTransition(
      shipment.status,
      user.role,
    );

    if (!transitionResult.isValid) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.UNAUTHORIZED_ROLE,
      );

      return res.status(403).json({
        status: "REJECTED",
        reason: transitionResult.reason,
        code: REJECTION_REASONS.UNAUTHORIZED_ROLE,
        scanId: scanLog.scanId,
        shipment: sanitizeShipmentData(shipment),
        allowedRoles: blockchainService.getAllowedRoles(shipment.status),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: Scan verified - Log success
    // ═══════════════════════════════════════════════════════════════════════
    // Store action for logging
    baseScanData.action = transitionResult.action;

    const scanLog = await ScanLog.logVerified(baseScanData);

    // Update container scan info (if applicable)
    if (container) {
      const scanTime = new Date();
      await Container.updateOne(
        { containerId: container.containerId },
        {
          $set: {
            lastScanAt: scanTime,
            lastScannedBy: {
              wallet: user.walletAddress,
              role: user.role,
              timestamp: scanTime,
            },
            status: mapShipmentStatusToContainer(transitionResult.nextStatus),
          },
        },
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Return success response
    // ═══════════════════════════════════════════════════════════════════════

    return res.status(200).json({
      status: "ACCEPTED",
      message: "QR code verified successfully",
      scanId: scanLog.scanId,
      scannedAt: scanLog.scannedAt,
      shipment: sanitizeShipmentData(shipment),
      container: container ? sanitizeContainerData(container) : null,
      blockchain: {
        locked: isBlockchainLocked,
        txHash: shipment.txHash || null,
      },
      transition: {
        currentStatus: shipment.status,
        nextStatus: transitionResult.nextStatus,
        action: transitionResult.action,
        message: getTransitionMessage(transitionResult.action, user.role),
      },
      nextAction: {
        action: transitionResult.action,
        description: getNextActionDescription(
          transitionResult.action,
          user.role,
        ),
        requiresConfirmation: true,
      },
    });
  } catch (error) {
    console.error("❌ Scan verification error:", error.message);
    console.error("Stack:", error.stack);

    // Log error to scan_logs
    try {
      await ScanLog.logError(baseScanData);
    } catch (logError) {
      console.error("Failed to log scan error:", logError.message);
    }

    // Always show detailed error for debugging
    return res.status(500).json({
      status: "ERROR",
      reason: error.message || "An error occurred during verification",
      message: error.message || "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/scan/confirm
 *
 * Confirm a scan and update shipment status
 * Called after user confirms the action in UI
 *
 * Request Body:
 * {
 *   scanId: string,           // Scan ID from verify response
 *   confirmed: boolean,       // User confirmation
 *   notes?: string           // Optional notes
 * }
 */
const confirmScan = async (req, res) => {
  const { scanId, confirmed, notes } = req.body;
  const scanner = req.user;

  try {
    if (!scanId) {
      return res.status(400).json({
        success: false,
        message: "Scan ID is required",
      });
    }

    // Find the original scan log
    const scanLog = await ScanLog.findOne({ scanId });

    if (!scanLog) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    // Verify the confirming user is the original actor (scanner)
    if (scanLog.actor.walletAddress !== scanner.walletAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Only the original scanner can confirm this scan",
      });
    }

    if (scanLog.result !== SCAN_RESULT.ACCEPTED) {
      return res.status(400).json({
        success: false,
        message: "Only accepted scans can be confirmed",
      });
    }

    if (!confirmed) {
      // User cancelled - just log it
      return res.status(200).json({
        success: true,
        message: "Scan confirmation cancelled",
        scanId,
      });
    }

    // Update shipment status
    const updateResult = await Shipment.updateOne(
      { shipmentHash: scanLog.shipmentHash },
      {
        $set: {
          status: scanLog.statusTransition.to,
          [`${scanner.role}Wallet`]: scanner.walletAddress,
          updatedAt: new Date(),
        },
        $push: {
          statusHistory: {
            status: scanLog.statusTransition.to,
            changedBy: scanner.walletAddress,
            changedAt: new Date(),
            action: scanLog.statusTransition.action,
            notes: notes || null,
          },
        },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update shipment status",
      });
    }

    // Update all containers for this shipment
    await Container.updateMany(
      { shipmentHash: scanLog.shipmentHash },
      {
        $set: {
          status: mapShipmentStatusToContainer(scanLog.statusTransition.to),
          updatedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      scanId,
      shipmentHash: scanLog.shipmentHash,
      newStatus: scanLog.statusTransition.to,
      action: scanLog.statusTransition.action,
    });
  } catch (error) {
    console.error("Confirm scan error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm scan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/scan/history/:shipmentHash
 *
 * Get scan history for a shipment
 */
const getScanHistory = async (req, res) => {
  const { shipmentHash } = req.params;
  const { limit = 50 } = req.query;

  try {
    const history = await ScanLog.getShipmentScanHistory(
      shipmentHash,
      parseInt(limit),
    );

    return res.status(200).json({
      success: true,
      shipmentHash,
      count: history.length,
      scans: history,
    });
  } catch (error) {
    console.error("Get scan history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get scan history",
    });
  }
};

/**
 * GET /api/scan/validate/:qrData
 *
 * Quick validation of QR format without full verification
 * Used for preview before full scan
 */
const validateQRFormat = async (req, res) => {
  const { qrData } = req.params;

  const parsed = parseQRData(decodeURIComponent(qrData));

  return res.status(200).json({
    isValid: parsed.isValid,
    type: parsed.type,
    containerId: parsed.containerId,
    shipmentHash: parsed.shipmentHash,
    error: parsed.error,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize shipment data for response
 */
const sanitizeShipmentData = (shipment) => ({
  shipmentHash: shipment.shipmentHash,
  batchId: shipment.batchId,
  status: shipment.status,
  numberOfContainers: shipment.numberOfContainers,
  quantityPerContainer: shipment.quantityPerContainer,
  totalQuantity: shipment.totalQuantity,
  supplierWallet: shipment.supplierWallet,
  isLocked: !!shipment.txHash,
  createdAt: shipment.createdAt,
});

/**
 * Sanitize container data for response
 */
const sanitizeContainerData = (container) => ({
  containerId: container.containerId,
  containerNumber: container.containerNumber,
  shipmentHash: container.shipmentHash,
  status: container.status,
  quantity: container.quantity,
  lastScanAt: container.lastScanAt,
  lastScannedBy: container.lastScannedBy,
});

/**
 * Map shipment status to container status
 */
const mapShipmentStatusToContainer = (shipmentStatus) => {
  const mapping = {
    CREATED: "CREATED",
    READY_FOR_DISPATCH: "CREATED",
    IN_TRANSIT: "IN_TRANSIT",
    AT_WAREHOUSE: "AT_WAREHOUSE",
    DELIVERED: "DELIVERED",
  };
  return mapping[shipmentStatus] || "CREATED";
};

/**
 * Get human-readable transition message
 */
const getTransitionMessage = (action, role) => {
  const messages = {
    PICKUP: `Shipment picked up by ${role}. Status will change to IN_TRANSIT.`,
    WAREHOUSE_ARRIVAL: `Shipment arrived at warehouse. Status will change to AT_WAREHOUSE.`,
    DELIVERY: `Shipment delivered by ${role}. Status will change to DELIVERED.`,
    CONFIRM_DISPATCH: `Shipment confirmed for dispatch. Status will change to READY_FOR_DISPATCH.`,
  };
  return messages[action] || `Action: ${action}`;
};

/**
 * Get next action description for UI
 */
const getNextActionDescription = (action, role) => {
  const descriptions = {
    PICKUP: "Confirm pickup to update shipment status and begin transit.",
    WAREHOUSE_ARRIVAL:
      "Confirm arrival to update shipment status at warehouse.",
    DELIVERY: "Confirm delivery to complete the shipment journey.",
    CONFIRM_DISPATCH: "Confirm dispatch to make shipment ready for pickup.",
  };
  return descriptions[action] || "Confirm action to proceed.";
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER-SPECIFIC SCAN ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derive shipment status from container statuses
 * Aggregates container states to determine overall shipment status
 * @param {Array} containers - Array of container documents
 * @returns {string} Derived shipment status
 */
const deriveShipmentStatusFromContainers = (containers) => {
  if (!containers || containers.length === 0) {
    return "CREATED";
  }

  const statusCounts = containers.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const total = containers.length;

  // If ALL containers are DELIVERED → shipment is DELIVERED
  if (statusCounts["DELIVERED"] === total) {
    return "DELIVERED";
  }

  // If ALL containers are AT_WAREHOUSE → shipment is AT_WAREHOUSE
  if (statusCounts["AT_WAREHOUSE"] === total) {
    return "AT_WAREHOUSE";
  }

  // If ANY container is IN_TRANSIT → shipment is IN_TRANSIT
  if (
    statusCounts["IN_TRANSIT"] > 0 ||
    statusCounts["AT_WAREHOUSE"] > 0 ||
    statusCounts["DELIVERED"] > 0
  ) {
    // Mixed states during transit
    if (statusCounts["DELIVERED"] > 0 && statusCounts["DELIVERED"] < total) {
      return "AT_WAREHOUSE"; // Partial delivery, still at warehouse
    }
    if (statusCounts["AT_WAREHOUSE"] > 0) {
      return "AT_WAREHOUSE";
    }
    return "IN_TRANSIT";
  }

  // If ALL containers are CREATED or SCANNED → shipment is READY_FOR_DISPATCH
  return "READY_FOR_DISPATCH";
};

/**
 * Map role to next container status
 * @param {string} role - The scanner's role
 * @param {string} currentStatus - Current container status
 * @returns {string} Next container status
 */
const getNextContainerStatus = (role, currentStatus) => {
  const normalizedRole = role.toLowerCase();

  // Status transitions based on role
  switch (normalizedRole) {
    case "transporter":
      if (currentStatus === "CREATED" || currentStatus === "SCANNED") {
        return "IN_TRANSIT";
      }
      return currentStatus; // No change if already past this stage

    case "warehouse":
      if (currentStatus === "IN_TRANSIT" || currentStatus === "SCANNED") {
        return "AT_WAREHOUSE";
      }
      return currentStatus;

    case "retailer":
      if (currentStatus === "AT_WAREHOUSE") {
        return "DELIVERED";
      }
      return currentStatus;

    default:
      return currentStatus;
  }
};

/**
 * POST /api/containers/scan
 *
 * Secure container QR scanning endpoint
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL DOMAIN RULES:
 * - QR codes contain ONLY containerId (no shipmentHash, no metadata)
 * - Containers can ONLY be scanned IF the parent shipment has a valid txHash
 * - If txHash is missing → FAIL with "Shipment is not marked ready for dispatch"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Request Body:
 * {
 *   containerId: string,      // From QR scan
 *   actorWallet: string,      // From connected wallet (verified by auth)
 *   role: string              // TRANSPORTER / WAREHOUSE / RETAILER
 * }
 *
 * Backend Flow:
 * 1. Validate containerId → Find container or 404
 * 2. Fetch parent shipment using container.shipmentHash
 * 3. Enforce READY_FOR_DISPATCH gate (txHash check)
 * 4. Prevent scanning if container is DELIVERED
 * 5. Record scan event in scan_logs
 * 6. Update container status and lastScannedBy
 * 7. Derive and update shipment aggregate status
 */
const scanContainer = async (req, res) => {
  const startTime = Date.now();

  // Extract request data
  // actorWallet comes from authenticated user (req.user), NOT from body for security
  const { containerId, location } = req.body;
  const actorWallet = req.user.walletAddress;
  const role = req.user.role;

  // Base scan log data (minimal - only what's needed for audit)
  const baseScanData = {
    actor: {
      walletAddress: actorWallet,
      role: role,
    },
    location: location || null, // Human-readable location string from client
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Validate containerId - Find container by containerId
    // ═══════════════════════════════════════════════════════════════════════

    if (!containerId || typeof containerId !== "string") {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.INVALID_QR_FORMAT,
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Container ID is required",
        code: REJECTION_REASONS.INVALID_QR_FORMAT,
        scanId: scanLog.scanId,
      });
    }

    // Normalize containerId (uppercase for consistency)
    const normalizedContainerId = containerId.trim().toUpperCase();

    // Find container by containerId
    const container = await Container.findOne({
      containerId: normalizedContainerId,
    });

    if (!container) {
      const scanLog = await ScanLog.logRejected(
        { ...baseScanData, containerId: normalizedContainerId },
        REJECTION_REASONS.CONTAINER_NOT_FOUND,
      );

      return res.status(404).json({
        success: false,
        status: "REJECTED",
        reason: "Invalid container QR",
        code: REJECTION_REASONS.CONTAINER_NOT_FOUND,
        scanId: scanLog.scanId,
        message: `Container ${normalizedContainerId} does not exist in the system`,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Fetch parent shipment using container.shipmentHash
    // ═══════════════════════════════════════════════════════════════════════

    const shipment = await Shipment.findOne({
      shipmentHash: container.shipmentHash,
    });

    if (!shipment) {
      const scanLog = await ScanLog.logRejected(
        {
          ...baseScanData,
          containerId: normalizedContainerId,
          shipmentHash: container.shipmentHash,
        },
        REJECTION_REASONS.SHIPMENT_NOT_FOUND,
      );

      return res.status(404).json({
        success: false,
        status: "REJECTED",
        reason: "Parent shipment not found",
        code: REJECTION_REASONS.SHIPMENT_NOT_FOUND,
        scanId: scanLog.scanId,
        message: "The parent shipment for this container could not be found",
      });
    }

    // Update base scan data with found IDs
    baseScanData.containerId = normalizedContainerId;
    baseScanData.shipmentHash = shipment.shipmentHash;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: CRITICAL - Enforce READY_FOR_DISPATCH gate (txHash check)
    // ═══════════════════════════════════════════════════════════════════════
    // A container can ONLY be scanned if its parent shipment has been locked
    // on the blockchain. The txHash is set when supplier confirms the shipment.

    if (!shipment.txHash) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Shipment is not marked ready for dispatch",
        code: REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
        scanId: scanLog.scanId,
        message:
          'This shipment has not been confirmed and locked on the blockchain. The supplier must click "Confirm & Lock Shipment" before containers can be scanned.',
        shipment: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          isLockedOnBlockchain: false,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Prevent scanning if container is already DELIVERED
    // ═══════════════════════════════════════════════════════════════════════

    if (container.status === "DELIVERED") {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.ALREADY_DELIVERED,
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Container already delivered",
        code: REJECTION_REASONS.ALREADY_DELIVERED,
        scanId: scanLog.scanId,
        message:
          "This container has already been delivered. No further scans allowed.",
        container: {
          containerId: container.containerId,
          status: container.status,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Record scan event in scan_logs (append-only audit log)
    // ═══════════════════════════════════════════════════════════════════════

    const previousContainerStatus = container.status;
    const nextContainerStatus = getNextContainerStatus(
      role,
      previousContainerStatus,
    );

    // Add scan data for logging
    baseScanData.containerId = normalizedContainerId;
    baseScanData.shipmentHash = shipment.shipmentHash;
    baseScanData.action = "SCAN";

    const scanLog = await ScanLog.logVerified(baseScanData);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: Update container status and lastScannedBy
    // ═══════════════════════════════════════════════════════════════════════

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
            timestamp: now,
          },
          updatedAt: now,
        },
      },
    );

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Derive and update shipment aggregate status from containers
    // ═══════════════════════════════════════════════════════════════════════

    // Fetch all containers for this shipment to derive aggregate status
    const allContainers = await Container.find({
      shipmentHash: shipment.shipmentHash,
    }).lean();

    // Update the scanned container's status in our local array for accurate derivation
    const updatedContainers = allContainers.map((c) =>
      c.containerId === normalizedContainerId
        ? { ...c, status: nextContainerStatus }
        : c,
    );

    const derivedShipmentStatus =
      deriveShipmentStatusFromContainers(updatedContainers);
    const previousShipmentStatus = shipment.status;

    // Only update shipment if status actually changed
    if (derivedShipmentStatus !== previousShipmentStatus) {
      await Shipment.updateOne(
        { shipmentHash: shipment.shipmentHash },
        {
          $set: {
            status: derivedShipmentStatus,
            updatedAt: now,
          },
          $push: {
            statusHistory: {
              status: derivedShipmentStatus,
              changedBy: actorWallet,
              changedAt: now,
              action: "CONTAINER_SCAN",
              notes: `Status derived from container scans. Container ${normalizedContainerId} scanned by ${role}.`,
            },
          },
        },
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 8: Return success response
    // ═══════════════════════════════════════════════════════════════════════

    return res.status(200).json({
      success: true,
      status: "VERIFIED",
      message: "Container scanned successfully",
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
          timestamp: now,
        },
      },
      shipment: {
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        previousStatus: previousShipmentStatus,
        currentStatus: derivedShipmentStatus,
        statusChanged: derivedShipmentStatus !== previousShipmentStatus,
        numberOfContainers: shipment.numberOfContainers,
        isLockedOnBlockchain: true,
        txHash: shipment.txHash,
        blockNumber: shipment.blockNumber,
      },
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Container scan error:", error);

    // Log error to scan_logs
    try {
      await ScanLog.logError(
        baseScanData,
        error.message || "Unknown error during container scan",
      );
    } catch (logError) {
      console.error("Failed to log scan error:", logError);
    }

    return res.status(500).json({
      success: false,
      status: "ERROR",
      reason: "An error occurred during container scanning",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE-SPECIFIC CONTAINER SCAN ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/scan/warehouse/container
 *
 * Warehouse-specific container QR scanning endpoint
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL WAREHOUSE DOMAIN RULES:
 * 1. Container MUST exist on blockchain (parent shipment has txHash)
 * 2. Container MUST have been scanned by transporter first (IN_TRANSIT status)
 * 3. Container MUST NOT have been scanned by warehouse already (prevent duplicates)
 * 4. Each QR scan is logged to scan_logs for audit trail
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Request Body:
 * {
 *   containerId: string,      // From QR scan
 *   location?: string         // Optional location
 * }
 */
const scanContainerForWarehouse = async (req, res) => {
  const startTime = Date.now();

  // Extract request data
  const { containerId, location } = req.body;
  const actorWallet = req.user.walletAddress;
  const role = req.user.role;

  // Verify the user is a warehouse
  if (role.toLowerCase() !== "warehouse") {
    return res.status(403).json({
      success: false,
      status: "REJECTED",
      reason: "Only warehouse users can use this endpoint",
      code: "UNAUTHORIZED_ROLE",
    });
  }

  // Base scan log data
  const baseScanData = {
    actor: {
      walletAddress: actorWallet,
      role: role,
    },
    location: location || null,
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Validate containerId
    // ═══════════════════════════════════════════════════════════════════════

    if (!containerId || typeof containerId !== "string") {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.INVALID_QR_FORMAT,
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Container ID is required",
        code: REJECTION_REASONS.INVALID_QR_FORMAT,
        scanId: scanLog.scanId,
      });
    }

    // Normalize containerId
    const normalizedContainerId = containerId.trim().toUpperCase();
    baseScanData.containerId = normalizedContainerId;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Find container
    // ═══════════════════════════════════════════════════════════════════════

    const container = await Container.findOne({
      containerId: normalizedContainerId,
    });

    if (!container) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.CONTAINER_NOT_FOUND,
      );

      return res.status(404).json({
        success: false,
        status: "REJECTED",
        reason: "Container not found in system",
        code: REJECTION_REASONS.CONTAINER_NOT_FOUND,
        scanId: scanLog.scanId,
        message: `Container ${normalizedContainerId} does not exist`,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Get parent shipment and verify blockchain lock
    // ═══════════════════════════════════════════════════════════════════════

    const shipment = await Shipment.findOne({
      shipmentHash: container.shipmentHash,
    });

    if (!shipment) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.SHIPMENT_NOT_FOUND,
      );

      return res.status(404).json({
        success: false,
        status: "REJECTED",
        reason: "Parent shipment not found",
        code: REJECTION_REASONS.SHIPMENT_NOT_FOUND,
        scanId: scanLog.scanId,
      });
    }

    baseScanData.shipmentHash = shipment.shipmentHash;

    // Verify shipment is locked on blockchain
    if (!shipment.txHash) {
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Shipment not locked on blockchain",
        code: REJECTION_REASONS.NOT_READY_FOR_DISPATCH,
        scanId: scanLog.scanId,
        message:
          "This container cannot be scanned because its shipment is not locked on the blockchain yet.",
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Verify container was scanned by transporter (IN_TRANSIT status)
    // ═══════════════════════════════════════════════════════════════════════

    // Container must be IN_TRANSIT or AT_WAREHOUSE (transporter has already scanned it)
    const validStatuses = ["IN_TRANSIT", "AT_WAREHOUSE"];
    if (!validStatuses.includes(container.status)) {
      // Check if it was already scanned by warehouse
      if (container.status === "DELIVERED") {
        const scanLog = await ScanLog.logRejected(
          baseScanData,
          REJECTION_REASONS.ALREADY_DELIVERED,
        );

        return res.status(400).json({
          success: false,
          status: "REJECTED",
          reason: "Container already delivered",
          code: REJECTION_REASONS.ALREADY_DELIVERED,
          scanId: scanLog.scanId,
        });
      }

      // Container not yet scanned by transporter
      const scanLog = await ScanLog.logRejected(
        baseScanData,
        "NOT_SCANNED_BY_TRANSPORTER",
      );

      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Container must be scanned by transporter first",
        code: "NOT_SCANNED_BY_TRANSPORTER",
        scanId: scanLog.scanId,
        message:
          "This container has not been picked up by the transporter yet. Current status: " +
          container.status,
        container: {
          containerId: container.containerId,
          status: container.status,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Check for duplicate warehouse scan
    // ═══════════════════════════════════════════════════════════════════════

    // Check if warehouse already scanned this container
    const existingWarehouseScan = await ScanLog.findOne({
      containerId: normalizedContainerId,
      "actor.role": "warehouse",
      result: SCAN_RESULT.ACCEPTED,
    });

    if (existingWarehouseScan) {
      return res.status(400).json({
        success: false,
        status: "REJECTED",
        reason: "Container already scanned by warehouse",
        code: "ALREADY_SCANNED_BY_WAREHOUSE",
        message:
          "This container has already been scanned and received at the warehouse.",
        previousScan: {
          scanId: existingWarehouseScan.scanId,
          scannedAt: existingWarehouseScan.scannedAt,
          scannedBy: existingWarehouseScan.actor.walletAddress,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: Create shipment snapshot and blockchain verification objects
    // ═══════════════════════════════════════════════════════════════════════

    // Shipment snapshot - captures the state at scan time
    const shipmentSnapshot = {
      shipmentHash: shipment.shipmentHash,
      batchId: shipment.batchId,
      status: shipment.status,
      numberOfContainers: shipment.numberOfContainers,
      quantityPerContainer: shipment.quantityPerContainer,
      totalQuantity: shipment.totalQuantity,
      supplierWallet: shipment.supplierWallet,
      assignedTransporter: shipment.assignedTransporter,
      assignedWarehouse: shipment.assignedWarehouse,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };

    // Blockchain verification object
    const blockchainVerification = {
      isLocked: !!shipment.txHash,
      txHash: shipment.txHash || null,
      blockNumber: shipment.blockNumber || null,
      blockchainTimestamp: shipment.blockchainTimestamp || null,
      verifiedAt: new Date(),
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Log successful scan with snapshot data
    // ═══════════════════════════════════════════════════════════════════════

    baseScanData.action = SCAN_ACTION.CUSTODY_RECEIVE;
    baseScanData.shipmentSnapshot = shipmentSnapshot;
    baseScanData.blockchainVerification = blockchainVerification;

    const scanLog = await ScanLog.logVerified(baseScanData);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 8: Update container status to AT_WAREHOUSE
    // ═══════════════════════════════════════════════════════════════════════

    const now = new Date();
    const previousStatus = container.status;

    await Container.updateOne(
      { containerId: normalizedContainerId },
      {
        $set: {
          status: "AT_WAREHOUSE",
          lastScanAt: now,
          lastScannedBy: {
            wallet: actorWallet,
            role: "warehouse",
            timestamp: now,
          },
          updatedAt: now,
        },
      },
    );

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 9: Check if all containers are now at warehouse and update shipment
    // ═══════════════════════════════════════════════════════════════════════

    const allContainers = await Container.find({
      shipmentHash: shipment.shipmentHash,
    }).lean();

    // Update our view with the just-scanned container
    const updatedContainers = allContainers.map((c) =>
      c.containerId === normalizedContainerId
        ? { ...c, status: "AT_WAREHOUSE" }
        : c,
    );

    const atWarehouseCount = updatedContainers.filter(
      (c) => c.status === "AT_WAREHOUSE",
    ).length;
    const totalContainers = allContainers.length;
    const allAtWarehouse = atWarehouseCount === totalContainers;

    // Derive new shipment status
    const derivedShipmentStatus =
      deriveShipmentStatusFromContainers(updatedContainers);

    // Update shipment status if changed OR if all containers are at warehouse
    if (derivedShipmentStatus !== shipment.status || allAtWarehouse) {
      const finalStatus = allAtWarehouse
        ? "AT_WAREHOUSE"
        : derivedShipmentStatus;

      await Shipment.updateOne(
        { shipmentHash: shipment.shipmentHash },
        {
          $set: {
            status: finalStatus,
            warehouseReceivedAt: allAtWarehouse
              ? now
              : shipment.warehouseReceivedAt,
            warehouseCommittedBy: allAtWarehouse
              ? actorWallet
              : shipment.warehouseCommittedBy,
            updatedAt: now,
          },
          $push: {
            statusHistory: {
              status: finalStatus,
              changedBy: actorWallet,
              changedAt: now,
              action: allAtWarehouse
                ? "WAREHOUSE_COMMITTED"
                : "WAREHOUSE_CONTAINER_SCAN",
              notes: allAtWarehouse
                ? `All ${totalContainers} containers received at warehouse. Shipment committed.`
                : `Container ${normalizedContainerId} received at warehouse. ${atWarehouseCount}/${totalContainers} containers at warehouse.`,
            },
          },
        },
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 10: Return success response with snapshot and verification
    // ═══════════════════════════════════════════════════════════════════════

    const finalShipmentStatus = allAtWarehouse
      ? "AT_WAREHOUSE"
      : derivedShipmentStatus;

    return res.status(200).json({
      success: true,
      status: "VERIFIED",
      message: allAtWarehouse
        ? "All containers received! Shipment committed to warehouse."
        : "Container scanned and received successfully",
      scanId: scanLog.scanId,
      scannedAt: scanLog.scannedAt,
      container: {
        containerId: container.containerId,
        containerNumber: container.containerNumber,
        previousStatus: previousStatus,
        currentStatus: "AT_WAREHOUSE",
        quantity: container.quantity,
        lastScannedBy: {
          wallet: actorWallet,
          role: "warehouse",
          timestamp: now,
        },
      },
      shipment: {
        shipmentHash: shipment.shipmentHash,
        batchId: shipment.batchId,
        status: finalShipmentStatus,
        numberOfContainers: totalContainers,
        containersAtWarehouse: atWarehouseCount,
        allContainersReceived: allAtWarehouse,
        isLockedOnBlockchain: true,
        txHash: shipment.txHash,
      },
      // Shipment snapshot at scan time
      shipmentSnapshot,
      // Blockchain verification details
      blockchainVerification,
      progress: {
        scanned: atWarehouseCount,
        total: totalContainers,
        percentage: Math.round((atWarehouseCount / totalContainers) * 100),
        isComplete: allAtWarehouse,
      },
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Warehouse container scan error:", error);

    try {
      await ScanLog.logError(
        baseScanData,
        error.message || "Unknown error during warehouse container scan",
      );
    } catch (logError) {
      console.error("Failed to log scan error:", logError);
    }

    return res.status(500).json({
      success: false,
      status: "ERROR",
      reason: "An error occurred during container scanning",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  verifyScan,
  confirmScan,
  getScanHistory,
  validateQRFormat,
  scanContainer, // Generic container scan endpoint
  scanContainerForWarehouse, // Warehouse-specific container scan
  parseQRData, // Exported for testing
};
