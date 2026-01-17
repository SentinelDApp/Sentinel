/**
 * ScanLog Model
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IMMUTABLE SCAN EVENT LOG
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Scan logs are immutable events, NOT state snapshots.
 * They record WHAT happened, not the current state of the system.
 *
 * ❌ NEVER STORE IN SCAN LOGS:
 *   - shipmentStatus (derived state - lives in Shipment)
 *   - isBlockchainLocked (blockchain state - query blockchain)
 *   - rawQrData (redundant with containerId)
 *   - Any derived/computed flags
 *
 * ✅ SCAN LOGS SHOULD ONLY CONTAIN:
 *   - Event identifiers (scanId, containerId, shipmentHash)
 *   - Actor identity (who performed the scan)
 *   - Action type (what kind of scan event)
 *   - Result (accepted or rejected)
 *   - Location (where it happened)
 *   - Timestamp (when it happened)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const mongoose = require("mongoose");

// ═══════════════════════════════════════════════════════════════════════════
// SCAN RESULT ENUM (Clear, deterministic)
// ═══════════════════════════════════════════════════════════════════════════

const SCAN_RESULT = {
  ACCEPTED: "ACCEPTED", // Scan passed all validations
  REJECTED: "REJECTED", // Scan failed validation
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTION TYPES (Explicit, unambiguous)
// ═══════════════════════════════════════════════════════════════════════════

const SCAN_ACTION = {
  SCAN_VERIFY: "SCAN_VERIFY", // Informational verification only
  CUSTODY_PICKUP: "CUSTODY_PICKUP", // Transporter picks up from supplier
  CUSTODY_HANDOVER: "CUSTODY_HANDOVER", // Handover to next party
  CUSTODY_RECEIVE: "CUSTODY_RECEIVE", // Warehouse receives shipment
  FINAL_DELIVERY: "FINAL_DELIVERY", // Retailer confirms final delivery
  DISPATCH_CONFIRM: "DISPATCH_CONFIRM", // Supplier confirms dispatch readiness
};

// ═══════════════════════════════════════════════════════════════════════════
// REJECTION REASONS
// ═══════════════════════════════════════════════════════════════════════════

const REJECTION_REASONS = {
  INVALID_QR_FORMAT: "INVALID_QR_FORMAT",
  SHIPMENT_NOT_FOUND: "SHIPMENT_NOT_FOUND",
  CONTAINER_NOT_FOUND: "CONTAINER_NOT_FOUND",
  ALREADY_DELIVERED: "ALREADY_DELIVERED",
  ALREADY_SCANNED: "ALREADY_SCANNED",
  UNAUTHORIZED_ROLE: "UNAUTHORIZED_ROLE",
  ROLE_NOT_ALLOWED: "ROLE_NOT_ALLOWED",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  BLOCKCHAIN_MISMATCH: "BLOCKCHAIN_MISMATCH",
  TAMPERED_QR: "TAMPERED_QR",
  EXPIRED_QR: "EXPIRED_QR",
  NOT_READY_FOR_DISPATCH: "NOT_READY_FOR_DISPATCH",
  NOT_SCANNED_BY_TRANSPORTER: "NOT_SCANNED_BY_TRANSPORTER",
  ALREADY_SCANNED_BY_WAREHOUSE: "ALREADY_SCANNED_BY_WAREHOUSE",
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const scanLogSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────────────────────────────
    // EVENT IDENTIFIERS
    // ─────────────────────────────────────────────────────────────────────────

    // Unique scan event identifier
    scanId: {
      type: String,
      required: [true, "Scan ID is required"],
      unique: true,
      index: true,
    },

    // Container being scanned
    containerId: {
      type: String,
      index: true,
      default: null,
    },

    // Parent shipment reference
    shipmentHash: {
      type: String,
      index: true,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ACTOR (Who performed the scan)
    // ─────────────────────────────────────────────────────────────────────────

    actor: {
      walletAddress: {
        type: String,
        required: [true, "Actor wallet address is required"],
        lowercase: true,
        index: true,
      },
      role: {
        type: String,
        required: [true, "Actor role is required"],
        lowercase: true,
        enum: ["supplier", "transporter", "warehouse", "retailer", "admin"],
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION & RESULT
    // ─────────────────────────────────────────────────────────────────────────

    // What type of scan action
    action: {
      type: String,
      enum: [...Object.values(SCAN_ACTION), null],
      default: SCAN_ACTION.SCAN_VERIFY,
    },

    // Scan result (ACCEPTED or REJECTED)
    result: {
      type: String,
      enum: Object.values(SCAN_RESULT),
      required: true,
      index: true,
    },

    // Rejection reason (only when result is REJECTED)
    rejectionReason: {
      type: String,
      enum: [...Object.values(REJECTION_REASONS), null],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // LOCATION (Where it happened - human readable string)
    // ─────────────────────────────────────────────────────────────────────────

    location: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SHIPMENT SNAPSHOT (Point-in-time state for audit)
    // ─────────────────────────────────────────────────────────────────────────

    shipmentSnapshot: {
      status: {
        type: String,
        default: null,
      },
      supplierWallet: {
        type: String,
        lowercase: true,
        default: null,
      },
      batchId: {
        type: String,
        default: null,
      },
      numberOfContainers: {
        type: Number,
        default: null,
      },
      assignedTransporter: {
        type: String,
        lowercase: true,
        default: null,
      },
      assignedWarehouse: {
        type: String,
        lowercase: true,
        default: null,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BLOCKCHAIN VERIFICATION (State at time of scan)
    // ─────────────────────────────────────────────────────────────────────────

    blockchainVerification: {
      txHash: {
        type: String,
        default: null,
      },
      blockNumber: {
        type: Number,
        default: null,
      },
      isLocked: {
        type: Boolean,
        default: false,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TIMESTAMP
    // ─────────────────────────────────────────────────────────────────────────

    scannedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: "scan_logs",
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPOUND INDEXES
// ═══════════════════════════════════════════════════════════════════════════

// Container scan history
scanLogSchema.index({ containerId: 1, scannedAt: -1 });

// Shipment timeline
scanLogSchema.index({ shipmentHash: 1, scannedAt: -1 });

// Actor activity log
scanLogSchema.index({ "actor.walletAddress": 1, scannedAt: -1 });

// Result-based queries
scanLogSchema.index({ result: 1, scannedAt: -1 });

// ═══════════════════════════════════════════════════════════════════════════
// UNIQUE SCAN PREVENTION (Critical integrity constraint)
// ═══════════════════════════════════════════════════════════════════════════
// Prevents:
//   - Duplicate scans (same container, action, role)
//   - Accidental double submissions
//   - Malicious replay attacks
// ═══════════════════════════════════════════════════════════════════════════

scanLogSchema.index(
  { containerId: 1, action: 1, "actor.role": 1 },
  { unique: true, sparse: true },
);

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique scan ID
 * Format: SCAN-{timestamp}-{random}
 */
