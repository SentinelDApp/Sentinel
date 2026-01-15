/**
 * Blockchain Service
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * READ-ONLY BLOCKCHAIN INTERACTION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service provides read-only access to the SentinelShipmentRegistry
 * smart contract for QR code verification and shipment status checks.
 * 
 * KEY PRINCIPLES:
 * - All operations are READ-ONLY (no state changes)
 * - Used for real-time verification during QR scanning
 * - Provides blockchain data to complement indexed database records
 * 
 * FUNCTIONS:
 * - getShipment(shipmentHash): Retrieve full shipment data from chain
 * - shipmentExists(shipmentHash): Check if shipment is on chain
 * - getShipmentStatus(shipmentHash): Get current status enum
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { ethers } = require('ethers');

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT ABI (Read-only functions for verification)
// ═══════════════════════════════════════════════════════════════════════════

const CONTRACT_ABI = [
  // Check if shipment exists
  {
    "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
    "name": "shipmentExists",
    "outputs": [{ "internalType": "bool", "name": "exists", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Check if shipment is locked
  {
    "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
    "name": "isShipmentLocked",
    "outputs": [{ "internalType": "bool", "name": "locked", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Get shipment status
  {
    "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
    "name": "getShipmentStatus",
    "outputs": [{ "internalType": "uint8", "name": "status", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Get full shipment details
  {
    "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
    "name": "getShipment",
    "outputs": [
      { "internalType": "address", "name": "supplier", "type": "address" },
      { "internalType": "string", "name": "batchId", "type": "string" },
      { "internalType": "uint256", "name": "numberOfContainers", "type": "uint256" },
      { "internalType": "uint256", "name": "quantityPerContainer", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint8", "name": "status", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// SHIPMENT STATUS ENUM (Must match smart contract)
// ═══════════════════════════════════════════════════════════════════════════

const SHIPMENT_STATUS = {
  0: 'CREATED',
  1: 'READY_FOR_DISPATCH',
  2: 'IN_TRANSIT',
  3: 'AT_WAREHOUSE',
  4: 'DELIVERED'
};

const STATUS_TO_NUMBER = {
  'CREATED': 0,
  'READY_FOR_DISPATCH': 1,
  'IN_TRANSIT': 2,
  'AT_WAREHOUSE': 3,
  'DELIVERED': 4
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-BASED STATUS TRANSITIONS
// Defines which roles can scan at which status and what the next status is
// 
// BUSINESS FLOW:
// 1. Supplier CREATES shipment → status: CREATED (no scan needed)
// 2. Supplier confirms dispatch → status: READY_FOR_DISPATCH (no scan, UI action)
// 3. Transporter scans to pickup → status: IN_TRANSIT
// 4. Warehouse scans to receive → status: AT_WAREHOUSE
// 5. Transporter delivers to retailer → (transporter scans)
// 6. Retailer scans to confirm → status: DELIVERED
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_TRANSITIONS = {
  'CREATED': {
    // Shipment just created - supplier confirms via UI, not QR scan
    allowedRoles: [],  
    nextStatus: 'READY_FOR_DISPATCH',
    action: 'CONFIRM_DISPATCH',
    description: 'Shipment created, awaiting supplier confirmation'
  },
  'READY_FOR_DISPATCH': {
    // Transporter picks up from supplier
    allowedRoles: ['transporter'],
    nextStatus: 'IN_TRANSIT',
    action: 'PICKUP',
    description: 'Ready for transporter pickup'
  },
  'IN_TRANSIT': {
    // Warehouse receives from transporter
    allowedRoles: ['warehouse'],
    nextStatus: 'AT_WAREHOUSE',
    action: 'WAREHOUSE_RECEIVE',
    description: 'In transit to warehouse'
  },
  'AT_WAREHOUSE': {
    // Retailer receives from transporter (after warehouse processing)
    allowedRoles: ['retailer', 'transporter'],
    nextStatus: 'DELIVERED',
    action: 'DELIVERY',
    description: 'At warehouse, ready for final delivery'
  },
  'DELIVERED': {
    // Final state - anyone can verify but no status change
    allowedRoles: ['retailer', 'admin'],  
    nextStatus: null,
    action: 'VERIFY_ONLY',
    description: 'Delivered - verification only'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKCHAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isInitialized = false;
    this.config = {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      contractAddress: process.env.CONTRACT_ADDRESS
    };
  }

  /**
   * Initialize connection to blockchain
   * Called lazily on first request
   */
  async initialize() {
    if (this.isInitialized) return true;

    // Skip initialization if contract address not configured
    if (!this.config.contractAddress || this.config.contractAddress === '0xYourContractAddressHere') {
      console.warn('⚠️  BlockchainService: CONTRACT_ADDRESS not configured');
      return false;
    }

    try {
      // Create JSON-RPC provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Verify connection
      await this.provider.getNetwork();

      // Create contract instance (read-only, no signer)
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        CONTRACT_ABI,
        this.provider
      );

      this.isInitialized = true;
      console.log('✅ BlockchainService: Connected to', this.config.rpcUrl);
      return true;
    } catch (error) {
      console.error('❌ BlockchainService: Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Check if a shipment exists on the blockchain
   * @param {string} shipmentHash - The unique shipment identifier
   * @returns {Promise<boolean>} True if shipment exists
   */
  async shipmentExists(shipmentHash) {
    if (!await this.initialize()) {
      throw new Error('Blockchain service not available');
    }

    try {
      return await this.contract.shipmentExists(shipmentHash);
    } catch (error) {
      console.error('Blockchain: shipmentExists error:', error.message);
      throw new Error('Failed to verify shipment on blockchain');
    }
  }

  /**
   * Get shipment status from blockchain
   * @param {string} shipmentHash - The unique shipment identifier
   * @returns {Promise<string>} Status string (CREATED, READY_FOR_DISPATCH, etc.)
   */
  async getShipmentStatus(shipmentHash) {
    if (!await this.initialize()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const statusNum = await this.contract.getShipmentStatus(shipmentHash);
      return SHIPMENT_STATUS[Number(statusNum)] || 'UNKNOWN';
    } catch (error) {
      if (error.message.includes('Shipment does not exist')) {
        return null;
      }
      console.error('Blockchain: getShipmentStatus error:', error.message);
      throw new Error('Failed to get shipment status from blockchain');
    }
  }

  /**
   * Get full shipment details from blockchain
   * @param {string} shipmentHash - The unique shipment identifier
   * @returns {Promise<Object>} Shipment data object
   */
  async getShipment(shipmentHash) {
    if (!await this.initialize()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const [supplier, batchId, numberOfContainers, quantityPerContainer, createdAt, status] = 
        await this.contract.getShipment(shipmentHash);

      return {
        shipmentHash,
        supplier: supplier.toLowerCase(),
        batchId,
        numberOfContainers: Number(numberOfContainers),
        quantityPerContainer: Number(quantityPerContainer),
        totalQuantity: Number(numberOfContainers) * Number(quantityPerContainer),
        createdAt: new Date(Number(createdAt) * 1000), // Convert Unix timestamp
        status: SHIPMENT_STATUS[Number(status)] || 'UNKNOWN',
        statusNumber: Number(status),
        isLocked: Number(status) >= STATUS_TO_NUMBER['READY_FOR_DISPATCH']
      };
    } catch (error) {
      if (error.message.includes('Shipment does not exist')) {
        return null;
      }
      console.error('Blockchain: getShipment error:', error.message);
      throw new Error('Failed to get shipment from blockchain');
    }
  }

  /**
   * Validate if a role can perform a scan action on a shipment
   * @param {string} currentStatus - Current shipment status
   * @param {string} scannerRole - Role of the scanner (retailer, transporter, etc.)
   * @returns {Object} Validation result { isValid, reason, nextStatus, action }
   */
  validateStatusTransition(currentStatus, scannerRole) {
    // Normalize null/undefined status to 'CREATED' (default state)
    const normalizedStatus = currentStatus || 'CREATED';
    const transition = ALLOWED_TRANSITIONS[normalizedStatus];
    const normalizedRole = scannerRole.toLowerCase();

    if (!transition) {
      return {
        isValid: false,
        reason: `Invalid shipment status: ${currentStatus}`,
        nextStatus: null,
        action: null,
        code: 'INVALID_STATUS'
      };
    }

    // Admin can always verify (view-only, no status change unless explicitly allowed)
    if (normalizedRole === 'admin') {
      return {
        isValid: true,
        reason: null,
        nextStatus: transition.nextStatus,
        action: 'ADMIN_VERIFY',
        isViewOnly: true
      };
    }

    // Retailer can verify any shipment (to check product authenticity)
    // But can only confirm delivery at AT_WAREHOUSE status
    if (normalizedRole === 'retailer') {
      if (normalizedStatus === 'AT_WAREHOUSE') {
        return {
          isValid: true,
          reason: null,
          nextStatus: 'DELIVERED',
          action: 'CONFIRM_DELIVERY',
          description: 'Confirm delivery received'
        };
      }
      if (normalizedStatus === 'DELIVERED') {
        return {
          isValid: true,
          reason: null,
          nextStatus: null,
          action: 'VERIFY_DELIVERED',
          isViewOnly: true,
          description: 'Product already delivered - verification only'
        };
      }
      // Retailer can still verify other statuses (view-only)
      return {
        isValid: true,
        reason: null,
        nextStatus: null,
        action: 'VERIFY_ONLY',
        isViewOnly: true,
        description: `Shipment is ${normalizedStatus}. You can verify but not change status.`,
        currentStatus: normalizedStatus,
        expectedStatus: 'AT_WAREHOUSE'
      };
    }

    // Warehouse can verify shipments and receive IN_TRANSIT
    if (normalizedRole === 'warehouse') {
      if (normalizedStatus === 'IN_TRANSIT') {
        return {
          isValid: true,
          reason: null,
          nextStatus: 'AT_WAREHOUSE',
          action: 'RECEIVE_SHIPMENT',
          description: 'Confirm shipment received at warehouse'
        };
      }
      // Warehouse can verify other statuses
      return {
        isValid: true,
        reason: null,
        nextStatus: null,
        action: 'VERIFY_ONLY',
        isViewOnly: true,
        description: `Shipment is ${normalizedStatus}. Waiting for IN_TRANSIT status to receive.`
      };
    }

    // Transporter handles pickup and delivery
    if (normalizedRole === 'transporter') {
      if (normalizedStatus === 'READY_FOR_DISPATCH') {
        return {
          isValid: true,
          reason: null,
          nextStatus: 'IN_TRANSIT',
          action: 'PICKUP',
          description: 'Pickup shipment from supplier'
        };
      }
      if (normalizedStatus === 'AT_WAREHOUSE') {
        return {
          isValid: true,
          reason: null,
          nextStatus: 'DELIVERED',
          action: 'DELIVER_TO_RETAILER',
          description: 'Deliver to retailer'
        };
      }
      // Transporter can verify other statuses
      return {
        isValid: true,
        reason: null,
        nextStatus: null,
        action: 'VERIFY_ONLY',
        isViewOnly: true,
        description: `Shipment is ${normalizedStatus}. Cannot perform action at this status.`
      };
    }

    // Default: not authorized
    return {
      isValid: false,
      reason: `Role '${scannerRole}' is not authorized to scan shipments.`,
      nextStatus: null,
      action: null,
      code: 'UNAUTHORIZED_ROLE'
    };
  }

  /**
   * Get allowed roles for a specific status
   * @param {string} status - Current shipment status
   * @returns {string[]} Array of allowed roles
   */
  getAllowedRoles(status) {
    const normalizedStatus = status || 'CREATED';
    const transition = ALLOWED_TRANSITIONS[normalizedStatus];
    return transition ? transition.allowedRoles : [];
  }

  /**
   * Check if blockchain service is available
   * @returns {Promise<boolean>} True if service is ready
   */
  async isAvailable() {
    if (!this.config.contractAddress || this.config.contractAddress === '0xYourContractAddressHere') {
      return false;
    }
    return await this.initialize();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const blockchainService = new BlockchainService();

module.exports = {
  blockchainService,
  SHIPMENT_STATUS,
  STATUS_TO_NUMBER,
  ALLOWED_TRANSITIONS
};
