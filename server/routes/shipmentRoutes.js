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

const express = require("express");
const router = express.Router();
const Shipment = require("../models/Shipment");
const Container = require("../models/Container");
const User = require("../models/User");
const {
  uploadSupportingDocuments,
  handleUploadErrors,
} = require("../middleware/upload.middleware");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} = require("../config/cloudinary.config");

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

// Only allow IN_TRANSIT if all containers are scanned
const canSetInTransit = async (shipmentId) => {
  try {
    // Find shipment by hash or _id (only use _id if it's a valid ObjectId format)
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(shipmentId) && /^[0-9a-fA-F]{24}$/.test(shipmentId);
    
    const query = isValidObjectId 
      ? { $or: [{ shipmentHash: shipmentId }, { _id: shipmentId }] }
      : { shipmentHash: shipmentId };
    
    const shipment = await Shipment.findOne(query);
    
    if (!shipment) {
      console.log('canSetInTransit: Shipment not found for ID:', shipmentId);
      return false;
    }
    
    // Find all containers for this shipment
    const containers = await Container.find({ shipmentHash: shipment.shipmentHash });
    
    console.log('canSetInTransit check:', {
      shipmentHash: shipment.shipmentHash,
      shipmentCurrentStatus: shipment.status,
      totalContainers: containers.length,
      containerStatuses: containers.map(c => ({ id: c.containerId, status: c.status })),
      uniqueStatuses: [...new Set(containers.map(c => c.status))]
    });
    
    if (containers.length === 0) {
      console.log('canSetInTransit: No containers found for shipment');
      return false;
    }
    
    // Check each container status
    const statusCheck = containers.map(c => {
      const isValid = c.status === "IN_TRANSIT" || c.status === "DELIVERED";
      return { id: c.containerId, status: c.status, isValid };
    });
    
    console.log('Container status validation:', statusCheck);
    
    // All must be IN_TRANSIT or DELIVERED
    const allScanned = containers.every((c) => c.status === "IN_TRANSIT" || c.status === "DELIVERED");
    console.log('canSetInTransit result:', allScanned);
    
    return allScanned;
  } catch (error) {
    console.error('Error in canSetInTransit:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/shipments
 *
 * Create a new shipment off-chain (before blockchain confirmation)
 * This allows uploading documents before the shipment is locked on blockchain
 *
 * Body:
 * - shipmentHash: Unique identifier for the shipment
 * - supplierWallet: Ethereum address of the supplier
 * - batchId: Product batch identifier
 * - numberOfContainers: Number of containers
 * - quantityPerContainer: Quantity per container
 * - assignedTransporterWallet: (Required) Wallet address of assigned transporter
 * - assignedWarehouseWallet: (Required) Wallet address of assigned warehouse
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      shipmentHash,
      supplierWallet,
      batchId,
      numberOfContainers,
      quantityPerContainer,
      assignedTransporterWallet,
      assignedWarehouseWallet,
    } = req.body;

    // Validate required fields
    if (
      !shipmentHash ||
      !supplierWallet ||
      !batchId ||
      !numberOfContainers ||
      !quantityPerContainer
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: shipmentHash, supplierWallet, batchId, numberOfContainers, quantityPerContainer",
      });
    }

    // Validate assigned transporter and warehouse (now required)
    if (!assignedTransporterWallet) {
      return res.status(400).json({
        success: false,
        message:
          "assignedTransporterWallet is required. Please select a transporter.",
      });
    }

    if (!assignedWarehouseWallet) {
      return res.status(400).json({
        success: false,
        message:
          "assignedWarehouseWallet is required. Please select a warehouse.",
      });
    }

    if (!isValidAddress(supplierWallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier wallet address format",
      });
    }

    if (!isValidAddress(assignedTransporterWallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transporter wallet address format",
      });
    }

    if (!isValidAddress(assignedWarehouseWallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse wallet address format",
      });
    }

    // Validate that the transporter wallet belongs to a TRANSPORTER role user
    const transporterUser = await User.findOne({
      walletAddress: assignedTransporterWallet.toLowerCase(),
      status: "ACTIVE",
    });

    if (!transporterUser) {
      return res.status(400).json({
        success: false,
        message: "Assigned transporter wallet not found or inactive",
      });
    }

    if (transporterUser.role !== "transporter") {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment: wallet ${assignedTransporterWallet} is not a transporter (role: ${transporterUser.role})`,
      });
    }

    // Validate that the warehouse wallet belongs to a WAREHOUSE role user
    const warehouseUser = await User.findOne({
      walletAddress: assignedWarehouseWallet.toLowerCase(),
      status: "ACTIVE",
    });

    if (!warehouseUser) {
      return res.status(400).json({
        success: false,
        message: "Assigned warehouse wallet not found or inactive",
      });
    }

    if (warehouseUser.role !== "warehouse") {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment: wallet ${assignedWarehouseWallet} is not a warehouse (role: ${warehouseUser.role})`,
      });
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ shipmentHash });
    if (existingShipment) {
      return res.status(409).json({
        success: false,
        message: "Shipment with this hash already exists",
      });
    }

    // Create shipment off-chain (no txHash yet) with assigned stakeholders
    const shipment = new Shipment({
      shipmentHash,
      supplierWallet: supplierWallet.toLowerCase(),
      batchId,
      numberOfContainers: parseInt(numberOfContainers),
      quantityPerContainer: parseInt(quantityPerContainer),
      totalQuantity:
        parseInt(numberOfContainers) * parseInt(quantityPerContainer),
      status: "CREATED", // Not yet locked on blockchain
      txHash: null,
      blockNumber: null,
      blockchainTimestamp: null,
      // Assigned stakeholders
      assignedTransporter: {
        walletAddress: transporterUser.walletAddress,
        name: transporterUser.fullName || "",
        organizationName: transporterUser.organizationName || "",
        assignedAt: new Date(),
      },
      assignedWarehouse: {
        walletAddress: warehouseUser.walletAddress,
        name: warehouseUser.fullName || "",
        organizationName: warehouseUser.organizationName || "",
        assignedAt: new Date(),
      },
    });

    await shipment.save();

    // Create containers in MongoDB
    const numContainers = parseInt(numberOfContainers);
    const qtyPerContainer = parseInt(quantityPerContainer);
    const containers = [];

    for (let i = 1; i <= numContainers; i++) {
      const containerId = Container.generateContainerId();
      const qrData = Container.generateQRData(containerId, shipmentHash, i);

      containers.push({
        containerId,
        shipmentHash,
        containerNumber: i,
        qrData: JSON.stringify(qrData),
        quantity: qtyPerContainer,
        status: "CREATED",
      });
    }

    // Insert all containers
    if (containers.length > 0) {
      await Container.insertMany(containers);
    }

    res.status(201).json({
      success: true,
      data: {
        shipmentHash: shipment.shipmentHash,
        supplierWallet: shipment.supplierWallet,
        batchId: shipment.batchId,
        numberOfContainers: shipment.numberOfContainers,
        quantityPerContainer: shipment.quantityPerContainer,
        totalQuantity: shipment.totalQuantity,
        status: shipment.status,
        assignedTransporter: shipment.assignedTransporter,
        assignedWarehouse: shipment.assignedWarehouse,
        createdAt: shipment.createdAt,
        containersCreated: containers.length,
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create shipment",
    });
  }
});

