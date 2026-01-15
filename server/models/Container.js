/**
 * Container Model
 *
 * Sentinel backend acts as a blockchain indexer, transforming immutable
 * on-chain shipment events into queryable off-chain records for dashboards
 * and analytics.
 *
 * Containers are OFF-CHAIN entities generated when a ShipmentLocked event is
 * indexed. Each container gets a unique ID and QR code for physical tracking.
 *
 * Container data is NOT stored on blockchain - only the parent shipment is.
 * This allows for efficient container-level operations without gas costs.
 *
 * CONTAINER LIFECYCLE:
 * 1. CREATED - Generated when shipment is indexed from blockchain
 * 2. SCANNED - QR code has been scanned (future phase)
 * 3. IN_TRANSIT - Container is being transported (future phase)
 * 4. DELIVERED - Container reached destination (future phase)
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER STATUS ENUM
// ═══════════════════════════════════════════════════════════════════════════

const CONTAINER_STATUS = {
  CREATED: "CREATED",
  SCANNED: "SCANNED",
  IN_TRANSIT: "IN_TRANSIT",
  AT_WAREHOUSE: "AT_WAREHOUSE",
  DELIVERED: "DELIVERED",
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const containerSchema = new mongoose.Schema(
  {
    // Unique container identifier (generated off-chain)
    containerId: {
      type: String,
      required: [true, "Container ID is required"],
      unique: true,
      index: true,
      trim: true,
    },

    // Reference to parent shipment hash (links to on-chain shipment)
    shipmentHash: {
      type: String,
      required: [true, "Shipment hash is required"],
      index: true,
      trim: true,
    },

    // Sequential number within the shipment (1 to numberOfContainers)
    containerNumber: {
      type: Number,
      required: [true, "Container number is required"],
      min: [1, "Container number must be at least 1"],
    },

    // QR code payload data (JSON string for scanning)
    qrData: {
      type: String,
      required: [true, "QR data is required"],
    },

    // Quantity of items in this container
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    // Current status of the container
    status: {
      type: String,
      enum: Object.values(CONTAINER_STATUS),
      default: CONTAINER_STATUS.CREATED,
      index: true,
    },

    // Last scan location (for future tracking)
    lastScanLocation: {
      type: String,
      default: null,
    },

    // Last scan timestamp
    lastScanAt: {
      type: Date,
      default: null,
    },

    // Wallet that performed the last scan
    lastScannedBy: {
      type: String,
      lowercase: true,
      default: null,
    },

    // When this container was created
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Last update timestamp
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "containers",
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPOUND INDEXES
// ═══════════════════════════════════════════════════════════════════════════

// Index for querying containers by shipment and status
containerSchema.index({ shipmentHash: 1, status: 1 });

// Unique constraint: only one container per (shipmentHash, containerNumber)
// Also serves as index for querying containers by shipment ordered by number
containerSchema.index(
  { shipmentHash: 1, containerNumber: 1 },
  { unique: true }
);

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique container ID
 * Format: CNT-{timestamp}-{random}
 */
containerSchema.statics.generateContainerId = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CNT-${timestamp}-${random}`;
};

/**
 * Generate QR data payload for a container
 * QR code encodes ONLY the unique containerId for scanning
 */
containerSchema.statics.generateQRData = function (containerId) {
  // QR encodes only the containerId - simple and unique
  return containerId;
};

/**
 * Create containers for a shipment
 * Called when a ShipmentLocked event is indexed
 */
containerSchema.statics.createForShipment = async function (shipmentData) {
  const { shipmentHash, batchId, numberOfContainers, quantityPerContainer } =
    shipmentData;

  const containers = [];

  for (let i = 1; i <= numberOfContainers; i++) {
    const containerId = this.generateContainerId();
    const qrData = this.generateQRData(containerId);

    containers.push({
      containerId,
      shipmentHash,
      containerNumber: i,
      qrData,
      quantity: quantityPerContainer,
      status: CONTAINER_STATUS.CREATED,
    });
  }

  // Bulk insert all containers
  return this.insertMany(containers);
};

/**
 * Find all containers for a shipment
 */
containerSchema.statics.findByShipment = function (shipmentHash, options = {}) {
  const { page = 1, limit = 100, status } = options;

  const query = { shipmentHash };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ containerNumber: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Get container by ID
 */
containerSchema.statics.findByContainerId = function (containerId) {
  return this.findOne({ containerId });
};

/**
 * Check if containers already exist for a shipment
 * Used to prevent duplicate container generation
 */
containerSchema.statics.existsForShipment = async function (shipmentHash) {
  const count = await this.countDocuments({ shipmentHash });
  return count > 0;
};

/**
 * Get container count for a shipment
 */
containerSchema.statics.countByShipment = function (shipmentHash) {
  return this.countDocuments({ shipmentHash });
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert to a clean JSON response object
 */
containerSchema.methods.toResponse = function () {
  return {
    containerId: this.containerId,
    shipmentHash: this.shipmentHash,
    containerNumber: this.containerNumber,
    quantity: this.quantity,
    status: this.status,
    qrData: this.qrData,
    lastScanLocation: this.lastScanLocation,
    lastScanAt: this.lastScanAt,
    lastScannedBy: this.lastScannedBy,
    createdAt: this.createdAt,
  };
};

/**
 * Parse the QR data payload
 * QR data now contains only the containerId string
 */
containerSchema.methods.parseQRData = function () {
  // qrData is now just the containerId string
  return { containerId: this.qrData };
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const Container = mongoose.model("Container", containerSchema);

module.exports = Container;
module.exports.CONTAINER_STATUS = CONTAINER_STATUS;
