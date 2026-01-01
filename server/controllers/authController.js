const { ethers } = require('ethers');
const User = require('../models/User');
const StakeholderRequest = require('../models/StakeholderRequest');
const generateToken = require('../utils/generateToken');

/**
 * AUTHENTICATION CONTROLLER
 * 
 * SENTINEL WALLET-FIRST IDENTITY MODEL:
 * - No passwords, only wallet signatures
 * - Role is determined by approved User record
 * - JWT issued only after signature verification
 */

/**
 * CHECK ROLE - Step 1 of Login Flow
 * 
 * Determines user's registration/approval status
 * Frontend calls this when wallet connects
 * 
 * @route GET /api/auth/check-role
 * @query wallet - User's wallet address
 */
exports.checkRole = async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    const walletAddress = wallet.toLowerCase();

    // First, check if user is approved (in User collection)
    const user = await User.findOne({ walletAddress });

    if (user) {
      // User exists - check their status
      if (user.status === 'ACTIVE') {
        return res.json({
          success: true,
          status: 'APPROVED',
          role: user.role,
          fullName: user.fullName,
          message: 'User is approved and active'
        });
      } else {
        return res.json({
          success: true,
          status: 'SUSPENDED',
          role: user.role,
          message: 'Account is suspended. Contact administrator.'
        });
      }
    }

    // Check if there's a pending request
    const request = await StakeholderRequest.findOne({ walletAddress });

    if (request) {
      if (request.status === 'PENDING') {
        return res.json({
          success: true,
          status: 'PENDING',
          requestedRole: request.requestedRole,
          message: 'Registration pending admin approval'
        });
      } else if (request.status === 'REJECTED') {
        return res.json({
          success: true,
          status: 'REJECTED',
          message: 'Registration was rejected',
          reason: request.rejectionReason
        });
      }
    }

    // Wallet not found anywhere
    return res.json({
      success: true,
      status: 'NOT_REGISTERED',
      message: 'Wallet not registered. Please sign up.'
    });

  } catch (error) {
    console.error('Check role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking wallet status'
    });
  }
};

/**
 * GET NONCE - Step 2 of Login Flow
 * 
 * Returns a nonce for the user to sign
 * This proves wallet ownership
 * 
 * @route GET /api/auth/nonce
 * @query wallet - User's wallet address
 */
exports.getNonce = async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    const walletAddress = wallet.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Return the nonce for signing
    // Message format that will be signed
    const message = `Sign this message to login to Sentinel Supply Chain.\n\nNonce: ${user.nonce}\nWallet: ${walletAddress}`;

    res.json({
      success: true,
      nonce: user.nonce,
      message: message
    });

  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting nonce'
    });
  }
};

/**
 * VERIFY SIGNATURE - Step 3 of Login Flow
 * 
 * Verifies wallet signature and issues JWT
 * This is the final authentication step
 * 
 * @route POST /api/auth/verify
 * @body wallet - User's wallet address
 * @body signature - Signed message from MetaMask
 */
exports.verifySignature = async (req, res) => {
  try {
    const { wallet, signature } = req.body;

    if (!wallet || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address and signature are required'
      });
    }

    const walletAddress = wallet.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to login to Sentinel Supply Chain.\n\nNonce: ${user.nonce}\nWallet: ${walletAddress}`;

    // Verify the signature using ethers.js
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature. Wallet verification failed.'
      });
    }

    // Signature verified! Generate new nonce for next login (prevent replay attacks)
    await user.regenerateNonce();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user.walletAddress, user.role);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        organizationName: user.organizationName,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Verify signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying signature'
    });
  }
};

/**
 * GET CURRENT USER
 * 
 * Returns current user data from JWT
 * 
 * @route GET /api/auth/me
 * @protected - Requires authMiddleware
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ 
      walletAddress: req.user.walletAddress 
    }).select('-nonce');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        fullName: user.fullName,
        organizationName: user.organizationName,
        status: user.status,
        approvedAt: user.approvedAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};
