const jwt = require('jsonwebtoken');

/**
 * GENERATE JWT TOKEN
 * 
 * Creates a signed JWT containing:
 * - walletAddress: User's unique identifier
 * - role: User's assigned role (supplier, transporter, etc.)
 * 
 * SECURITY:
 * - Token expires based on JWT_EXPIRES_IN env variable
 * - Only issued after wallet signature verification
 * - Role is embedded to prevent additional DB lookups
 */
const generateToken = (walletAddress, role) => {
  return jwt.sign(
    { 
      walletAddress: walletAddress.toLowerCase(),
      role: role.toLowerCase()
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
