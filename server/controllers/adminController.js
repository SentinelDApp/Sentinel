const StakeholderRequest = require('../models/StakeholderRequest');
const User = require('../models/User');
const { deleteFromCloudinary, extractPublicIdFromUrl } = require('../config/cloudinary.config');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

/**
 * ADMIN CONTROLLER
 * 
 * SENTINEL TRUST MODEL - ADMIN GOVERNANCE:
 * - Only admins can approve/reject registration requests
 * - Approval creates a User record (activates the stakeholder)
 * - Rejection blocks access but preserves the request record
 * - No auto-approval - human verification required
 */

/**
 * GET ALL REQUESTS
 * 
 * Fetches stakeholder requests for admin dashboard:
 * - PENDING requests from StakeholderRequests model
 * - APPROVED users from Users model (excluding admins)
 * 
 * @route GET /api/admin/requests
 * @query status - Filter by: PENDING, APPROVED, or all
 * @protected - Requires admin role
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const normalizedStatus = status?.toUpperCase();
    
    let results = [];

    // Fetch PENDING requests from StakeholderRequests
    if (!status || status === 'all' || normalizedStatus === 'PENDING') {
      const pendingRequests = await StakeholderRequest.find({ status: 'PENDING' })
        .sort({ createdAt: -1 })
        .select('-__v');
      
      // Map to consistent format
      const formattedPending = pendingRequests.map(req => ({
        _id: req._id,
        walletAddress: req.walletAddress,
        requestedRole: req.requestedRole,
        fullName: req.fullName,
        email: req.email,
        organizationName: req.organizationName,
        address: req.address,
        documentType: req.documentType,
        verificationDocumentPath: req.verificationDocumentPath,
        status: 'PENDING',
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        source: 'stakeholderRequest'
      }));
      
      results = [...results, ...formattedPending];
    }

    // Fetch APPROVED users from Users model (excluding admins)
    if (!status || status === 'all' || normalizedStatus === 'APPROVED') {
      const approvedUsers = await User.find({ 
        role: { $ne: 'admin' },
        status: 'ACTIVE'
      })
        .sort({ approvedAt: -1 })
        .select('-nonce -__v');
      
      // Map to consistent format matching request structure
      const formattedApproved = approvedUsers.map(user => ({
        _id: user._id,
        walletAddress: user.walletAddress,
        requestedRole: user.role,
        fullName: user.fullName,
        email: user.email,
        organizationName: user.organizationName,
        address: user.address,
        status: 'APPROVED',
        createdAt: user.approvedAt || user.createdAt,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy,
        source: 'user'
      }));
      
      results = [...results, ...formattedApproved];
    }

    // Sort combined results by date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: results.length,
      requests: results
    });

  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests'
    });
  }
};

/**
 * GET SINGLE REQUEST
 * 
 * Fetches detailed info for a single request
 * 
 * @route GET /api/admin/requests/:id
 * @protected - Requires admin role
 */
exports.getRequestById = async (req, res) => {
  try {
    const request = await StakeholderRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request'
    });
  }
};

