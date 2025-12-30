/**
 * ONBOARDING CONTROLLER
 * 
 * Handles stakeholder registration requests.
 * 
 * FLOW:
 * 1. Receive multipart form with wallet, role, name, org, and document
 * 2. Validate all required fields
 * 3. Check for duplicate wallet (pending or approved)
 * 4. Upload document to Cloudinary
 * 5. Store Cloudinary secure_url in StakeholderRequest
 * 6. Return success response
 * 
 * SECURITY:
 * - Documents are stored off-chain in Cloudinary
 * - No local file storage
 * - Wallet uniqueness enforced
 */

const StakeholderRequest = require('../models/StakeholderRequest');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary.config');

// Valid roles for stakeholder registration
const VALID_ROLES = ['supplier', 'transporter', 'warehouse', 'retailer'];

/**
 * Submit a new stakeholder registration request
 * POST /api/onboarding/request
 */
const submitOnboardingRequest = async (req, res) => {
  try {
    const { walletAddress, requestedRole, fullName, organizationName } = req.body;

    // ========== VALIDATION ========== //
    
    // Check required fields
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    if (!requestedRole) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    // Validate role is one of the allowed values
    const normalizedRole = requestedRole.toLowerCase();
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Verification document is required'
      });
    }

    // Normalize wallet address (lowercase for consistency)
    const normalizedWallet = walletAddress.toLowerCase().trim();

    // Validate Ethereum wallet format
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(normalizedWallet)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum wallet address format'
      });
    }

    // ========== DUPLICATE CHECKS ========== //

    // Check if wallet already has a pending/approved request
    const existingRequest = await StakeholderRequest.findOne({
      walletAddress: normalizedWallet
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending registration request'
        });
      }
      if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'This wallet is already registered and approved'
        });
      }
      // If REJECTED, we allow re-registration (handled below)
    }

    // Check if wallet already exists as an approved user
    const existingUser = await User.findOne({ walletAddress: normalizedWallet });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This wallet is already registered in the system'
      });
    }

    // ========== CLOUDINARY UPLOAD ========== //

    console.log('📤 Uploading verification document to Cloudinary...');

    // Upload file buffer to Cloudinary with MIME type for proper resource handling
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      {
        // Use wallet address as part of filename for easy identification
        public_id: `verification_${normalizedWallet}_${Date.now()}`,
        folder: 'sentinel/verification-documents'
      },
      req.file.mimetype // Pass MIME type for proper resource_type handling
    );

    console.log('✅ Document uploaded to Cloudinary:', cloudinaryResult.public_id);

    // Get the secure URL from Cloudinary response
    const verificationDocumentPath = cloudinaryResult.secure_url;

    // ========== SAVE TO DATABASE ========== //

    // Handle re-registration for rejected requests
    if (existingRequest && existingRequest.status === 'REJECTED') {
      console.log('📝 Updating rejected request for resubmission...');
      
      existingRequest.fullName = fullName.trim();
      existingRequest.requestedRole = normalizedRole;
      existingRequest.organizationName = organizationName?.trim() || '';
      existingRequest.verificationDocumentPath = verificationDocumentPath;
      existingRequest.status = 'PENDING';
      existingRequest.rejectionReason = null;
      existingRequest.processedBy = null;
      existingRequest.processedAt = null;
      existingRequest.createdAt = new Date();

      await existingRequest.save();

      return res.status(201).json({
        success: true,
        message: 'Signup request submitted successfully. Wait for admin approval.'
      });
    }

    // Create new stakeholder request
    const newRequest = new StakeholderRequest({
      walletAddress: normalizedWallet,
      requestedRole: normalizedRole,
      fullName: fullName.trim(),
      organizationName: organizationName?.trim() || '',
      verificationDocumentPath: verificationDocumentPath,
      status: 'PENDING'
    });

    await newRequest.save();

    console.log('✅ Stakeholder request saved:', newRequest._id);

    // ========== SUCCESS RESPONSE ========== //
    res.status(201).json({
      success: true,
      message: 'Signup request submitted successfully. Wait for admin approval.'
    });

  } catch (error) {
    console.error('❌ Onboarding error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already registered'
      });
    }

    // Handle Cloudinary errors
    if (error.http_code) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload verification document. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    });
  }
};

module.exports = {
  submitOnboardingRequest
};
