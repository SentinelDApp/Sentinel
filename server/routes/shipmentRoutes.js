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
const ScanLog = require("../models/ScanLog");
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
    const mongoose = require("mongoose");
    const isValidObjectId =
      mongoose.Types.ObjectId.isValid(shipmentId) &&
      /^[0-9a-fA-F]{24}$/.test(shipmentId);

    const query = isValidObjectId
      ? { $or: [{ shipmentHash: shipmentId }, { _id: shipmentId }] }
      : { shipmentHash: shipmentId };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      console.log("canSetInTransit: Shipment not found for ID:", shipmentId);
      return false;
    }

    // Find all containers for this shipment
    const containers = await Container.find({
      shipmentHash: shipment.shipmentHash,
    });

    console.log("canSetInTransit check:", {
      shipmentHash: shipment.shipmentHash,
      shipmentCurrentStatus: shipment.status,
      totalContainers: containers.length,
      containerStatuses: containers.map((c) => ({
        id: c.containerId,
        status: c.status,
      })),
      uniqueStatuses: [...new Set(containers.map((c) => c.status))],
    });

    if (containers.length === 0) {
      console.log("canSetInTransit: No containers found for shipment");
      return false;
    }

    // Check each container status
    const statusCheck = containers.map((c) => {
      const isValid = c.status === "IN_TRANSIT" || c.status === "DELIVERED";
      return { id: c.containerId, status: c.status, isValid };
    });

    console.log("Container status validation:", statusCheck);

    // All must be IN_TRANSIT or DELIVERED
    const allScanned = containers.every(
      (c) => c.status === "IN_TRANSIT" || c.status === "DELIVERED",
    );
    console.log("canSetInTransit result:", allScanned);

    return allScanned;
  } catch (error) {
    console.error("Error in canSetInTransit:", error);
    return false;
  }
};

// Only allow AT_WAREHOUSE if all containers are at warehouse
const canSetAtWarehouse = async (shipmentId) => {
  try {
    // Find shipment by hash or _id (only use _id if it's a valid ObjectId format)
    const mongoose = require("mongoose");
    const isValidObjectId =
      mongoose.Types.ObjectId.isValid(shipmentId) &&
      /^[0-9a-fA-F]{24}$/.test(shipmentId);

    const query = isValidObjectId
      ? { $or: [{ shipmentHash: shipmentId }, { _id: shipmentId }] }
      : { shipmentHash: shipmentId };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      console.log("canSetAtWarehouse: Shipment not found for ID:", shipmentId);
      return false;
    }

    // Find all containers for this shipment
    const containers = await Container.find({
      shipmentHash: shipment.shipmentHash,
    });

    console.log("canSetAtWarehouse check:", {
      shipmentHash: shipment.shipmentHash,
      shipmentCurrentStatus: shipment.status,
      totalContainers: containers.length,
      containerStatuses: containers.map((c) => ({
        id: c.containerId,
        status: c.status,
      })),
      uniqueStatuses: [...new Set(containers.map((c) => c.status))],
    });

    if (containers.length === 0) {
      console.log("canSetAtWarehouse: No containers found for shipment");
      return false;
    }

    // Check each container status
    const statusCheck = containers.map((c) => {
      const isValid = c.status === "AT_WAREHOUSE" || c.status === "DELIVERED";
      return { id: c.containerId, status: c.status, isValid };
    });

    console.log("Container status validation for AT_WAREHOUSE:", statusCheck);

    // All must be AT_WAREHOUSE or DELIVERED
    const allAtWarehouse = containers.every(
      (c) => c.status === "AT_WAREHOUSE" || c.status === "DELIVERED",
    );
    console.log("canSetAtWarehouse result:", allAtWarehouse);

    return allAtWarehouse;
  } catch (error) {
    console.error("Error in canSetAtWarehouse:", error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/shipments/track/:batchId
 *
 * PUBLIC ENDPOINT - No authentication required
 * Get full tracking history for a shipment by batch ID
 * Used by public tracking page (QR code scans)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     shipment: { ... },
 *     trackingHistory: [ ... ],
 *     certificates: [ ... ]
 *   }
 * }
 */
