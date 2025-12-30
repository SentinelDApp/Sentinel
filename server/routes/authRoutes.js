const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * AUTHENTICATION ROUTES
 * 
 * SENTINEL LOGIN FLOW:
 * 1. GET /check-role → Determine user status
 * 2. GET /nonce → Get message to sign
 * 3. POST /verify → Verify signature & get JWT
 */

// Step 1: Check wallet status/role
router.get('/check-role', authController.checkRole);

// Step 2: Get nonce for signing
router.get('/nonce', authController.getNonce);

// Step 3: Verify signature and login
router.post('/verify', authController.verifySignature);

// Protected: Get current user data
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
