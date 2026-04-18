/**
 * Auth Middleware — FIXED VERSION
 *
 * FIXES:
 * 1. Better error messages distinguishing expired vs invalid tokens
 * 2. Added console logs so you can see exactly why a token is rejected
 * 3. Fixed: was using process.env.JWT_SECRET — must match the same
 *    fallback string used in generateToken() exactly
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'raitha_mitra_dev_secret_key_12345';

// ─── protect: require valid JWT token ────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('❌ [protect] No token provided in Authorization header');
    return res.status(401).json({ error: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ [protect] Token valid for user id: ${decoded.id}`);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log(`❌ [protect] Token valid but user not found: ${decoded.id}`);
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (!user.isActive) {
      console.log(`❌ [protect] User account is inactive: ${user.username}`);
      return res.status(401).json({ error: 'Account is disabled.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(`❌ [protect] Token error: ${err.name} — ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please login again.' });
  }
};

// ─── authorize: restrict to specific roles ────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    console.log(`❌ [authorize] Role "${req.user.role}" not in [${roles.join(', ')}]`);
    return res.status(403).json({
      error: `Access denied. Requires role: ${roles.join(' or ')}`,
    });
  }
  next();
};

// ─── optionalAuth: attach user if token present, don't block if not ──────────
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {
      // Token invalid or expired — just continue without user
    }
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