router.get("/track/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    // Find shipment by batch ID
    const shipment = await Shipment.findOne({ batchId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found for this batch ID",
      });
    }

    // Get containers for this shipment
    const containers = await Container.find({
      shipmentHash: shipment.shipmentHash,
    });

    // Get scan logs for tracking history
    const scanLogs = await ScanLog.find({
      shipmentHash: shipment.shipmentHash,
      result: "ACCEPTED",
    }).sort({ scannedAt: 1 });

    // Build tracking history from statusHistory and scan logs
    const trackingHistory = [];

    // Add creation event
    trackingHistory.push({
      event: "CREATED",
      title: "Shipment Created",
      description: `Batch ${shipment.batchId} was created by supplier`,
      timestamp: shipment.createdAt,
      actor: shipment.supplierWallet,
      txHash: null,
    });

    // Add locked on blockchain event
    if (shipment.txHash) {
      trackingHistory.push({
        event: "LOCKED",
        title: "Locked on Blockchain",
        description: "Shipment identity recorded immutably on-chain",
        timestamp: shipment.blockchainTimestamp
          ? new Date(shipment.blockchainTimestamp * 1000)
          : shipment.updatedAt,
        actor: shipment.supplierWallet,
        txHash: shipment.txHash,
      });
    }

    // Add events from scan logs
    scanLogs.forEach((scan) => {
      let title = "";
      let description = "";

      switch (scan.action) {
        case "CUSTODY_PICKUP":
          title = "Picked Up by Transporter";
          description = `Container ${scan.containerId || "shipment"} picked up for delivery`;
          break;
        case "CUSTODY_RECEIVE":
          title = "Received at Warehouse";
          description = `Container ${scan.containerId || "shipment"} received at warehouse`;
          break;
        case "CUSTODY_HANDOVER":
          title = "Custody Handover";
          description = `Container ${scan.containerId || "shipment"} handed over`;
          break;
        case "FINAL_DELIVERY":
          title = "Delivered";
          description = `Container ${scan.containerId || "shipment"} delivered to destination`;
          break;
        case "SCAN_VERIFY":
          title = "Verification Scan";
          description = `Container ${scan.containerId || "shipment"} verified`;
          break;
        default:
          title = scan.action?.replace(/_/g, " ") || "Scan Event";
          description = `Scan event for ${scan.containerId || "shipment"}`;
      }

      trackingHistory.push({
        event: scan.action,
        title,
        description,
        timestamp: scan.scannedAt,
        actor: scan.scannedBy?.walletAddress || scan.scannedBy,
        actorRole: scan.scannedBy?.role,
        location: scan.location,
        txHash: scan.txHash || null,
        containerId: scan.containerId,
      });
    });

    // Add events from status history
    if (shipment.statusHistory && shipment.statusHistory.length > 0) {
      shipment.statusHistory.forEach((history) => {
        // Avoid duplicates - check if we already have this event
        const isDuplicate = trackingHistory.some(
          (t) =>
            t.event === history.status &&
            Math.abs(new Date(t.timestamp) - new Date(history.changedAt)) <
              60000, // within 1 minute
        );

        if (!isDuplicate) {
          let title = "";
          let description = "";

          switch (history.status) {
            case "IN_TRANSIT":
              title = "In Transit";
              description = "Shipment is in transit";
              break;
            case "AT_WAREHOUSE":
              title = "At Warehouse";
              description = "Shipment arrived at warehouse";
              break;
            case "READY_FOR_DISPATCH":
              title = "Ready for Dispatch";
              description = "Shipment is ready for dispatch";
              break;
            case "DELIVERED":
              title = "Delivered";
              description = "Shipment has been delivered";
              break;
            default:
              title = history.status?.replace(/_/g, " ") || "Status Update";
              description =
                history.notes || `Status changed to ${history.status}`;
          }

          trackingHistory.push({
            event: history.status,
            title,
            description: history.notes || description,
            timestamp: history.changedAt,
            actor: history.changedBy,
            txHash: history.txHash || null,
          });
        }
      });
    }

    // Sort tracking history by timestamp
    trackingHistory.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );

    // Get certificates (supporting documents)
    const certificates = (shipment.supportingDocuments || []).map((doc) => ({
      url: doc.url,
      fileName: doc.fileName || "Certificate",
      fileType: doc.fileType || "image",
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.uploadedAt,
    }));

    res.json({
      success: true,
      data: {
        shipment: {
          shipmentHash: shipment.shipmentHash,
          batchId: shipment.batchId,
          productName: shipment.productName,
          supplierWallet: shipment.supplierWallet,
          numberOfContainers: shipment.numberOfContainers,
          quantityPerContainer: shipment.quantityPerContainer,
          totalQuantity: shipment.totalQuantity,
          status: shipment.status,
          isLocked: !!shipment.txHash,
          txHash: shipment.txHash,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
        },
        containers: containers.map((c) => ({
          containerId: c.containerId,
          status: c.status,
          quantity: c.quantity,
        })),
        trackingHistory,
        certificates,
      },
    });
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tracking data",
    });
  }
});

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
      productName,
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
      productName: productName || null,
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
        productName: shipment.productName,
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
        ],
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
      nextTransporter: shipment.nextTransporter || null,
      assignedRetailer: shipment.assignedRetailer || null,
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
 * GET /api/shipments/warehouse/committed
 *
 * Get all successfully committed shipments at warehouse
 * These are shipments where all containers have been scanned and received
 *
 * Query Parameters:
 * - warehouseWallet: Filter by warehouse wallet address (optional)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: [...committedShipments],
 *   pagination: { page, limit, total, totalPages }
 * }
 */
