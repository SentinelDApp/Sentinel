/**
 * SyncState Model
 * 
 * Tracks blockchain synchronization state for the indexer service.
 * Stores the last processed block number to enable safe restarts
 * without re-processing or missing events.
 * 
 * SYNC STRATEGY:
 * - On startup, read last synced block from this collection
 * - Listen for new events from (lastSyncedBlock + 1)
 * - After processing each block, update the sync state
 * - This ensures exactly-once processing of blockchain events
 */

const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const syncStateSchema = new mongoose.Schema({
  // Unique key for this sync state (e.g., 'shipment-indexer')
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Last successfully processed block number
  lastSyncedBlock: {
    type: Number,
    required: true,
    default: 0
  },

  // Chain ID to ensure we're syncing the correct network
  chainId: {
    type: Number,
    required: true
  },

  // Contract address being indexed
  contractAddress: {
    type: String,
    required: true,
    lowercase: true
  },

  // Total events processed
  totalEventsProcessed: {
    type: Number,
    default: 0
  },

  // Last sync timestamp
  lastSyncAt: {
    type: Date,
    default: Date.now
  },

  // Sync status
  status: {
    type: String,
    enum: ['SYNCING', 'SYNCED', 'ERROR', 'STOPPED'],
    default: 'STOPPED'
  },

  // Last error message (if any)
  lastError: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'sync_states'
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get or create sync state for a given key
 */
syncStateSchema.statics.getOrCreate = async function(key, defaultValues = {}) {
  let state = await this.findOne({ key });
  
  if (!state) {
    state = new this({
      key,
      lastSyncedBlock: defaultValues.startBlock || 0,
      chainId: defaultValues.chainId || 1337,
      contractAddress: defaultValues.contractAddress || '',
      status: 'STOPPED'
    });
    await state.save();
  }
  
  return state;
};

/**
 * Update the last synced block
 */
syncStateSchema.statics.updateSyncedBlock = async function(key, blockNumber, eventsProcessed = 0) {
  return this.findOneAndUpdate(
    { key },
    {
      $set: {
        lastSyncedBlock: blockNumber,
        lastSyncAt: new Date(),
        status: 'SYNCED',
        lastError: null
      },
      $inc: { totalEventsProcessed: eventsProcessed }
    },
    { new: true }
  );
};

/**
 * Set sync status to error
 */
syncStateSchema.statics.setError = async function(key, errorMessage) {
  return this.findOneAndUpdate(
    { key },
    {
      $set: {
        status: 'ERROR',
        lastError: errorMessage,
        lastSyncAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Set sync status
 */
syncStateSchema.statics.setStatus = async function(key, status) {
  return this.findOneAndUpdate(
    { key },
    {
      $set: {
        status,
        lastSyncAt: new Date()
      }
    },
    { new: true }
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const SyncState = mongoose.model('SyncState', syncStateSchema);

module.exports = SyncState;
