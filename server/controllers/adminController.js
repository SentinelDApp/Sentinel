const StakeholderRequest = require('../models/StakeholderRequest');
const User = require('../models/User');

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
 * Fetches all stakeholder requests for admin dashboard
 * Supports filtering by status
 * 
 * @route GET /api/admin/requests
 * @query status - Filter by: PENDING, APPROVED, REJECTED, or all
 * @protected - Requires admin role
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    const requests = await StakeholderRequest.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: requests.length,
      requests
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
      organizationName: request.organizationName || '',
      stakeholderRequestId: request._id,
      approvedAt: new Date(),
      approvedBy: adminWallet
    });

    await newUser.save();

    // Update request status to APPROVED
    request.status = 'APPROVED';
    request.processedBy = adminWallet;
    request.processedAt = new Date();
    await request.save();

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
 * Marks a request as REJECTED with optional reason
 * User can re-apply with a new request
 * 
 * @route POST /api/admin/reject/:requestId
 * @body reason - Optional rejection reason
 * @protected - Requires admin role
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
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
        message: `Cannot reject. Request is already ${request.status}`
      });
    }

    // Update request status to REJECTED
    request.status = 'REJECTED';
    request.rejectionReason = reason || 'No reason provided';
    request.processedBy = adminWallet;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Request rejected',
      request: {
        walletAddress: request.walletAddress,
        status: request.status,
        rejectionReason: request.rejectionReason
      }
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
 * 
 * @route GET /api/admin/stats
 * @protected - Requires admin role
 */
exports.getStats = async (req, res) => {
  try {
    // Request stats
    const totalRequests = await StakeholderRequest.countDocuments();
    const pendingRequests = await StakeholderRequest.countDocuments({ status: 'PENDING' });
    const approvedRequests = await StakeholderRequest.countDocuments({ status: 'APPROVED' });
    const rejectedRequests = await StakeholderRequest.countDocuments({ status: 'REJECTED' });

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

    // Recent requests (last 5)
    const recentRequests = await StakeholderRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('walletAddress fullName requestedRole status createdAt');

    res.json({
      success: true,
      stats: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests
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
