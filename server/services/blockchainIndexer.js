/**
 * Blockchain Indexer Service
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sentinel backend acts as a blockchain indexer, transforming immutable 
 * on-chain shipment events into queryable off-chain records for dashboards 
 * and analytics.
 * 
 * KEY PRINCIPLES:
 * - Blockchain is the source of truth
 * - Backend NEVER modifies blockchain data
 * - Backend NEVER writes to blockchain
 * - This service only READS blockchain events and indexes them in MongoDB
 * 
 * EVENT FLOW:
 * 1. Smart contract emits ShipmentLocked event
 * 2. This indexer captures the event
 * 3. Validates uniqueness (prevents duplicate processing)
 * 4. Creates Shipment record in MongoDB
 * 5. Generates Container records with QR codes
 * 6. Updates sync state for safe restarts
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { ethers } = require('ethers');
const Shipment = require('../models/Shipment');
const Container = require('../models/Container');
const SyncState = require('../models/SyncState');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Sync state key for this indexer
const SYNC_STATE_KEY = 'shipment-indexer';

// Default Ganache chain ID
const DEFAULT_CHAIN_ID = 1337;

// Retry configuration for RPC reconnection
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT ABI (ShipmentLocked event only)
// ═══════════════════════════════════════════════════════════════════════════

const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "shipmentHash", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "supplier", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "numberOfContainers", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "quantityPerContainer", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ShipmentLocked",
    "type": "event"
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// INDEXER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BlockchainIndexer {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.config = {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      contractAddress: process.env.CONTRACT_ADDRESS,
      chainId: parseInt(process.env.CHAIN_ID) || DEFAULT_CHAIN_ID,
      startBlock: parseInt(process.env.INDEXER_START_BLOCK) || 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initialize the indexer service
   * Connects to Ethereum RPC and sets up event listeners
   */
  async initialize() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔗 BLOCKCHAIN INDEXER SERVICE');
    console.log('═══════════════════════════════════════════════════════════════');

    // Validate configuration
    if (!this.config.contractAddress) {
      console.error('❌ CONTRACT_ADDRESS not set in environment variables');
      console.log('ℹ️  Set CONTRACT_ADDRESS in .env to enable blockchain indexing');
      return false;
    }

    try {
      // Create JSON-RPC provider
      console.log(`📡 Connecting to RPC: ${this.config.rpcUrl}`);
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Verify connection by getting network info
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to network: Chain ID ${network.chainId}`);

      // Verify chain ID matches expected
      if (Number(network.chainId) !== this.config.chainId) {
        console.warn(`⚠️  Chain ID mismatch! Expected: ${this.config.chainId}, Got: ${network.chainId}`);
      }

      // Create contract instance (read-only, no signer)
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        CONTRACT_ABI,
        this.provider
      );
      console.log(`📄 Contract loaded: ${this.config.contractAddress}`);

      // Reset reconnect counter on successful connection
      this.reconnectAttempts = 0;

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain indexer:', error.message);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT PROCESSING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Process a ShipmentLocked event from the blockchain
   * This is the core indexing logic
   */
  async processShipmentLockedEvent(event) {
    const {
      shipmentHash,
      supplier,
      batchId,
      numberOfContainers,
      quantityPerContainer,
      timestamp
    } = event.args;

    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;

    console.log('─────────────────────────────────────────────────────────────');
    console.log(`📦 Processing ShipmentLocked Event`);
    console.log(`   Hash: ${shipmentHash}`);
    console.log(`   Supplier: ${supplier}`);
    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Containers: ${numberOfContainers}`);
    console.log(`   Qty/Container: ${quantityPerContainer}`);
    console.log(`   Block: ${blockNumber}`);
    console.log(`   Tx: ${txHash}`);
    console.log('─────────────────────────────────────────────────────────────');

    try {
      // Check for duplicate (idempotency)
      const exists = await Shipment.existsByHash(shipmentHash);
      if (exists) {
        console.log(`⚠️  Shipment ${shipmentHash} already exists, skipping...`);
        return { success: true, skipped: true };
      }

      // Calculate derived fields
      const totalQuantity = Number(numberOfContainers) * Number(quantityPerContainer);

      // Create shipment record
      const shipment = new Shipment({
        shipmentHash,
        supplierWallet: supplier.toLowerCase(),
        batchId,
        numberOfContainers: Number(numberOfContainers),
        quantityPerContainer: Number(quantityPerContainer),
        totalQuantity,
        txHash,
        blockNumber,
        blockchainTimestamp: Number(timestamp),
        status: 'READY_FOR_DISPATCH'
      });

      await shipment.save();
      console.log(`✅ Shipment saved: ${shipmentHash}`);

      // Check if containers already exist (additional safety)
      const containersExist = await Container.existsForShipment(shipmentHash);
      if (containersExist) {
        console.log(`⚠️  Containers for ${shipmentHash} already exist, skipping container generation...`);
      } else {
        // Generate containers with QR codes
        const containers = await Container.createForShipment({
          shipmentHash,
          batchId,
          numberOfContainers: Number(numberOfContainers),
          quantityPerContainer: Number(quantityPerContainer)
        });
        console.log(`✅ Created ${containers.length} containers for shipment ${shipmentHash}`);
      }

      return { success: true, skipped: false, shipmentHash };
    } catch (error) {
      console.error(`❌ Error processing event for ${shipmentHash}:`, error.message);
      
      // If duplicate key error, treat as skipped (concurrent processing)
      if (error.code === 11000) {
        console.log(`⚠️  Duplicate key detected, shipment ${shipmentHash} was processed concurrently`);
        return { success: true, skipped: true };
      }
      
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HISTORICAL SYNC
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Sync historical events from a starting block
   * Called on startup to catch up with any missed events
   */
  async syncHistoricalEvents(fromBlock) {
    console.log(`📜 Syncing historical events from block ${fromBlock}...`);

    try {
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`📊 Current block: ${currentBlock}`);

      if (fromBlock > currentBlock) {
        console.log('✅ Already up to date, no historical sync needed');
        return { processed: 0, currentBlock };
      }

      // Query past events
      const filter = this.contract.filters.ShipmentLocked();
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);

      console.log(`📥 Found ${events.length} historical ShipmentLocked events`);

      let processedCount = 0;
      for (const event of events) {
        const result = await this.processShipmentLockedEvent(event);
        if (!result.skipped) {
          processedCount++;
        }
      }

      // Update sync state
      await SyncState.updateSyncedBlock(SYNC_STATE_KEY, currentBlock, processedCount);
      console.log(`✅ Historical sync complete. Processed ${processedCount} new events.`);

      return { processed: processedCount, currentBlock };
    } catch (error) {
      console.error('❌ Error syncing historical events:', error.message);
      await SyncState.setError(SYNC_STATE_KEY, error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REAL-TIME LISTENING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start listening for new ShipmentLocked events in real-time
   */
  async startListening() {
    if (this.isRunning) {
      console.log('⚠️  Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('👂 Starting real-time event listener...');

    try {
      // Set up event listener
      this.contract.on('ShipmentLocked', async (
        shipmentHash,
        supplier,
        batchId,
        numberOfContainers,
        quantityPerContainer,
        timestamp,
        event
      ) => {
        try {
          console.log('🔔 New ShipmentLocked event detected!');
          
          // Reconstruct event object for processing
          const eventData = {
            args: {
              shipmentHash,
              supplier,
              batchId,
              numberOfContainers,
              quantityPerContainer,
              timestamp
            },
            transactionHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber
          };

          await this.processShipmentLockedEvent(eventData);

          // Update sync state with new block
          await SyncState.updateSyncedBlock(SYNC_STATE_KEY, event.log.blockNumber, 1);
        } catch (error) {
          console.error('❌ Error processing real-time event:', error.message);
          await SyncState.setError(SYNC_STATE_KEY, error.message);
        }
      });

      await SyncState.setStatus(SYNC_STATE_KEY, 'SYNCING');
      console.log('✅ Real-time event listener started');
    } catch (error) {
      console.error('❌ Error starting event listener:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  async stopListening() {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️  Stopping event listener...');
    
    try {
      this.contract.removeAllListeners('ShipmentLocked');
      this.isRunning = false;
      await SyncState.setStatus(SYNC_STATE_KEY, 'STOPPED');
      console.log('✅ Event listener stopped');
    } catch (error) {
      console.error('❌ Error stopping listener:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN START METHOD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start the indexer service
   * Initializes connection, syncs historical events, and starts real-time listening
   */
  async start() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        SENTINEL BLOCKCHAIN INDEXER - STARTING                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Initialize connection
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Indexer initialization failed. Blockchain indexing disabled.');
      return false;
    }

    try {
      // Get or create sync state
      const syncState = await SyncState.getOrCreate(SYNC_STATE_KEY, {
        startBlock: this.config.startBlock,
        chainId: this.config.chainId,
        contractAddress: this.config.contractAddress.toLowerCase()
      });

      console.log(`📍 Last synced block: ${syncState.lastSyncedBlock}`);
      console.log(`📊 Total events processed: ${syncState.totalEventsProcessed}`);

      // Sync historical events from last synced block + 1
      const fromBlock = syncState.lastSyncedBlock > 0 
        ? syncState.lastSyncedBlock + 1 
        : this.config.startBlock;

      await this.syncHistoricalEvents(fromBlock);

      // Start real-time listening
      await this.startListening();

      // Set up provider event handlers for disconnection
      this.provider.on('error', async (error) => {
        console.error('❌ Provider error:', error.message);
        await this.handleDisconnect();
      });

      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║        BLOCKCHAIN INDEXER RUNNING                             ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');

      return true;
    } catch (error) {
      console.error('❌ Error starting indexer:', error.message);
      await SyncState.setError(SYNC_STATE_KEY, error.message);
      return false;
    }
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  async handleDisconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      await SyncState.setError(SYNC_STATE_KEY, 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    // Stop current listener
    await this.stopListening();

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));

    // Attempt to restart
    await this.start();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS & HEALTH
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get indexer status
   */
  async getStatus() {
    const syncState = await SyncState.findOne({ key: SYNC_STATE_KEY });
    
    let currentBlock = null;
    try {
      if (this.provider) {
        currentBlock = await this.provider.getBlockNumber();
      }
    } catch {
      // Provider not connected
    }

    return {
      isRunning: this.isRunning,
      connected: this.provider !== null,
      contractAddress: this.config.contractAddress,
      chainId: this.config.chainId,
      currentBlock,
      syncState: syncState ? {
        lastSyncedBlock: syncState.lastSyncedBlock,
        totalEventsProcessed: syncState.totalEventsProcessed,
        status: syncState.status,
        lastSyncAt: syncState.lastSyncAt,
        lastError: syncState.lastError
      } : null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const blockchainIndexer = new BlockchainIndexer();

module.exports = blockchainIndexer;
module.exports.BlockchainIndexer = BlockchainIndexer;