/**
 * PATCH /api/shipments/:shipmentHash/lock
 *
 * Lock a shipment on blockchain (update with txHash)
 * Called after the blockchain transaction is confirmed
 *
 * Body:
 * - txHash: Transaction hash from blockchain
 * - blockNumber: Block number where transaction was mined
 * - blockchainTimestamp: Timestamp from blockchain
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.patch("/:shipmentHash/lock", async (req, res) => {
  try {
    const { shipmentHash } = req.params;
    const { txHash, blockNumber, blockchainTimestamp } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: "txHash is required",
      });
    }

    const shipment = await Shipment.findOne({ shipmentHash });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.txHash) {
      return res.status(400).json({
        success: false,
        message: "Shipment is already locked on blockchain",
      });
    }

    // Update with blockchain data
    shipment.txHash = txHash;
    shipment.blockNumber = blockNumber || 0;
    shipment.blockchainTimestamp =
      blockchainTimestamp || Math.floor(Date.now() / 1000);
    shipment.status = "READY_FOR_DISPATCH";
    shipment.updatedAt = new Date();

    await shipment.save();

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
        status: shipment.status,
        supportingDocuments: shipment.supportingDocuments || [],
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error locking shipment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lock shipment",
    });
  }
});

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
router.get("/", async (req, res) => {
  try {
    const { supplierWallet, transporterWallet, warehouseWallet, status } =
      req.query;
    const { page, limit } = parsePagination(req.query);

    // Build query
    const query = {};

    // Filter by supplier wallet if provided
    if (supplierWallet) {
      if (!isValidAddress(supplierWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid supplier wallet address format",
        });
      }
      query.supplierWallet = supplierWallet.toLowerCase();
    }

    // Filter by transporter wallet if provided
    if (transporterWallet) {
      if (!isValidAddress(transporterWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transporter wallet address format",
        });
      }
      query["assignedTransporter.walletAddress"] =
        transporterWallet.toLowerCase();
    }

    // Filter by warehouse wallet if provided
    if (warehouseWallet) {
      if (!isValidAddress(warehouseWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid warehouse wallet address format",
        });
      }
      query["assignedWarehouse.walletAddress"] = warehouseWallet.toLowerCase();
    }

    // Filter by status if provided
    if (status) {
      const validStatuses = Object.values(
        Shipment.schema.path("status").enumValues || [
          "READY_FOR_DISPATCH",
          "IN_TRANSIT",
          "AT_WAREHOUSE",
          "DELIVERED",
        ]
      );

      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
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
    const data = shipments.map((shipment) => ({
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
      // Assigned stakeholders (new format)
      assignedTransporter: shipment.assignedTransporter || null,
      assignedWarehouse: shipment.assignedWarehouse || null,
      // Legacy fields for backward compatibility
      transporterWallet:
        shipment.assignedTransporter?.walletAddress ||
        shipment.transporterWallet,
      transporterName:
        shipment.assignedTransporter?.name || shipment.transporterName,
      warehouseWallet:
        shipment.assignedWarehouse?.walletAddress || shipment.warehouseWallet,
      warehouseName: shipment.assignedWarehouse?.name || shipment.warehouseName,
      createdAt: shipment.createdAt,
      supportingDocuments: shipment.supportingDocuments || [],
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
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
router.get("/:shipmentHash", async (req, res) => {
  try {
    const { shipmentHash } = req.params;

    if (!shipmentHash || shipmentHash.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Shipment hash is required",
      });
    }

    // Find shipment by hash
    const shipment = await Shipment.findOne({ shipmentHash }).lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
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
        // Assigned stakeholders (new format)
        assignedTransporter: shipment.assignedTransporter || null,
        assignedWarehouse: shipment.assignedWarehouse || null,
        // Legacy fields for backward compatibility
        transporterWallet:
          shipment.assignedTransporter?.walletAddress ||
          shipment.transporterWallet,
        transporterName:
          shipment.assignedTransporter?.name || shipment.transporterName,
        warehouseWallet:
          shipment.assignedWarehouse?.walletAddress || shipment.warehouseWallet,
        warehouseName:
          shipment.assignedWarehouse?.name || shipment.warehouseName,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
        supportingDocuments: shipment.supportingDocuments || [],
      },
    });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipment",
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-BASED SHIPMENT FETCH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/shipments/transporter/:walletAddress
 *
 * Fetch shipments assigned to a specific transporter.
 * Transporter dashboard uses this endpoint.
 *
 * Path Parameters:
 * - walletAddress: The transporter's wallet address
 *
 * Query Parameters:
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
router.get("/transporter/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status } = req.query;
    const { page, limit } = parsePagination(req.query);

    if (!walletAddress || !isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Valid transporter wallet address is required",
      });
    }

    // Build query - only shipments assigned to this transporter
    const query = {
      "assignedTransporter.walletAddress": walletAddress.toLowerCase(),
    };

    // Filter by status if provided
    if (status) {
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
    const data = shipments.map((shipment) => ({
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
      assignedTransporter: shipment.assignedTransporter || null,
      assignedWarehouse: shipment.assignedWarehouse || null,
      createdAt: shipment.createdAt,
      supportingDocuments: shipment.supportingDocuments || [],
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transporter shipments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
});

/**
 * GET /api/shipments/warehouse/:walletAddress
 *
 * Fetch shipments assigned to a specific warehouse.
 * Warehouse dashboard uses this endpoint.
 *
 * Path Parameters:
 * - walletAddress: The warehouse's wallet address
 *
 * Query Parameters:
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
router.get("/warehouse/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status } = req.query;
    const { page, limit } = parsePagination(req.query);

    if (!walletAddress || !isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Valid warehouse wallet address is required",
      });
    }

    // Build query - only shipments assigned to this warehouse
    const query = {
      "assignedWarehouse.walletAddress": walletAddress.toLowerCase(),
    };

    // Filter by status if provided
    if (status) {
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
    const data = shipments.map((shipment) => ({
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
      assignedTransporter: shipment.assignedTransporter || null,
      assignedWarehouse: shipment.assignedWarehouse || null,
      createdAt: shipment.createdAt,
      supportingDocuments: shipment.supportingDocuments || [],
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching warehouse shipments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
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
router.get("/stats/summary", async (req, res) => {
  try {
    const { supplierWallet } = req.query;

    // Build match stage
    const matchStage = {};
    if (supplierWallet) {
      if (!isValidAddress(supplierWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid supplier wallet address format",
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
          totalContainers: { $sum: "$numberOfContainers" },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
    ]);

    // Get counts by status
    const statusCounts = await Shipment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus = {};
    statusCounts.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    const summaryData = stats[0] || {
      totalShipments: 0,
      totalContainers: 0,
      totalQuantity: 0,
    };

    res.json({
      success: true,
      data: {
        totalShipments: summaryData.totalShipments,
        totalContainers: summaryData.totalContainers,
        totalQuantity: summaryData.totalQuantity,
        byStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching shipment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipment statistics",
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/shipments/:shipmentHash/documents
 *
 * Upload supporting documents for a shipment
 * Files are uploaded to Cloudinary and URLs are saved to the shipment
 *
 * Path Parameters:
 * - shipmentHash: The unique shipment identifier
 *
 * Body (multipart/form-data):
 * - supportingDocuments: File(s) to upload (max 10 files, 5MB each)
 * - uploadedBy: Wallet address or 'SYSTEM' (required)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     uploadedDocuments: [...urls],
 *     shipmentHash: string
 *   }
 * }
 */
