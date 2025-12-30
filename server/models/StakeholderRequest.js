const mongoose = require('mongoose');

/**
 * STAKEHOLDER REQUEST MODEL
 * 
 * SENTINEL TRUST MODEL:
 * - This model stores PENDING onboarding requests
 * - Users submit their wallet + documents for admin review
 * - NO automatic approval - admin must verify identity
 * - Once approved, a User record is created separately
 * 
 * WALLET-FIRST IDENTITY:
 * - walletAddress is the PRIMARY identifier (unique, indexed)
 * - One wallet can only have ONE pending/approved request
 * - This prevents duplicate registrations
 */
const stakeholderRequestSchema = new mongoose.Schema({
  // PRIMARY IDENTITY - Wallet Address (UNIQUE)
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true, // Indexed for O(1) lookup
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum wallet address format'
    }
  },

  // Requested role - must match allowed roles
  requestedRole: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['supplier', 'transporter', 'warehouse', 'retailer'],
      message: 'Role must be: supplier, transporter, warehouse, or retailer'
    },
    lowercase: true
  },

  // User's full name for identity verification
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },

  // User's email for notifications (approval/rejection)
  email: {
    type: String,
    required: [true, 'Email is required for notifications'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },

  // Organization/Company name (optional but recommended)
  organizationName: {
    type: String,
    trim: true,
    default: ''
  },

  // Physical address
  address: {
    type: String,
    trim: true,
    default: ''
  },

  // Type of verification document uploaded
  documentType: {
    type: String,
    enum: {
      values: ['org_certificate', 'aadhaar', 'pan', 'passport', 'voter_id'],
      message: 'Invalid document type'
    },
    required: [true, 'Document type is required']
  },

  // Path to uploaded verification document
  verificationDocumentPath: {
    type: String,
    required: [true, 'Verification document is required']
  },

  // Request status - controlled by admin
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    uppercase: true
  },

  // Rejection reason (if rejected)
  rejectionReason: {
    type: String,
    default: null
  },

  // Admin who processed the request
  processedBy: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  processedAt: {
    type: Date,
    default: null
  }
});

// Index for admin dashboard queries (filter by status)
// Note: walletAddress index is already defined in schema with 'index: true'
stakeholderRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('StakeholderRequest', stakeholderRequestSchema);
