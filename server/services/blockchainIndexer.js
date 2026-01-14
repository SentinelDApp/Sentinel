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
   * 
   * IDEMPOTENCY GUARANTEE:
   * Uses MongoDB's updateOne with $setOnInsert to ensure:
   * - Same event processed twice = no duplicate records
   * - Concurrent processing = safe (atomic upsert)
   * - Crash recovery = safe (can replay from last block)
   * 
   * This is the core indexing logic following the golden rule:
   * "Blockchain is source of truth, MongoDB is derived cache"
   */
  async processShipmentLockedEvent(event, updateBlockState = false) {
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
      // Calculate derived fields
      const totalQuantity = Number(numberOfContainers) * Number(quantityPerContainer);

      // ═══════════════════════════════════════════════════════════════════
      // IDEMPOTENT UPSERT: Uses $setOnInsert to only insert if not exists
      // This is atomic and safe for concurrent/duplicate processing
      // ═══════════════════════════════════════════════════════════════════
      const result = await Shipment.updateOne(
        { shipmentHash }, // Query: find by unique shipmentHash
        {
          $setOnInsert: {
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
          }
        },
        { upsert: true } // Insert if not exists
      );

      // Check if this was a new insert or existing record
      const wasInserted = result.upsertedCount > 0;
      
      if (wasInserted) {
        console.log(`✅ Shipment saved: ${shipmentHash}`);

        // Generate containers only for newly inserted shipments
        // Container.createForShipment should also be idempotent
        const containersExist = await Container.existsForShipment(shipmentHash);
        if (!containersExist) {
          const containers = await Container.createForShipment({
            shipmentHash,
            batchId,
            numberOfContainers: Number(numberOfContainers),
            quantityPerContainer: Number(quantityPerContainer)
          });
          console.log(`✅ Created ${containers.length} containers for shipment ${shipmentHash}`);
        }
      } else {
        console.log(`⚠️  Shipment ${shipmentHash} already exists, skipped (idempotent)`);
      }

      // ═══════════════════════════════════════════════════════════════════
      // UPDATE BLOCK STATE: Track progress per-event for crash recovery
      // This ensures we can resume from the exact block if we crash
      // ═══════════════════════════════════════════════════════════════════
      if (updateBlockState) {
        await SyncState.updateOne(
          { key: SYNC_STATE_KEY },
          {
            $set: {
              lastSyncedBlock: blockNumber,
              lastSyncAt: new Date()
            },
            $inc: { totalEventsProcessed: wasInserted ? 1 : 0 }
          },
          { upsert: true }
        );
      }

      return { success: true, skipped: !wasInserted, shipmentHash, blockNumber };
    } catch (error) {
      console.error(`❌ Error processing event for ${shipmentHash}:`, error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HISTORICAL SYNC
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Sync historical events from a starting block
   * Called on startup to catch up with any missed events
   * 
   * REPLAY-SAFE: Uses idempotent upserts, so replaying events is safe.
   * CRASH-SAFE: Updates block state per-event, not at the end.
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
      let lastBlockNumber = fromBlock;

      // Process each event with per-event block state update
      for (const event of events) {
        // Pass updateBlockState = true to update sync state after each event
        const result = await this.processShipmentLockedEvent(event, true);
        if (!result.skipped) {
          processedCount++;
        }
        lastBlockNumber = event.blockNumber;
      }

      // Final sync state update to mark current block even if no events
      // This handles the case where there are no events in the block range
      await SyncState.updateSyncedBlock(SYNC_STATE_KEY, currentBlock, 0);
      console.log(`✅ Historical sync complete. Processed ${processedCount} new events.`);
      console.log(`📍 Synced up to block ${currentBlock}`);

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
   * 
   * IMPORTANT: Only called AFTER historical sync is complete.
   * Uses the same idempotent processing as historical sync.
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

          // Process with updateBlockState = true for immediate tracking
          await this.processShipmentLockedEvent(eventData, true);
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

  // ═══════════════════════════════════════════════════════════════════════
  // REBUILD FROM CHAIN
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Rebuild MongoDB data entirely from blockchain events
   * 
   * USE CASE: When MongoDB is corrupted, wiped, or you need a fresh start.
   * This method:
   * 1. Clears all shipments and containers from MongoDB
   * 2. Resets sync state to deployment block
   * 3. Replays all ShipmentLocked events from the beginning
   * 
   * SAFETY: Idempotent upserts ensure no duplicates even if interrupted.
   */
  async rebuildFromChain() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        REBUILDING MONGODB FROM BLOCKCHAIN                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('⚠️  This will clear all shipments and containers from MongoDB');
    console.log('⚠️  and rebuild them from blockchain events.');
    console.log('');

    try {
      // Stop real-time listener if running
      await this.stopListening();

      // Clear existing data
      console.log('🗑️  Clearing existing shipments...');
      const deleteShipments = await Shipment.deleteMany({});
      console.log(`   Deleted ${deleteShipments.deletedCount} shipments`);

      console.log('🗑️  Clearing existing containers...');
      const deleteContainers = await Container.deleteMany({});
      console.log(`   Deleted ${deleteContainers.deletedCount} containers`);

      // Reset sync state
      console.log('🔄 Resetting sync state...');
      await SyncState.deleteOne({ key: SYNC_STATE_KEY });

      // Re-initialize if needed
      if (!this.provider || !this.contract) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize blockchain connection');
        }
      }

      // Get or create fresh sync state
      await SyncState.getOrCreate(SYNC_STATE_KEY, {
        startBlock: this.config.startBlock,
        chainId: this.config.chainId,
        contractAddress: this.config.contractAddress.toLowerCase()
      });

      // Replay all events from deployment block
      console.log(`📜 Replaying all events from block ${this.config.startBlock}...`);
      const result = await this.syncHistoricalEvents(this.config.startBlock);

      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log(`║   REBUILD COMPLETE: ${result.processed} shipments indexed               ║`);
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');

      // Restart real-time listener
      await this.startListening();

      return { success: true, processed: result.processed };
    } catch (error) {
      console.error('❌ Rebuild failed:', error.message);
      await SyncState.setError(SYNC_STATE_KEY, `Rebuild failed: ${error.message}`);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const blockchainIndexer = new BlockchainIndexer();

module.exports = blockchainIndexer;
module.exports.BlockchainIndexer = BlockchainIndexer;