router.post(
  "/:shipmentHash/documents",
  uploadSupportingDocuments,
  handleUploadErrors,
  async (req, res) => {
    try {
      const { shipmentHash } = req.params;
      const { uploadedBy } = req.body;

      // Validate shipmentHash
      if (!shipmentHash || shipmentHash.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Shipment hash is required",
        });
      }

      // Validate uploadedBy
      if (!uploadedBy || uploadedBy.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "uploadedBy is required (wallet address or SYSTEM)",
        });
      }

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one file is required",
        });
      }

      // Find the shipment
      const shipment = await Shipment.findOne({ shipmentHash });
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found",
        });
      }

      // Check if shipment is locked (IN_TRANSIT or DELIVERED - cannot modify after dispatch)
      const lockedStatuses = ["IN_TRANSIT", "DELIVERED"];
      if (lockedStatuses.includes(shipment.status)) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot upload documents. Shipment is in transit or delivered.",
        });
      }

      // Upload files to Cloudinary and collect URLs
      const uploadedDocuments = [];
      const uploadPromises = req.files.map(async (file) => {
        const result = await uploadToCloudinary(
          file.buffer,
          {
            folder: "sentinel/shipment-documents",
            public_id: `${shipmentHash}_${Date.now()}_${file.originalname.replace(
              /\.[^/.]+$/,
              ""
            )}`,
          },
          file.mimetype
        );
        return {
          url: result.secure_url,
          uploadedBy: uploadedBy.trim(),
          uploadedAt: new Date(),
        };
      });

      // Wait for all uploads to complete
      const newDocuments = await Promise.all(uploadPromises);
      uploadedDocuments.push(...newDocuments);

      // Add documents to shipment and update timestamp
      shipment.supportingDocuments = [
        ...(shipment.supportingDocuments || []),
        ...newDocuments,
      ];
      shipment.updatedAt = new Date();
      await shipment.save();

      res.json({
        success: true,
        data: {
          uploadedDocuments: newDocuments.map((doc) => doc.url),
          shipmentHash: shipment.shipmentHash,
          totalDocuments: shipment.supportingDocuments.length,
        },
      });
    } catch (error) {
      console.error("Error uploading shipment documents:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload documents",
      });
    }
  }
);