/**
 * APPROVE REQUEST - CRITICAL OPERATION
 * 
 * SENTINEL APPROVAL FLOW:
 * 1. Validate admin authorization (via middleware)
 * 2. Fetch StakeholderRequest by ID
 * 3. Ensure status is PENDING (can't re-approve)
 * 4. Create User record with:
 *    - walletAddress from request
 *    - role = requestedRole
 *    - status = ACTIVE
 * 5. Update StakeholderRequest status to APPROVED
 * 6. Return success response
 * 
 * @route POST /api/admin/approve/:requestId
 * @protected - Requires admin role
 */
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminWallet = req.user.walletAddress;

    // Find the request
    const request = await StakeholderRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Ensure request is PENDING
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Request is already ${request.status}`
      });
    }

    // Check if User already exists (edge case: duplicate approval attempt)
    const existingUser = await User.findOne({ 
      walletAddress: request.walletAddress 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this wallet address'
      });
    }

    // CREATE NEW USER RECORD (This activates the stakeholder)
    const newUser = new User({
      walletAddress: request.walletAddress,
      role: request.requestedRole,
      status: 'ACTIVE',
      fullName: request.fullName,
      email: request.email,
      organizationName: request.organizationName || '',
      address: request.address || '',
      approvedAt: new Date(),
      approvedBy: adminWallet
    });

    await newUser.save();

    // Send approval email notification before deleting the request
    try {
      await sendApprovalEmail({
        to: request.email,
        fullName: request.fullName,
        role: request.requestedRole,
        walletAddress: request.walletAddress
      });
      console.log('📧 Approval email sent to:', request.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send approval email:', emailError);
      // Continue even if email fails - user is still approved
    }

    // Delete the StakeholderRequest since user is now in Users model
    await StakeholderRequest.findByIdAndDelete(requestId);
    console.log('✅ StakeholderRequest removed after approval:', request.walletAddress);

    res.json({
      success: true,
      message: 'Stakeholder approved and activated successfully',
      user: {
        walletAddress: newUser.walletAddress,
        role: newUser.role,
        fullName: newUser.fullName,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this wallet already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error approving request'
    });
  }
};

/**
 * REJECT REQUEST
 * 
 * Marks a request as REJECTED with reason, deletes document from Cloudinary,
 * and removes the StakeholderRequest from database
 * User can re-apply with a new request
 * 
 * @route POST /api/admin/reject/:requestId
 * @body reason - Rejection reason (required)
 * @protected - Requires admin role
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminWallet = req.user.walletAddress;

    // Validate rejection reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the request
    const request = await StakeholderRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Ensure request is PENDING
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Request is already ${request.status}`
      });
    }

    // Delete document from Cloudinary if it's a Cloudinary URL
    if (request.verificationDocumentPath?.includes('cloudinary.com')) {
      try {
        const cloudinaryInfo = extractPublicIdFromUrl(request.verificationDocumentPath);
        if (cloudinaryInfo) {
          console.log('🗑️ Deleting document from Cloudinary:', cloudinaryInfo.publicId);
          await deleteFromCloudinary(cloudinaryInfo.publicId, cloudinaryInfo.resourceType);
          console.log('✅ Document deleted from Cloudinary');
        }
      } catch (cloudinaryError) {
        console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
        // Continue with rejection even if Cloudinary delete fails
      }
    }

    // Store rejection info for logging before deletion
    const rejectionInfo = {
      walletAddress: request.walletAddress,
      fullName: request.fullName,
      email: request.email,
      requestedRole: request.requestedRole,
      rejectionReason: reason.trim(),
      rejectedBy: adminWallet,
      rejectedAt: new Date()
    };

    // Send rejection email notification BEFORE deleting the request
    try {
      await sendRejectionEmail({
        to: request.email,
        fullName: request.fullName,
        role: request.requestedRole,
        reason: reason.trim()
      });
      console.log('📧 Rejection email sent to:', request.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send rejection email:', emailError);
      // Continue even if email fails
    }

    // Delete the StakeholderRequest document from database
    await StakeholderRequest.findByIdAndDelete(requestId);

    console.log('🗑️ StakeholderRequest deleted:', rejectionInfo.walletAddress);

    res.json({
      success: true,
      message: 'Request rejected and removed from system',
      rejection: rejectionInfo
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request'
    });
  }
};

/**
 * GET DASHBOARD STATS
 * 
 * Returns statistics for admin dashboard
 * - Pending requests from StakeholderRequests
 * - Approved count from Users model (non-admin)
 * 
 * @route GET /api/admin/stats
 * @protected - Requires admin role
 */
exports.getStats = async (req, res) => {
  try {
    // Pending requests from StakeholderRequests (only pending are stored here now)
    const pendingRequests = await StakeholderRequest.countDocuments({ status: 'PENDING' });
    
    // Approved users from Users model (excluding admins)
    const approvedUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    
    // Total = pending + approved (rejected are removed from system)
    const totalRequests = pendingRequests + approvedUsers;

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const suspendedUsers = await User.countDocuments({ status: 'SUSPENDED' });

    // Users by role
    const usersByRole = await User.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity: combine pending requests and recent approvals
    const recentPending = await StakeholderRequest.find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('walletAddress fullName requestedRole status createdAt');
    
    const recentApproved = await User.find({ role: { $ne: 'admin' } })
      .sort({ approvedAt: -1 })
      .limit(5)
      .select('walletAddress fullName role approvedAt');
    
    // Format recent approved to match request structure
    const formattedApproved = recentApproved.map(user => ({
      walletAddress: user.walletAddress,
      fullName: user.fullName,
      requestedRole: user.role,
      status: 'APPROVED',
      createdAt: user.approvedAt
    }));
    
    // Combine and sort by date
    const recentRequests = [...recentPending.map(r => r.toObject()), ...formattedApproved]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedUsers,
          rejected: 0 // Rejected requests are deleted from system
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          byRole: usersByRole
        },
        recentRequests
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};

/**
 * SUSPEND USER
 * 
 * Suspends an active user (blocks access)
 * 
 * @route PUT /api/admin/users/:walletAddress/suspend
 * @protected - Requires admin role
 */
exports.suspendUser = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent suspending other admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin users'
      });
    }

    user.status = 'SUSPENDED';
    await user.save();

    res.json({
      success: true,
      message: 'User suspended successfully',
      user: {
        walletAddress: user.walletAddress,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending user'
    });
  }
};

/**
 * REACTIVATE USER
 * 
 * Reactivates a suspended user
 * 
 * @route PUT /api/admin/users/:walletAddress/reactivate
 * @protected - Requires admin role
 */
exports.reactivateUser = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'ACTIVE';
    await user.save();

    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: {
        walletAddress: user.walletAddress,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating user'
    });
  }
};

/**
 * GET ALL USERS
 * 
 * Fetches all approved users
 * 
 * @route GET /api/admin/users
 * @protected - Requires admin role
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    const filter = {};
    if (role) filter.role = role.toLowerCase();
    if (status) filter.status = status.toUpperCase();

    const users = await User.find(filter)
      .sort({ approvedAt: -1 })
      .select('-nonce -__v');

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};
