/**
 * ShipmentConcern Model
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CONCERN / ISSUE TRACKING FOR SHIPMENTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Records concerns raised during scanning/transport. Concerns are informational
 * and do NOT block the scan workflow (unless marked as critical).
 * 
 * CONCERN TYPES:
 * - DAMAGE: Physical damage to container/contents
 * - MISSING: Contents appear to be missing
 * - TAMPER: Signs of tampering detected
 * - DELAY: Unexpected delay in transit
 * - OTHER: General concern
 * 
 * CONCERN SEVERITY:
 * - LOW: Minor issue, informational only
 * - MEDIUM: Requires attention but not urgent
 * - HIGH: Urgent issue requiring immediate action
 * - CRITICAL: Blocks further processing (scan fails)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

const CONCERN_TYPE = {
  DAMAGE: 'DAMAGE',
  MISSING: 'MISSING',
  TAMPER: 'TAMPER',
  DELAY: 'DELAY',
  OTHER: 'OTHER'
};

const CONCERN_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const CONCERN_STATUS = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const shipmentConcernSchema = new mongoose.Schema({
  // Unique concern identifier
  concernId: {
    type: String,
    required: [true, 'Concern ID is required'],
    unique: true,
    index: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RELATED ENTITIES
  // ─────────────────────────────────────────────────────────────────────────

  // Parent shipment
  shipmentHash: {
    type: String,
    required: [true, 'Shipment hash is required'],
    index: true
  },

  // Specific container (optional - concern may be for entire shipment)
  containerId: {
    type: String,
    index: true,
    default: null
  },

  // Related scan ID (if raised during scan)
  scanId: {
    type: String,
    index: true,
    default: null
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONCERN DETAILS
  // ─────────────────────────────────────────────────────────────────────────

  // Type of concern
  type: {
    type: String,
    enum: Object.values(CONCERN_TYPE),
    default: CONCERN_TYPE.OTHER
  },

  // Severity level
  severity: {
    type: String,
    enum: Object.values(CONCERN_SEVERITY),
    default: CONCERN_SEVERITY.MEDIUM
  },

  // Current status
  status: {
    type: String,
    enum: Object.values(CONCERN_STATUS),
    default: CONCERN_STATUS.OPEN,
    index: true
  },

  // Concern description (free text from reporter)
  description: {
    type: String,
    required: [true, 'Concern description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTER
  // ─────────────────────────────────────────────────────────────────────────

  reportedBy: {
    walletAddress: {
      type: String,
      required: [true, 'Reporter wallet is required'],
      lowercase: true,
      index: true
    },
    role: {
      type: String,
      required: [true, 'Reporter role is required'],
      lowercase: true,
      enum: ['supplier', 'transporter', 'warehouse', 'retailer', 'admin']
    },
    name: {
      type: String,
      default: null
    }
  },

  // When the concern was raised
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SUPPLIER NOTIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  // Supplier who should be notified
  supplierWallet: {
    type: String,
    required: [true, 'Supplier wallet is required'],
    lowercase: true,
    index: true
  },

  // Notification tracking
  notification: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date,
      default: null
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  resolution: {
    resolvedBy: {
      type: String,
      lowercase: true,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      maxlength: [2000, 'Resolution notes cannot exceed 2000 characters'],
      default: null
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EVIDENCE (Optional)
  // ─────────────────────────────────────────────────────────────────────────

  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'note'],
      default: 'note'
    },
    url: {
      type: String,
      default: null
    },
    description: {
      type: String,
      maxlength: 500
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'shipment_concerns'
});

// ═══════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════

// Query concerns by shipment and status
shipmentConcernSchema.index({ shipmentHash: 1, status: 1 });

// Query concerns by reporter
shipmentConcernSchema.index({ 'reportedBy.walletAddress': 1, reportedAt: -1 });

// Query open concerns for supplier
shipmentConcernSchema.index({ supplierWallet: 1, status: 1, reportedAt: -1 });

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique concern ID
 */
shipmentConcernSchema.statics.generateConcernId = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CONCERN-${timestamp}-${random}`;
};

/**
 * Create a new concern
 */
shipmentConcernSchema.statics.createConcern = async function(data) {
  const concernId = this.generateConcernId();
  
  const concern = await this.create({
    concernId,
    shipmentHash: data.shipmentHash,
    containerId: data.containerId || null,
    scanId: data.scanId || null,
    type: data.type || CONCERN_TYPE.OTHER,
    severity: data.severity || CONCERN_SEVERITY.MEDIUM,
    description: data.description,
    reportedBy: {
      walletAddress: data.reporterWallet,
      role: data.reporterRole,
      name: data.reporterName || null
    },
    supplierWallet: data.supplierWallet,
    evidence: data.evidence || []
  });

  return concern;
};

/**
 * Get open concerns for a supplier
 */
shipmentConcernSchema.statics.getOpenConcernsForSupplier = function(supplierWallet, limit = 50) {
  return this.find({
    supplierWallet: supplierWallet.toLowerCase(),
    status: { $in: [CONCERN_STATUS.OPEN, CONCERN_STATUS.ACKNOWLEDGED, CONCERN_STATUS.INVESTIGATING] }
  })
    .sort({ reportedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get concerns for a shipment
 */
shipmentConcernSchema.statics.getConcernsForShipment = function(shipmentHash, limit = 50) {
  return this.find({ shipmentHash })
    .sort({ reportedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Mark notification as sent
 */
shipmentConcernSchema.statics.markNotificationSent = async function(concernId) {
  return this.updateOne(
    { concernId },
    {
      $set: {
        'notification.sent': true,
        'notification.sentAt': new Date()
      }
    }
  );
};

/**
 * Acknowledge a concern
 */
shipmentConcernSchema.statics.acknowledgeConcern = async function(concernId, acknowledgerWallet) {
  return this.updateOne(
    { concernId },
    {
      $set: {
        status: CONCERN_STATUS.ACKNOWLEDGED,
        'notification.acknowledged': true,
        'notification.acknowledgedAt': new Date()
      }
    }
  );
};

/**
 * Resolve a concern
 */
shipmentConcernSchema.statics.resolveConcern = async function(concernId, resolverWallet, notes = null) {
  return this.updateOne(
    { concernId },
    {
      $set: {
        status: CONCERN_STATUS.RESOLVED,
        'resolution.resolvedBy': resolverWallet.toLowerCase(),
        'resolution.resolvedAt': new Date(),
        'resolution.notes': notes
      }
    }
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if concern is critical (should block scanning)
 */
shipmentConcernSchema.methods.isCritical = function() {
  return this.severity === CONCERN_SEVERITY.CRITICAL;
};

/**
 * Convert to response object
 */
shipmentConcernSchema.methods.toResponse = function() {
  return {
    concernId: this.concernId,
    shipmentHash: this.shipmentHash,
    containerId: this.containerId,
    type: this.type,
    severity: this.severity,
    status: this.status,
    description: this.description,
    reportedBy: this.reportedBy,
    reportedAt: this.reportedAt,
    notification: this.notification,
    resolution: this.resolution,
    evidence: this.evidence
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const ShipmentConcern = mongoose.model('ShipmentConcern', shipmentConcernSchema);

module.exports = ShipmentConcern;
module.exports.CONCERN_TYPE = CONCERN_TYPE;
module.exports.CONCERN_SEVERITY = CONCERN_SEVERITY;
module.exports.CONCERN_STATUS = CONCERN_STATUS;