/**
 * GET /api/shipments/:shipmentHash/documents
 *
 * Get all supporting documents for a shipment
 *
 * Path Parameters:
 * - shipmentHash: The unique shipment identifier
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     documents: [...],
 *     shipmentHash: string
 *   }
 * }
 */
router.get("/:shipmentHash/documents", async (req, res) => {
  try {
    const { shipmentHash } = req.params;

    if (!shipmentHash || shipmentHash.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Shipment hash is required",
      });
    }

    const shipment = await Shipment.findOne({ shipmentHash }).lean();
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    res.json({
      success: true,
      data: {
        documents: shipment.supportingDocuments || [],
        shipmentHash: shipment.shipmentHash,
      },
    });
  } catch (error) {
    console.error("Error fetching shipment documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
});

/**
 * DELETE /api/shipments/:shipmentHash/documents/:docIndex
 *
 * Delete a supporting document from a shipment
 *
 * Path Parameters:
 * - shipmentHash: The unique shipment identifier
 * - docIndex: Index of the document to delete
 *
 * Response:
 * {
 *   success: true,
 *   message: 'Document deleted successfully'
 * }
 */
router.delete("/:shipmentHash/documents/:docIndex", async (req, res) => {
  try {
    const { shipmentHash, docIndex } = req.params;
    const index = parseInt(docIndex, 10);

    if (!shipmentHash || shipmentHash.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Shipment hash is required",
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid document index",
      });
    }

    const shipment = await Shipment.findOne({ shipmentHash });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Check if shipment is blockchain locked (has txHash) or has locked status
    if (shipment.txHash) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete documents. Shipment is locked on blockchain.",
      });
    }

    const lockedStatuses = ["IN_TRANSIT", "DELIVERED"];
    if (lockedStatuses.includes(shipment.status)) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot delete documents. Shipment is in transit or delivered.",
      });
    }

    if (
      !shipment.supportingDocuments ||
      index >= shipment.supportingDocuments.length
    ) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Get the document to delete
    const docToDelete = shipment.supportingDocuments[index];

    // Try to delete from Cloudinary
    if (docToDelete.url) {
      const publicIdInfo = extractPublicIdFromUrl(docToDelete.url);
      if (publicIdInfo) {
        try {
          await deleteFromCloudinary(
            publicIdInfo.publicId,
            publicIdInfo.resourceType
          );
        } catch (cloudinaryError) {
          console.error("Failed to delete from Cloudinary:", cloudinaryError);
          // Continue with DB deletion even if Cloudinary fails
        }
      }
    }

    // Remove from array
    shipment.supportingDocuments.splice(index, 1);
    shipment.updatedAt = new Date();
    await shipment.save();

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: {
        remainingDocuments: shipment.supportingDocuments.length,
      },
    });
  } catch (error) {
    console.error("Error deleting shipment document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
});

/**
 * Update shipment status
 * PUT /api/shipments/:shipmentId/status
 */
router.put('/:shipmentId/status', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status } = req.body;
    
    console.log('Update shipment status request:', { shipmentId, status });
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    if (status === 'IN_TRANSIT') {
      const allowed = await canSetInTransit(shipmentId);
      if (!allowed) {
        return res.status(400).json({ success: false, message: 'All containers must be scanned before setting shipment IN_TRANSIT' });
      }
    }
    
    // Only use _id if it's a valid ObjectId format
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(shipmentId) && /^[0-9a-fA-F]{24}$/.test(shipmentId);
    
    const query = isValidObjectId 
      ? { $or: [{ shipmentHash: shipmentId }, { _id: shipmentId }] }
      : { shipmentHash: shipmentId };
    
    const shipment = await Shipment.findOneAndUpdate(
      query,
      { $set: { status } },
      { new: true }
    );
    
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    
    console.log('Shipment status updated:', { shipmentHash: shipment.shipmentHash, newStatus: status });
    return res.json({ success: true, shipment });
  } catch (err) {
    console.error('Update shipment status error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