router.get("/warehouse/committed", async (req, res) => {
  try {
    const { warehouseWallet } = req.query;
    const { page, limit } = parsePagination(req.query);

    // Build query - shipments that are AT_WAREHOUSE with all containers received
    const query = {
      status: "AT_WAREHOUSE",
      warehouseReceivedAt: { $exists: true, $ne: null },
    };

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

    // Get total count for pagination
    const total = await Shipment.countDocuments(query);

    // Fetch committed shipments with their containers
    const shipments = await Shipment.find(query)
      .sort({ warehouseReceivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get container counts for each shipment
    const shipmentsWithCounts = await Promise.all(
      shipments.map(async (shipment) => {
        const containerCount = await Container.countDocuments({
          shipmentHash: shipment.shipmentHash,
          status: "AT_WAREHOUSE",
        });

        return {
          shipmentHash: shipment.shipmentHash,
          supplierWallet: shipment.supplierWallet,
          batchId: shipment.batchId,
          numberOfContainers: shipment.numberOfContainers,
          quantityPerContainer: shipment.quantityPerContainer,
          totalQuantity: shipment.totalQuantity,
          txHash: shipment.txHash,
          blockNumber: shipment.blockNumber,
          status: shipment.status,
          // Warehouse commitment details
          warehouseReceivedAt: shipment.warehouseReceivedAt,
          warehouseCommittedBy: shipment.warehouseCommittedBy,
          containersReceived: containerCount,
          // Assigned stakeholders
          assignedTransporter: shipment.assignedTransporter || null,
          assignedWarehouse: shipment.assignedWarehouse || null,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
          supportingDocuments: shipment.supportingDocuments || [],
        };
      }),
    );

    res.json({
      success: true,
      data: shipmentsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching committed shipments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch committed shipments",
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
        nextTransporter: shipment.nextTransporter || null,
        assignedRetailer: shipment.assignedRetailer || null,
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
 * Fetches shipments from TWO fields:
 * 1. assignedTransporter - Normal shipments going to warehouse
 * 2. nextTransporter - Shipments going from warehouse to retailer
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

    const normalizedWallet = walletAddress.toLowerCase();

    // Build query - shipments assigned via assignedTransporter OR nextTransporter
    // assignedTransporter: destination is warehouse
    // nextTransporter: destination is retailer
    const query = {
      $or: [
        { "assignedTransporter.walletAddress": normalizedWallet },
        { "nextTransporter.walletAddress": normalizedWallet },
      ],
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

    // Transform to response format with destination info
    const data = shipments.map((shipment) => {
      // Determine if this transporter is assigned via nextTransporter
      const isNextTransporter =
        shipment.nextTransporter?.walletAddress === normalizedWallet;

      // Determine destination based on which field the transporter is assigned through
      const destination = isNextTransporter ? "RETAILER" : "WAREHOUSE";

      return {
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
        nextTransporter: shipment.nextTransporter || null,
        assignedRetailer: shipment.assignedRetailer || null,
        // Transporter-specific fields
        isNextTransporter, // true if assigned via nextTransporter field
        destination, // "WAREHOUSE" or "RETAILER"
        destinationDetails: isNextTransporter
          ? shipment.assignedRetailer || null
          : shipment.assignedWarehouse || null,
        createdAt: shipment.createdAt,
        supportingDocuments: shipment.supportingDocuments || [],
      };
    });

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
      nextTransporter: shipment.nextTransporter || null,
      assignedRetailer: shipment.assignedRetailer || null,
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
              "",
            )}`,
          },
          file.mimetype,
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
  },
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
            publicIdInfo.resourceType,
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
router.put("/:shipmentId/status", async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status } = req.body;

    console.log("Update shipment status request:", { shipmentId, status });

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    // Validate status-specific requirements
    if (status === "IN_TRANSIT") {
      const allowed = await canSetInTransit(shipmentId);
      if (!allowed) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "All containers must be scanned before setting shipment IN_TRANSIT",
          });
      }
    } else if (status === "AT_WAREHOUSE") {
      const allowed = await canSetAtWarehouse(shipmentId);
      if (!allowed) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "All containers must be received at warehouse before updating status",
          });
      }
    }

    // Only use _id if it's a valid ObjectId format
    const mongoose = require("mongoose");
    const isValidObjectId =
      mongoose.Types.ObjectId.isValid(shipmentId) &&
      /^[0-9a-fA-F]{24}$/.test(shipmentId);

    const query = isValidObjectId
      ? { $or: [{ shipmentHash: shipmentId }, { _id: shipmentId }] }
      : { shipmentHash: shipmentId };

    // Prepare update data
    const updateData = { status };

    // Set warehouse received timestamp for AT_WAREHOUSE status
    if (status === "AT_WAREHOUSE") {
      updateData.warehouseReceivedAt = new Date();
      // Note: warehouseCommittedBy should be set from authenticated user if available
      // For now, we'll let it be set by the scan controller or keep existing value
    }

    const shipment = await Shipment.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true },
    );

    if (!shipment) {
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    }

    console.log("Shipment status updated:", {
      shipmentHash: shipment.shipmentHash,
      newStatus: status,
    });
    return res.json({ success: true, shipment });
  } catch (err) {
    console.error("Update shipment status error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATUS UPDATE ENDPOINT (for warehouse container scanning workflow)
// ═══════════════════════════════════════════════════════════════════════════

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * PATCH /api/shipments/:shipmentHash/status
 *
 * Update shipment status
 * Called when warehouse confirms all containers have been received
 *
 * Requires: Authentication
 * Allowed Roles: warehouse
 *
 * Body:
 * - status: New status (e.g., 'AT_WAREHOUSE')
 * - notes: Optional notes about the status change
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.patch(
  "/:shipmentHash/status",
  authMiddleware,
  roleMiddleware(["warehouse", "transporter", "retailer"]),
  async (req, res) => {
    try {
      const { shipmentHash } = req.params;
      const { status, notes } = req.body;
      const user = req.user;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "status is required",
        });
      }

      // Validate status
      const validStatuses = [
        "CREATED",
        "READY_FOR_DISPATCH",
        "IN_TRANSIT",
        "AT_WAREHOUSE",
        "DELIVERED",
      ];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
        });
      }

      const shipment = await Shipment.findOne({ shipmentHash });
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found",
        });
      }

      // Verify shipment is locked on blockchain
      if (!shipment.txHash) {
        return res.status(400).json({
          success: false,
          message: "Shipment is not locked on blockchain yet",
        });
      }

      // Validate status transition based on role
      const currentStatus = shipment.status;
      const newStatus = status.toUpperCase();
      const userRole = user.role.toLowerCase();

      // Define valid transitions per role
      const validTransitions = {
        transporter: {
          READY_FOR_DISPATCH: ["IN_TRANSIT"],
        },
        warehouse: {
          IN_TRANSIT: ["AT_WAREHOUSE"],
        },
        retailer: {
          AT_WAREHOUSE: ["DELIVERED"],
        },
      };

      const roleTransitions = validTransitions[userRole] || {};
      const allowedNextStatuses = roleTransitions[currentStatus] || [];

      if (!allowedNextStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition. ${userRole} cannot change status from ${currentStatus} to ${newStatus}`,
          currentStatus,
          requestedStatus: newStatus,
          allowedStatuses: allowedNextStatuses,
        });
      }

      // Update status
      const now = new Date();
      shipment.status = newStatus;
      shipment.updatedAt = now;

      // Add to status history
      if (!shipment.statusHistory) {
        shipment.statusHistory = [];
      }
      shipment.statusHistory.push({
        status: newStatus,
        changedBy: user.walletAddress,
        changedAt: now,
        action: `STATUS_UPDATE_BY_${userRole.toUpperCase()}`,
        notes: notes || null,
      });

      await shipment.save();

      // Also update all containers status
      await Container.updateMany(
        { shipmentHash: shipment.shipmentHash },
        {
          $set: {
            status: newStatus,
            updatedAt: now,
          },
        },
      );

      res.json({
        success: true,
        message: `Shipment status updated to ${newStatus}`,
        data: {
          shipmentHash: shipment.shipmentHash,
          supplierWallet: shipment.supplierWallet,
          batchId: shipment.batchId,
          numberOfContainers: shipment.numberOfContainers,
          previousStatus: currentStatus,
          status: shipment.status,
          txHash: shipment.txHash,
          updatedAt: shipment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating shipment status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update shipment status",
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE ASSIGNMENT ENDPOINTS (for next leg)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/shipments/:shipmentHash/assign-transporter
 *
 * Assign next transporter for the next leg of shipment
 * Can ONLY be called when shipment.status === AT_WAREHOUSE
 *
 * Requires: Authentication
 * Allowed Roles: warehouse
 *
 * Body:
 * - transporterWallet: Wallet address of the next transporter
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.patch(
  "/:shipmentHash/assign-transporter",
  authMiddleware,
  roleMiddleware(["warehouse"]),
  async (req, res) => {
    try {
      const { shipmentHash } = req.params;
      const { transporterWallet } = req.body;
      const user = req.user;

      if (!transporterWallet) {
        return res.status(400).json({
          success: false,
          message: "transporterWallet is required",
        });
      }

      if (!isValidAddress(transporterWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transporter wallet address format",
        });
      }

      const shipment = await Shipment.findOne({ shipmentHash });
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found",
        });
      }

      // CRITICAL: Can only assign when status is AT_WAREHOUSE
      if (shipment.status !== "AT_WAREHOUSE") {
        return res.status(400).json({
          success: false,
          message: `Cannot assign transporter. Shipment must be AT_WAREHOUSE status. Current status: ${shipment.status}`,
        });
      }

      // Verify the assigned warehouse is the one making the request
      if (shipment.assignedWarehouse?.walletAddress !== user.walletAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned warehouse can assign the next transporter",
        });
      }

      // Verify the transporter exists and has correct role
      const transporterUser = await User.findOne({
        walletAddress: transporterWallet.toLowerCase(),
        status: "ACTIVE",
      });

      if (!transporterUser) {
        return res.status(400).json({
          success: false,
          message: "Transporter wallet not found or inactive",
        });
      }

      if (transporterUser.role !== "transporter") {
        return res.status(400).json({
          success: false,
          message: `Invalid assignment: wallet is not a transporter (role: ${transporterUser.role})`,
        });
      }

      // Update shipment with next transporter
      const now = new Date();
      shipment.nextTransporter = {
        walletAddress: transporterUser.walletAddress,
        name: transporterUser.fullName || "",
        organizationName: transporterUser.organizationName || "",
        assignedAt: now,
        assignedBy: user.walletAddress,
      };
      shipment.updatedAt = now;
      shipment.lastUpdatedBy = user.walletAddress;

      await shipment.save();

      res.json({
        success: true,
        message: "Next transporter assigned successfully",
        data: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          nextTransporter: shipment.nextTransporter,
          updatedAt: shipment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error assigning next transporter:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign transporter",
      });
    }
  },
);

