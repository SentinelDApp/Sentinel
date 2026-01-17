/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL AI - BLOCKCHAIN TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides blockchain interaction tools for the AI chatbot.
 * Connects to local Ganache and queries the SentinelShipmentRegistry contract.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { ethers } = require('ethers');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Ganache local provider
const GANACHE_URL = process.env.GANACHE_URL || 'http://127.0.0.1:7545';

// Contract address (deployed on Ganache)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Load contract ABI
let CONTRACT_ABI;
try {
  const contractArtifact = require(path.join(__dirname, '../../blockchain/build/contracts/SentinelShipmentRegistry.json'));
  CONTRACT_ABI = contractArtifact.abi;
} catch (e) {
  console.log('⚠️ Contract ABI not found, using minimal ABI');
  CONTRACT_ABI = [
    {
      "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
      "name": "shipmentExists",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "string", "name": "shipmentHash", "type": "string" }],
      "name": "getShipment",
      "outputs": [
        { "internalType": "address", "name": "supplier", "type": "address" },
        { "internalType": "string", "name": "batchId", "type": "string" },
        { "internalType": "uint256", "name": "numberOfContainers", "type": "uint256" },
        { "internalType": "uint256", "name": "quantityPerContainer", "type": "uint256" },
        { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
        { "internalType": "enum SentinelShipmentRegistry.ShipmentStatus", "name": "status", "type": "uint8" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKCHAIN CONNECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a provider and contract instance
 */
const getContract = () => {
  const provider = new ethers.JsonRpcProvider(GANACHE_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return { provider, contract };
};

// ═══════════════════════════════════════════════════════════════════════════
// SHIPMENT STATUS TOOL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get shipment status from the blockchain
 * Falls back to MongoDB if not found on blockchain
 * @param {string} shipmentId - The ID of the shipment to query
 * @returns {Promise<string>} - JSON status message
 */
const getShipmentStatus = async (shipmentId) => {
  try {
    const { contract } = getContract();
    
    // Status enum mapping
    const statusMap = {
      0: 'CREATED',
      1: 'PICKED_UP',
      2: 'IN_TRANSIT',
      3: 'AT_WAREHOUSE',
      4: 'OUT_FOR_DELIVERY',
      5: 'DELIVERED',
      6: 'CANCELLED'
    };

    // Try blockchain first
    try {
      const exists = await contract.shipmentExists(shipmentId);
      
      if (exists) {
        // Get shipment details from blockchain
        const shipment = await contract.getShipment(shipmentId);
        const statusCode = Number(shipment.status || shipment[5]);
        const statusText = statusMap[statusCode] || 'UNKNOWN';
        
        return JSON.stringify({
          found: true,
          source: 'blockchain',
          shipmentId: shipmentId,
          status: statusText,
          batchId: shipment.batchId || shipment[1] || 'N/A',
          containers: Number(shipment.numberOfContainers || shipment[2] || 0),
          quantityPerContainer: Number(shipment.quantityPerContainer || shipment[3] || 0),
          supplier: shipment.supplier || shipment[0] || 'N/A',
          createdAt: shipment.createdAt ? new Date(Number(shipment.createdAt || shipment[4]) * 1000).toLocaleString() : 'N/A',
          message: `✅ Shipment ${shipmentId} found on blockchain! Status: **${statusText}**`
        });
      }
    } catch (blockchainError) {
      console.log('Blockchain query failed, checking database...', blockchainError.message);
    }
    
    // Not on blockchain - check MongoDB for pending shipments
    let Shipment;
    try {
      Shipment = require('../models/Shipment');
      
      // Try multiple fields to find the shipment
      const dbShipment = await Shipment.findOne({
        $or: [
          { shipmentHash: shipmentId },
          { shipmentHash: { $regex: shipmentId, $options: 'i' } },
          { batchId: shipmentId },
          { batchId: { $regex: shipmentId, $options: 'i' } }
        ]
      });
      
      if (dbShipment) {
        return JSON.stringify({
          found: true,
          source: 'database',
          shipmentId: dbShipment.shipmentHash,
          batchId: dbShipment.batchId || 'N/A',
          status: dbShipment.status || 'PENDING',
          containers: dbShipment.numberOfContainers || 0,
          quantityPerContainer: dbShipment.quantityPerContainer || 0,
          totalQuantity: dbShipment.totalQuantity || 0,
          origin: dbShipment.origin || 'N/A',
          destination: dbShipment.destination || 'N/A',
          message: `📦 Shipment found! **ID:** ${dbShipment.shipmentHash}\n**Batch:** ${dbShipment.batchId || 'N/A'}\n**Status:** ${dbShipment.status || 'PENDING'}\n**Containers:** ${dbShipment.numberOfContainers || 0}\n**Qty/Container:** ${dbShipment.quantityPerContainer || 0}`
        });
      }
    } catch (dbError) {
      console.log('Database query failed:', dbError.message);
    }
    
    // Not found anywhere
    return JSON.stringify({
      found: false,
      shipmentId: shipmentId,
      message: `❌ No shipment found with ID "${shipmentId}". Please verify the ID is correct.`
    });
    
  } catch (error) {
    console.error('Blockchain tool error:', error);
    return JSON.stringify({
      found: false,
      error: true,
      message: `⚠️ Error querying shipment: ${error.message}`
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITION (For Gemini Function Calling)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tool definition schema for Gemini
 */
const shipmentStatusTool = {
  name: 'get_shipment_status',
  description: 'Get the current status and details of a shipment by its ID. Use this when users ask about tracking a shipment, finding a shipment, or checking shipment status.',
  parameters: {
    type: 'object',
    properties: {
      shipment_id: {
        type: 'string',
        description: 'The unique identifier of the shipment to look up (e.g., "SHIP-001", "101", "ABC123")'
      }
    },
    required: ['shipment_id']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  getShipmentStatus,
  shipmentStatusTool,
  getContract
};
