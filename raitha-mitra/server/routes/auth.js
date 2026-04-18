/**
 * Auth Routes — FIXED VERSION
 *
 * ROOT CAUSE FIXES APPLIED:
 * 1. Removed express-validator from login — it was silently failing when
 *    Content-Type wasn't exactly right, blocking the route before it ran
 * 2. Added extensive console.log at every decision point
 * 3. Made username lookup case-insensitive with explicit .toLowerCase()
 * 4. Added req.body debug log so you can see EXACTLY what arrives
 * 5. Added explicit check that password field came through (not undefined)
 * 6. Separated "user not found" vs "wrong password" logs (same 401 to client)
 * 7. Fixed: save({ validateBeforeSave: false }) was re-triggering pre-save
 *    hook and RE-HASHING an already-hashed password on some Mongoose versions
 *    → replaced with findByIdAndUpdate for lastLogin update
 * 8. Added /api/auth/test-register endpoint for quick curl debugging
 */

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── DEBUG MIDDLEWARE: log every incoming auth request ────────────────────────
router.use((req, res, next) => {
  console.log(`\n📨 [AUTH] ${req.method} ${req.originalUrl}`);
  console.log(`   Content-Type: ${req.headers['content-type']}`);
  console.log(`   Body keys:    ${Object.keys(req.body || {}).join(', ') || '(empty)'}`);
  // Log body values but mask the password
  const safeBody = { ...req.body };
  if (safeBody.password) safeBody.password = '***';
  console.log(`   Body values:  ${JSON.stringify(safeBody)}`);
  next();
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, username, phone, password, role, district, language } = req.body;

    // ── Validate required fields manually (more transparent than express-validator)
    const missing = [];
    if (!name)     missing.push('name');
    if (!username) missing.push('username');
    if (!phone)    missing.push('phone');
    if (!password) missing.push('password');
    if (!role)     missing.push('role');
    if (!district) missing.push('district');

    if (missing.length > 0) {
      console.log(`❌ [register] Missing fields: ${missing.join(', ')}`);
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    if (!['seller', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be seller or buyer.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    console.log(`📝 [register] Attempting to create user: "${cleanUsername}"`);

    // Check duplicate username
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      console.log(`❌ [register] Username already taken: "${cleanUsername}"`);
      return res.status(400).json({ error: 'Username already taken. Please choose another.' });
    }

    // Create user — password hashing happens in pre-save hook
    const user = await User.create({
      name:     name.trim(),
      username: cleanUsername,
      phone:    phone.trim(),
      password,              // plain text — pre-save hook will hash it
      role,
      district:  district.trim(),
      language: language || 'en',
    });

    console.log(`✅ [register] User created successfully: "${cleanUsername}" (id: ${user._id})`);

    const token = user.generateToken();

    // Update lastLogin WITHOUT triggering pre-save (use updateOne, not save)
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id:       user._id,
        name:     user.name,
        username: user.username,
        phone:    user.phone,
        role:     user.role,
        district: user.district,
        state:    user.state,
        language: user.language,
      },
    });

  } catch (err) {
    console.error('❌ [register] Unexpected error:', err.message);
    // Surface Mongoose validation errors clearly
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('. ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ── Guard: ensure both fields present ─────────────────────────────────────
    if (!username || !password) {
      console.log(`❌ [login] Missing username or password in request body`);
      return res.status(400).json({
        error: 'Please provide both username and password.',
      });
    }

    const cleanUsername = username.toLowerCase().trim();
    console.log(`🔍 [login] Looking up user: "${cleanUsername}"`);

    // ── Find user — MUST use .select('+password') because password is select:false
    const user = await User.findOne({ username: cleanUsername }).select('+password');

    if (!user) {
      console.log(`❌ [login] No user found with username: "${cleanUsername}"`);
      // Return same generic message to avoid username enumeration
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    console.log(`✅ [login] User found: "${cleanUsername}" (id: ${user._id}, active: ${user.isActive})`);

    if (!user.isActive) {
      console.log(`❌ [login] Account disabled: "${cleanUsername}"`);
      return res.status(403).json({ error: 'Account is disabled. Please contact support.' });
    }

    // ── CRITICAL: password field must exist on user object ────────────────────
    if (!user.password) {
      console.error(`❌ [login] Password hash missing on user document for: "${cleanUsername}"`);
      console.error('   This means the user was created without going through the pre-save hook.');
      return res.status(500).json({ error: 'Account data corrupted. Please re-register.' });
    }

    // ── Compare password ───────────────────────────────────────────────────────
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log(`❌ [login] Password mismatch for: "${cleanUsername}"`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    console.log(`✅ [login] Password matched for: "${cleanUsername}" — issuing token`);

    const token = user.generateToken();

    // Update lastLogin WITHOUT re-triggering pre-save hook
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    return res.json({
      success: true,
      token,
      user: {
        id:           user._id,
        name:         user.name,
        username:     user.username,
        phone:        user.phone,
        role:         user.role,
        district:     user.district,
        state:        user.state,
        language:     user.language,
        profileImage: user.profileImage,
      },
    });

  } catch (err) {
    console.error('❌ [login] Unexpected error:', err.message, err.stack);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — get current logged-in user
// ──────────────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  console.log(`✅ [/me] Authenticated user: ${req.user.username}`);
  res.json({ success: true, user: req.user });
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ──────────────────────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'district', 'bio', 'language',
                     'primaryCrops', 'landSize', 'notificationsEnabled'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ [profile] Update error:', err.message);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/auth/debug-users  — DEV ONLY: list usernames in DB (no passwords)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/debug-users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production.' });
  }
  const users = await User.find({}).select('username role district isActive createdAt');
  res.json({ count: users.length, users });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/test-register — DEV ONLY: quick single-field test
// ──────────────────────────────────────────────────────────────────────────────
router.post('/test-register', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production.' });
  }
  try {
    const ts = Date.now();
    const user = await User.create({
      name: `Test User ${ts}`,
      username: `testuser${ts}`,
      phone: '9876543210',
      password: 'test1234',
      role: 'seller',
      district: 'Tumkur',
    });
    const token = user.generateToken();
    res.json({ success: true, message: 'Test user created', username: user.username, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
