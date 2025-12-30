const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * ADMIN ROUTES
 * 
 * All routes require:
 * 1. Valid JWT (authMiddleware)
 * 2. Admin role (roleMiddleware)
 * 
 * SENTINEL GOVERNANCE:
 * - Only admins can approve/reject requests
 * - Only admins can manage users
 */

// Apply auth + admin role check to all routes
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// ===== REQUEST MANAGEMENT ===== //

// Get all requests (with optional status filter)
router.get('/requests', adminController.getAllRequests);

// Get single request by ID
router.get('/requests/:id', adminController.getRequestById);

// Approve a request (creates User record)
router.post('/approve/:requestId', adminController.approveRequest);

// Reject a request
router.post('/reject/:requestId', adminController.rejectRequest);

// ===== USER MANAGEMENT ===== //

// Get all users
router.get('/users', adminController.getAllUsers);

// Suspend a user
router.put('/users/:walletAddress/suspend', adminController.suspendUser);

// Reactivate a user
router.put('/users/:walletAddress/reactivate', adminController.reactivateUser);

// ===== DASHBOARD ===== //

// Get dashboard stats
router.get('/stats', adminController.getStats);

module.exports = router;
