const mongoose = require('mongoose');

/**
 * USER MODEL - APPROVED STAKEHOLDERS ONLY
 * 
 * SENTINEL TRUST MODEL:
 * - This model ONLY contains APPROVED users
 * - Created ONLY when admin approves a StakeholderRequest
 * - NO direct user registration to this model
 * 
 * WALLET-FIRST IDENTITY PRINCIPLE:
 * - walletAddress is the UNIQUE identifier (indexed)
 * - One wallet = One role (NO multiple roles per wallet)
 * - Role lookup is O(1) via indexed walletAddress
 * 
 * ACCESS CONTROL:
 * - status: ACTIVE = can access dashboard
 * - status: SUSPENDED = blocked from access
 * - Only admins can change status
 */
const userSchema = new mongoose.Schema({
  // PRIMARY IDENTITY - Wallet Address (UNIQUE, INDEXED)
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true, // Critical for O(1) role lookups during login
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum wallet address format'
    }
  },

  // Assigned role - set by admin during approval
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['supplier', 'transporter', 'warehouse', 'retailer', 'admin'],
      message: 'Invalid role specified'
    },
    lowercase: true
  },

  // User status - controls access
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
    uppercase: true
  },

  // User's full name (copied from request)
  fullName: {
    type: String,
    required: true,
    trim: true
  },

  // Organization name (copied from request)
  organizationName: {
    type: String,
    default: ''
  },

  // Nonce for wallet signature verification (prevents replay attacks)
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },

  // Reference to original request
  stakeholderRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StakeholderRequest'
  },

  // Approval metadata
  approvedAt: {
    type: Date,
    default: Date.now
  },

  approvedBy: {
    type: String,
    required: true
  },

  // Last login timestamp
  lastLogin: {
    type: Date,
    default: null
  }
});

// Index for role-based queries
// Note: walletAddress index is already defined in schema with 'index: true'
userSchema.index({ role: 1, status: 1 });

/**
 * Method to regenerate nonce after each login
 * This prevents signature replay attacks
 */
userSchema.methods.regenerateNonce = function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