scanLogSchema.statics.generateScanId = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SCAN-${timestamp}-${random}`;
};

/**
 * Map legacy action names to new explicit actions
 */
const mapToExplicitAction = (legacyAction) => {
  const actionMap = {
    VERIFY_ONLY: SCAN_ACTION.SCAN_VERIFY,
    PICKUP: SCAN_ACTION.CUSTODY_PICKUP,
    WAREHOUSE_RECEIVE: SCAN_ACTION.CUSTODY_RECEIVE,
    CONFIRM_DELIVERY: SCAN_ACTION.FINAL_DELIVERY,
    CONFIRM_DISPATCH: SCAN_ACTION.DISPATCH_CONFIRM,
    HANDOVER: SCAN_ACTION.CUSTODY_HANDOVER,
  };

  return actionMap[legacyAction] || SCAN_ACTION.SCAN_VERIFY;
};

/**
 * Log an accepted scan
 * Only saves if this containerId + action + role combination doesn't exist
 * @returns {Object|null} ScanLog document or existing scan if duplicate
 */
scanLogSchema.statics.logAccepted = async function (scanData) {
  if (!scanData?.actor?.walletAddress || !scanData?.actor?.role) {
    console.warn("logAccepted: Missing actor data, using defaults");
  }

  const action = mapToExplicitAction(scanData?.action);
  const containerId = scanData?.containerId || null;
  const role = scanData?.actor?.role || "admin";

  // Check if already scanned - don't save duplicate
  if (containerId) {
    const existingScan = await this.findOne({
      containerId,
      action,
      "actor.role": role,
    }).lean();

    if (existingScan) {
      console.log(
        `Container ${containerId} already scanned with action ${action} by ${role}`,
      );
      // Return existing scan instead of creating new
      existingScan.isDuplicate = true;
      return existingScan;
    }
  }

  // New scan - save to MongoDB
  return this.create({
    scanId: this.generateScanId(),
    containerId,
    shipmentHash: scanData?.shipmentHash || null,
    actor: {
      walletAddress: scanData?.actor?.walletAddress || "unknown",
      role,
    },
    action,
    result: SCAN_RESULT.ACCEPTED,
    location: scanData?.location || null,
    scannedAt: new Date(),
  });
};

/**
 * Log a rejected scan
 * NOTE: Rejected scans are NOT stored in the database.
 * This method only generates a scanId for the API response.
 * Only approved/accepted scans are persisted.
 */
scanLogSchema.statics.logRejected = async function (scanData, reason) {
  if (!scanData?.actor?.walletAddress || !scanData?.actor?.role) {
    console.warn("logRejected: Missing actor data, using defaults");
  }

  const containerId = scanData?.containerId || null;
  const role = scanData?.actor?.role || "admin";
  const action = SCAN_ACTION.SCAN_VERIFY;

  // Check if already scanned - don't save duplicate
  if (containerId) {
    const existingScan = await this.findOne({
      containerId,
      action,
      "actor.role": role,
    }).lean();

    if (existingScan) {
      console.log(
        `Container ${containerId} already has scan log for action ${action} by ${role}`,
      );
      existingScan.isDuplicate = true;
      return existingScan;
    }
  }

  // New scan - save to MongoDB
  return this.create({
    scanId: this.generateScanId(),
    containerId,
    shipmentHash: scanData?.shipmentHash || null,
    actor: {
      walletAddress: scanData?.actor?.walletAddress || "unknown",
      role,
    },
    action,
    result: SCAN_RESULT.REJECTED,
    ...(reason && { rejectionReason: reason }),
    location: scanData?.location || null,
    scannedAt: new Date(),
  });
};

/**
 * Backward compatibility: logVerified → logAccepted
 */
scanLogSchema.statics.logVerified = async function (scanData) {
  return this.logAccepted(scanData);
};

/**
 * Log an error during scan (system failure, not rejection)
 */
scanLogSchema.statics.logError = async function (
  scanData,
  errorMessage = "Unknown error",
) {
  const containerId = scanData?.containerId || null;

  // Errors are always logged (no duplicate check for errors)
  return this.create({
    scanId: this.generateScanId(),
    containerId,
    shipmentHash: scanData?.shipmentHash || null,
    actor: {
      walletAddress: scanData?.actor?.walletAddress || "unknown",
      role: scanData?.actor?.role || "unknown",
    },
    action: scanData?.action || SCAN_ACTION.SCAN_VERIFY,
    result: SCAN_RESULT.REJECTED,
    rejectionReason: "INTERNAL_ERROR",
    location: scanData?.location || null,
    shipmentSnapshot: scanData?.shipmentSnapshot || null,
    blockchainVerification: scanData?.blockchainVerification || null,
    scannedAt: new Date(),
  });
};

/**
 * Check if a scan already exists for given container/action/role
 * Use this to check before attempting a scan
 */
scanLogSchema.statics.scanExists = async function (containerId, action, role) {
  const existingScan = await this.findOne({
    containerId,
    action,
    "actor.role": role,
  }).lean();
  return existingScan;
};

/**
 * Get scan history for a shipment
 */
scanLogSchema.statics.getShipmentScanHistory = async function (
  shipmentHash,
  limit = 50,
) {
  return this.find({ shipmentHash })
    .sort({ scannedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get scan history for a container
 */
scanLogSchema.statics.getContainerScanHistory = async function (
  containerId,
  limit = 50,
) {
  return this.find({ containerId }).sort({ scannedAt: -1 }).limit(limit).lean();
};

/**
 * Get actor's scan activity
 */
scanLogSchema.statics.getActorActivity = async function (
  walletAddress,
  limit = 100,
) {
  return this.find({ "actor.walletAddress": walletAddress.toLowerCase() })
    .sort({ scannedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get scan statistics for analytics
 */
scanLogSchema.statics.getScanStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        scannedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          result: "$result",
          action: "$action",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.result",
        total: { $sum: "$count" },
        byAction: {
          $push: {
            action: "$_id.action",
            count: "$count",
          },
        },
      },
    },
  ]);
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const ScanLog = mongoose.model("ScanLog", scanLogSchema);

module.exports = ScanLog;
module.exports.SCAN_RESULT = SCAN_RESULT;
module.exports.SCAN_ACTION = SCAN_ACTION;
module.exports.REJECTION_REASONS = REJECTION_REASONS;
