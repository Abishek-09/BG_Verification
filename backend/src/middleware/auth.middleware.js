// =====================================================================
// JWT Authentication & Role-Based Access Control Middleware
// =====================================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bg_verification_jwt_super_secure_secret_key_2026_@!';

/**
 * Generate a signed JWT token with user/role payload
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Middleware: Verify Bearer JWT Token
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Access Denied: Missing or invalid Authorization Bearer token.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Access Denied: Expired or invalid token.',
      error: err.message
    });
  }
}

/**
 * Middleware: Require Admin Role
 */
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Forbidden: Admin access privileges required to perform this action.'
    });
  }
  next();
}

/**
 * Middleware: Require Employee Role
 */
function isEmployee(req, res, next) {
  if (!req.user || req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Forbidden: Employee access privileges required to access this portal.'
    });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateJWT,
  isAdmin,
  isEmployee
};
