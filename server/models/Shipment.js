/**
 * Shipment Model
 *
 * Sentinel backend acts as a blockchain indexer, transforming immutable
 * on-chain shipment events into queryable off-chain records for dashboards
 * and analytics.
 *
 * This model stores shipment data indexed from ShipmentLocked events emitted
 * by the SentinelShipmentRegistry smart contract. The blockchain is the source
 * of truth - this database is a read-optimized mirror for fast queries.
 *
 * ON-CHAIN DATA (indexed here):
 * - shipmentHash (unique identifier)
 * - supplierWallet (address that locked the shipment)
 * - batchId (product batch identifier)
 * - numberOfContainers (container count)
 * - quantityPerContainer (units per container)
 * - timestamp (block timestamp)
 *
 * OFF-CHAIN DERIVED DATA:
 * - totalQuantity (computed: numberOfContainers × quantityPerContainer)
 * - txHash (transaction hash for audit trail)
 * - blockNumber (block where event was emitted)
 * - status (shipment lifecycle status)
 */

const mongoose = require("mongoose");

// ═══════════════════════════════════════════════════════════════════════════
// SHIPMENT STATUS ENUM
// ═══════════════════════════════════════════════════════════════════════════

const SHIPMENT_STATUS = {
  CREATED: "CREATED", // Off-chain, not yet locked on blockchain
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  IN_TRANSIT: "IN_TRANSIT",
  AT_WAREHOUSE: "AT_WAREHOUSE",
  DELIVERED: "DELIVERED",
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const shipmentSchema = new mongoose.Schema(
  {
    // Primary identifier - matches on-chain shipmentHash
    shipmentHash: {
      type: String,
      required: [true, "Shipment hash is required"],
      unique: true,
      index: true,
      trim: true,
    },

    // Supplier wallet address that confirmed the shipment on-chain
    supplierWallet: {
      type: String,
      required: [true, "Supplier wallet address is required"],
      lowercase: true,
      index: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address`,
      },
    },

    // Product batch identifier from on-chain event
    batchId: {
      type: String,
      required: [true, "Batch ID is required"],
      trim: true,
      index: true,
    },

    // Number of containers in the shipment
    numberOfContainers: {
      type: Number,
      required: [true, "Number of containers is required"],
      min: [1, "Number of containers must be at least 1"],
    },

    // Quantity per container (units)
    quantityPerContainer: {
      type: Number,
      required: [true, "Quantity per container is required"],
      min: [1, "Quantity per container must be at least 1"],
    },

    // Derived field: totalQuantity = numberOfContainers × quantityPerContainer
    totalQuantity: {
      type: Number,
      required: true,
      min: [1, "Total quantity must be at least 1"],
    },

    // Transaction hash from the blockchain event (null until locked)
    txHash: {
      type: String,
      required: false,
      default: null,
      trim: true,
      index: true,
    },

    // Block number where the ShipmentLocked event was emitted
    blockNumber: {
      type: Number,
      required: false,
      default: null,
      index: true,
    },

    // Timestamp from the blockchain event (Unix timestamp)
    blockchainTimestamp: {
      type: Number,
      required: false,
      default: null,
    },

    // Current lifecycle status of the shipment
    status: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
      default: SHIPMENT_STATUS.CREATED,
      index: true,
    },
    // Last updated by (wallet or SYSTEM)
    lastUpdatedBy: {
      type: String,
      default: "SYSTEM",
    },
    // When this record was indexed into MongoDB
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

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSIGNED STAKEHOLDERS
    // ═══════════════════════════════════════════════════════════════════════════

    // Assigned Transporter - set during shipment creation or edit
    assignedTransporter: {
      walletAddress: {
        type: String,
        lowercase: true,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
          },
          message: (props) => `${props.value} is not a valid Ethereum address`,
        },
      },
      name: {
        type: String,
        trim: true,
      },
      organizationName: {
        type: String,
        trim: true,
      },
      assignedAt: {
        type: Date,
      },
    },

    // Assigned Warehouse - set during shipment creation or edit
    assignedWarehouse: {
      walletAddress: {
        type: String,
        lowercase: true,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
          },
          message: (props) => `${props.value} is not a valid Ethereum address`,
        },
      },
      name: {
        type: String,
        trim: true,
      },
      organizationName: {
        type: String,
        trim: true,
      },
      assignedAt: {
        type: Date,
      },
    },

    // Supporting documents uploaded for this shipment
    supportingDocuments: [
      {
        url: { type: String, required: true },
        uploadedBy: { type: String, required: true }, // wallet or 'SYSTEM'
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    collection: "shipments",
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPOUND INDEXES
// ═══════════════════════════════════════════════════════════════════════════

// Index for querying shipments by supplier and status
shipmentSchema.index({ supplierWallet: 1, status: 1 });

// Index for querying shipments by supplier ordered by creation time
shipmentSchema.index({ supplierWallet: 1, createdAt: -1 });

// Index for querying by batch ID
shipmentSchema.index({ batchId: 1, createdAt: -1 });

// Index for querying shipments by assigned transporter
shipmentSchema.index({ "assignedTransporter.walletAddress": 1, createdAt: -1 });

// Index for querying shipments by assigned warehouse
shipmentSchema.index({ "assignedWarehouse.walletAddress": 1, createdAt: -1 });

// ═══════════════════════════════════════════════════════════════════════════
// PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Automatically compute totalQuantity before saving
 * Note: Mongoose 5+ doesn't require next() for synchronous operations
 */
shipmentSchema.pre("save", function () {
  if (this.numberOfContainers && this.quantityPerContainer) {
    this.totalQuantity = this.numberOfContainers * this.quantityPerContainer;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a shipment already exists in the database
 * Used to prevent duplicate indexing of blockchain events
 */
shipmentSchema.statics.existsByHash = async function (shipmentHash) {
  const count = await this.countDocuments({ shipmentHash });
  return count > 0;
};

/**
 * Find all shipments for a given supplier wallet
 */
shipmentSchema.statics.findBySupplier = function (
  supplierWallet,
  options = {},
) {
  const { page = 1, limit = 20, status } = options;

  const query = { supplierWallet: supplierWallet.toLowerCase() };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Get shipment by hash
 */
shipmentSchema.statics.findByHash = function (shipmentHash) {
  return this.findOne({ shipmentHash });
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert to a clean JSON response object
 */
shipmentSchema.methods.toResponse = function () {
  return {
    shipmentHash: this.shipmentHash,
    supplierWallet: this.supplierWallet,
    batchId: this.batchId,
    numberOfContainers: this.numberOfContainers,
    quantityPerContainer: this.quantityPerContainer,
    totalQuantity: this.totalQuantity,
    txHash: this.txHash,
    blockNumber: this.blockNumber,
    blockchainTimestamp: this.blockchainTimestamp,
    status: this.status,
    // Assigned stakeholders
    assignedTransporter: this.assignedTransporter || null,
    assignedWarehouse: this.assignedWarehouse || null,
    // Legacy fields (kept for backward compatibility)
    transporterWallet:
      this.assignedTransporter?.walletAddress || this.transporterWallet || null,
    transporterName:
      this.assignedTransporter?.name || this.transporterName || null,
    warehouseWallet:
      this.assignedWarehouse?.walletAddress || this.warehouseWallet || null,
    warehouseName: this.assignedWarehouse?.name || this.warehouseName || null,
    createdAt: this.createdAt,
    supportingDocuments: this.supportingDocuments || [],
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const Shipment = mongoose.model("Shipment", shipmentSchema);

module.exports = Shipment;
module.exports.SHIPMENT_STATUS = SHIPMENT_STATUS;