/**
 * PATCH /api/shipments/:shipmentHash/assign-retailer
 *
 * Assign retailer for final delivery
 * Can ONLY be called when shipment.status === AT_WAREHOUSE
 *
 * Requires: Authentication
 * Allowed Roles: warehouse
 *
 * Body:
 * - retailerWallet: Wallet address of the retailer
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.patch(
  "/:shipmentHash/assign-retailer",
  authMiddleware,
  roleMiddleware(["warehouse"]),
  async (req, res) => {
    try {
      const { shipmentHash } = req.params;
      const { retailerWallet } = req.body;
      const user = req.user;

      if (!retailerWallet) {
        return res.status(400).json({
          success: false,
          message: "retailerWallet is required",
        });
      }

      if (!isValidAddress(retailerWallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid retailer wallet address format",
        });
      }

      const shipment = await Shipment.findOne({ shipmentHash });
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found",
        });
      }

      // CRITICAL: Can only assign when status is AT_WAREHOUSE
      if (shipment.status !== "AT_WAREHOUSE") {
        return res.status(400).json({
          success: false,
          message: `Cannot assign retailer. Shipment must be AT_WAREHOUSE status. Current status: ${shipment.status}`,
        });
      }

      // Verify the assigned warehouse is the one making the request
      if (shipment.assignedWarehouse?.walletAddress !== user.walletAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned warehouse can assign the retailer",
        });
      }

      // Verify the retailer exists and has correct role
      const retailerUser = await User.findOne({
        walletAddress: retailerWallet.toLowerCase(),
        status: "ACTIVE",
      });

      if (!retailerUser) {
        return res.status(400).json({
          success: false,
          message: "Retailer wallet not found or inactive",
        });
      }

      if (retailerUser.role !== "retailer") {
        return res.status(400).json({
          success: false,
          message: `Invalid assignment: wallet is not a retailer (role: ${retailerUser.role})`,
        });
      }

      // Update shipment with retailer
      const now = new Date();
      shipment.assignedRetailer = {
        walletAddress: retailerUser.walletAddress,
        name: retailerUser.fullName || "",
        organizationName: retailerUser.organizationName || "",
        assignedAt: now,
        assignedBy: user.walletAddress,
      };
      shipment.updatedAt = now;
      shipment.lastUpdatedBy = user.walletAddress;

      await shipment.save();

      res.json({
        success: true,
        message: "Retailer assigned successfully",
        data: {
          shipmentHash: shipment.shipmentHash,
          status: shipment.status,
          assignedRetailer: shipment.assignedRetailer,
          updatedAt: shipment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error assigning retailer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign retailer",
      });
    }
  },
);

/**
 * PATCH /api/shipments/:shipmentHash/ready-for-dispatch
 *
 * Mark shipment ready for dispatch (next leg)
 * Can ONLY be called when:
 * - shipment.status === AT_WAREHOUSE
 * - nextTransporter is assigned
 * - assignedRetailer is assigned
 *
 * This is OFF-CHAIN only - does NOT write to blockchain
 *
 * Requires: Authentication
 * Allowed Roles: warehouse
 *
 * Response:
 * {
 *   success: true,
 *   data: { ...shipmentDetails }
 * }
 */
