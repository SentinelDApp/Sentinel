/**
 * User Routes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * USER API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides endpoints for fetching users by role.
 * Used by suppliers to assign transporters and warehouses to shipments.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/users
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/users
 * 
 * Fetch users by role for assignment purposes.
 * Requires authentication.
 * 
 * Query Parameters:
 * - role: Filter by role (required) - TRANSPORTER, WAREHOUSE, etc.
 * 
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       walletAddress: "0x...",
 *       fullName: "...",
 *       organizationName: "...",
 *       role: "transporter"
 *     }
 *   ]
 * }
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.query;

    // Role is required for security - don't allow fetching all users
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role query parameter is required. Valid values: TRANSPORTER, WAREHOUSE'
      });
    }

    // Normalize role to lowercase for database query
    const normalizedRole = role.toLowerCase();

    // Only allow fetching certain roles for assignment
    const allowedRoles = ['transporter', 'warehouse', 'retailer'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed values: ${allowedRoles.map(r => r.toUpperCase()).join(', ')}`
      });
    }

    // Fetch active users with the specified role
    const users = await User.find({
      role: normalizedRole,
      status: 'ACTIVE'
    }).select('walletAddress fullName organizationName role').lean();

    res.json({
      success: true,
      data: users.map(user => ({
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        organizationName: user.organizationName || '',
        role: user.role
      }))
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/users/transporters
 * 
 * Convenience endpoint to fetch all active transporters.
 * Requires authentication.
 */
router.get('/transporters', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      role: 'transporter',
      status: 'ACTIVE'
    }).select('walletAddress fullName organizationName').lean();

    res.json({
      success: true,
      data: users.map(user => ({
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        organizationName: user.organizationName || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching transporters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transporters'
    });
  }
});

/**
 * GET /api/users/warehouses
 * 
 * Convenience endpoint to fetch all active warehouses.
 * Requires authentication.
 */
router.get('/warehouses', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      role: 'warehouse',
      status: 'ACTIVE'
    }).select('walletAddress fullName organizationName').lean();

    res.json({
      success: true,
      data: users.map(user => ({
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        organizationName: user.organizationName || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses'
    });
  }
});

/**
 * GET /api/users/retailers
 * 
 * Convenience endpoint to fetch all active retailers.
 * Used by warehouses to assign retailers for final delivery.
 * Requires authentication.
 */
router.get('/retailers', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      role: 'retailer',
      status: 'ACTIVE'
    }).select('walletAddress fullName organizationName').lean();

    res.json({
      success: true,
      data: users.map(user => ({
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        organizationName: user.organizationName || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching retailers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retailers'
    });
  }
});

module.exports = router;
