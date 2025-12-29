/**
 * ROLE-BASED ACCESS CONTROL MIDDLEWARE
 * 
 * SENTINEL TRUST MODEL:
 * - Enforces role-based access to routes
 * - Must be used AFTER authMiddleware
 * - One wallet = One role = One dashboard
 * 
 * USAGE:
 * router.get('/supplier/orders', authMiddleware, roleMiddleware(['supplier']), handler)
 * router.get('/admin/users', authMiddleware, roleMiddleware(['admin']), handler)
 * 
 * SECURITY:
 * - Prevents horizontal privilege escalation
 * - Role mismatch = Forbidden (403)
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure authMiddleware has run first
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.' 
      });
    }

    // Convert to lowercase for comparison
    const userRole = req.user.role.toLowerCase();
    const roles = allowedRoles.map(role => role.toLowerCase());

    // Check if user's role is in the allowed roles array
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. This route requires: ${allowedRoles.join(' or ')} role.`,
        yourRole: userRole
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
