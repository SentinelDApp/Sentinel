const mongoose = require('mongoose');

const stakeholderSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['MANUFACTURER', 'TRANSPORTER', 'WAREHOUSE', 'RETAILER'],
  },
  documentPath: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvedDate: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Stakeholder', stakeholderSchema);