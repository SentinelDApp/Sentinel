/**
 * ONBOARDING ROUTES
 * 
 * Handles stakeholder registration/onboarding endpoints.
 * 
 * POST /api/onboarding/request
 *   - Submit new stakeholder registration request
 *   - Uploads verification document to Cloudinary
 *   - Creates pending request for admin approval
 */

const express = require('express');
const router = express.Router();

// Controller
const { submitOnboardingRequest } = require('../controllers/onboarding.controller');

// Middleware for file upload
const { uploadVerificationDocument, handleUploadErrors } = require('../middleware/upload.middleware');

/**
 * POST /api/onboarding/request
 * 
 * Submit a new stakeholder registration request
 * 
 * Body (multipart/form-data):
 * - walletAddress: string (required) - Ethereum wallet address
 * - requestedRole: string (required) - One of: supplier, transporter, warehouse, retailer
 * - fullName: string (required) - User's full name
 * - organizationName: string (optional) - Organization/company name
 * - verificationDocument: file (required) - PDF, JPG, or PNG (max 5MB)
 * 
 * Response:
 * - 201: Signup request submitted successfully
 * - 400: Validation error or duplicate wallet
 * - 500: Server error
 */
router.post(
  '/request',
  uploadVerificationDocument,  // Handle file upload
  handleUploadErrors,          // Handle upload errors
  submitOnboardingRequest      // Process the request
);

module.exports = router;