router.patch(
  "/:shipmentHash/ready-for-dispatch",
  authMiddleware,
  roleMiddleware(["warehouse"]),
  async (req, res) => {
    try {
      const { shipmentHash } = req.params;
      const user = req.user;

      const shipment = await Shipment.findOne({ shipmentHash });
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found",
        });
      }

      // CRITICAL: Can only mark ready when status is AT_WAREHOUSE
      if (shipment.status !== "AT_WAREHOUSE") {
        return res.status(400).json({
          success: false,
          message: `Cannot mark ready for dispatch. Shipment must be AT_WAREHOUSE status. Current status: ${shipment.status}`,
        });
      }

      // Verify the assigned warehouse is the one making the request
      if (shipment.assignedWarehouse?.walletAddress !== user.walletAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned warehouse can mark ready for dispatch",
        });
      }

      // CRITICAL: Next transporter must be assigned
      if (!shipment.nextTransporter?.walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark ready for dispatch. Next transporter must be assigned first.",
        });
      }

      // CRITICAL: Retailer must be assigned
      if (!shipment.assignedRetailer?.walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark ready for dispatch. Retailer must be assigned first.",
        });
      }

      // Update shipment status to READY_FOR_DISPATCH
      const now = new Date();
      const previousStatus = shipment.status;
      
      // Move next transporter to assigned transporter for the next leg
      shipment.assignedTransporter = shipment.nextTransporter;
      shipment.nextTransporter = null;
      
      shipment.status = "READY_FOR_DISPATCH";
      shipment.updatedAt = now;
      shipment.lastUpdatedBy = user.walletAddress;

      // Add to status history
      if (!shipment.statusHistory) {
        shipment.statusHistory = [];
      }
      shipment.statusHistory.push({
        status: "READY_FOR_DISPATCH",
        changedBy: user.walletAddress,
        changedAt: now,
        action: "WAREHOUSE_DISPATCH_READY",
        notes: `Marked ready for dispatch by warehouse. Next transporter: ${shipment.assignedTransporter.walletAddress}`,
      });

      await shipment.save();

      // Reset container statuses to READY_FOR_DISPATCH for the next leg
      await Container.updateMany(
        { shipmentHash: shipment.shipmentHash },
        {
          $set: {
            status: "READY_FOR_DISPATCH",
            updatedAt: now,
          },
        },
      );

      res.json({
        success: true,
        message: "Shipment marked ready for dispatch",
        data: {
          shipmentHash: shipment.shipmentHash,
          previousStatus,
          status: shipment.status,
          assignedTransporter: shipment.assignedTransporter,
          assignedRetailer: shipment.assignedRetailer,
          updatedAt: shipment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error marking ready for dispatch:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark ready for dispatch",
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
