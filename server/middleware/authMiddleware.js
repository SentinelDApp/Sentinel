const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * SENTINEL TRUST MODEL:
 * - Verifies JWT token from Authorization header
 * - Confirms user exists and is ACTIVE
 * - Attaches user data to request for downstream use
 * 
 * SECURITY:
 * - No token = Unauthorized
 * - Invalid token = Unauthorized
 * - Suspended user = Forbidden
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database to confirm they still exist and are active
    const user = await User.findOne({ 
      walletAddress: decoded.walletAddress.toLowerCase() 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found. Token invalid.' 
      });
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ 
        success: false,
        message: 'Account suspended. Contact administrator.' 
      });
    }

    // Attach user to request object
    req.user = {
      walletAddress: user.walletAddress,
      role: user.role,
      fullName: user.fullName,
      status: user.status
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authentication error.' 
    });
  }
};

module.exports = authMiddleware;
