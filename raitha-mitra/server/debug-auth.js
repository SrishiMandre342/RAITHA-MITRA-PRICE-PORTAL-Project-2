/**
 * debug-auth.js — Run this to verify auth is working independently of the web server
 *
 * Usage:
 *   cd server
 *   node debug-auth.js
 *
 * This script:
 *   1. Connects to MongoDB
 *   2. Creates a test user directly
 *   3. Fetches it back with .select('+password')
 *   4. Runs bcrypt.compare manually
 *   5. Generates and verifies a JWT token
 *   6. Reports PASS/FAIL for each step
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const MONGO_URI  = process.env.MONGO_URI || 'mongodb://localhost:27017/raitha_mitra';
const JWT_SECRET = process.env.JWT_SECRET || 'raitha_mitra_dev_secret_key_12345';
const TEST_PASS  = 'debugpass123';
const TEST_USER  = `debuguser_${Date.now()}`;

async function run() {
  console.log('\n🧪 RAITHA MITRA — AUTH DEBUG SCRIPT');
  console.log('====================================');

  // ── Step 1: Connect DB ─────────────────────────────────────────────────────
  console.log('\n[1] Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`    ✅ Connected to: ${mongoose.connection.db.databaseName}`);
  } catch (e) {
    console.error(`    ❌ FAILED: ${e.message}`);
    console.error('    → Check MONGO_URI in server/.env');
    process.exit(1);
  }

  const User = require('./models/User');

  // ── Step 2: Create user ────────────────────────────────────────────────────
  console.log(`\n[2] Creating test user: "${TEST_USER}" with password: "${TEST_PASS}"`);
  let createdUser;
  try {
    createdUser = await User.create({
      name: 'Debug User', username: TEST_USER,
      phone: '9876543210', password: TEST_PASS,
      role: 'seller', district: 'Tumkur',
    });
    console.log(`    ✅ User created — _id: ${createdUser._id}`);
    console.log(`    ✅ Password stored as hash: ${createdUser.password}`);
  } catch (e) {
    console.error(`    ❌ FAILED: ${e.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Step 3: Fetch with password ────────────────────────────────────────────
  console.log(`\n[3] Fetching user with .select('+password')...`);
  let fetchedUser;
  try {
    fetchedUser = await User.findOne({ username: TEST_USER }).select('+password');
    if (!fetchedUser) throw new Error('findOne returned null');
    console.log(`    ✅ User found — username: ${fetchedUser.username}`);
    console.log(`    ✅ Hash present: ${!!fetchedUser.password}`);
  } catch (e) {
    console.error(`    ❌ FAILED: ${e.message}`);
    await cleanup(User, TEST_USER);
    process.exit(1);
  }

  // ── Step 4: bcrypt.compare ─────────────────────────────────────────────────
  console.log(`\n[4] Running bcrypt.compare("${TEST_PASS}", hash)...`);
  try {
    const match = await bcrypt.compare(TEST_PASS, fetchedUser.password);
    if (match) {
      console.log(`    ✅ MATCH — bcrypt works correctly`);
    } else {
      console.error(`    ❌ NO MATCH — bcrypt.compare returned false`);
      console.error('    → This means hashing happened twice (double-hash bug)');
      console.error('    → Check: pre-save hook running on User.create() AND User.save()');
    }
  } catch (e) {
    console.error(`    ❌ bcrypt.compare threw: ${e.message}`);
  }

  // ── Step 5: matchPassword method ──────────────────────────────────────────
  console.log(`\n[5] Testing user.matchPassword() method...`);
  const methodMatch = await fetchedUser.matchPassword(TEST_PASS);
  console.log(`    ${methodMatch ? '✅ PASS' : '❌ FAIL'} — matchPassword("${TEST_PASS}") = ${methodMatch}`);

  // ── Step 6: Wrong password should fail ────────────────────────────────────
  console.log(`\n[6] Testing wrong password returns false...`);
  const wrongMatch = await fetchedUser.matchPassword('wrongpassword');
  console.log(`    ${!wrongMatch ? '✅ PASS' : '❌ FAIL'} — matchPassword("wrongpassword") = ${wrongMatch} (should be false)`);

  // ── Step 7: JWT ────────────────────────────────────────────────────────────
  console.log(`\n[7] Generating and verifying JWT...`);
  try {
    const token = fetchedUser.generateToken();
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`    ✅ Token generated and verified — user id: ${decoded.id}`);
  } catch (e) {
    console.error(`    ❌ JWT error: ${e.message}`);
    console.error('    → Check JWT_SECRET in .env matches the value in models/User.js');
  }

  // ── Step 8: Demo users ─────────────────────────────────────────────────────
  console.log(`\n[8] Checking demo users (farmer1, buyer1)...`);
  const farmer = await User.findOne({ username: 'farmer1' }).select('+password');
  const buyer  = await User.findOne({ username: 'buyer1'  }).select('+password');
  if (farmer) {
    const ok = await bcrypt.compare('1234', farmer.password);
    console.log(`    ${ok ? '✅' : '❌'} farmer1 password "1234" → ${ok ? 'MATCH' : 'NO MATCH'}`);
  } else {
    console.log('    ⚠️  farmer1 not found — will be seeded on server start');
  }
  if (buyer) {
    const ok = await bcrypt.compare('1234', buyer.password);
    console.log(`    ${ok ? '✅' : '❌'} buyer1 password "1234" → ${ok ? 'MATCH' : 'NO MATCH'}`);
  } else {
    console.log('    ⚠️  buyer1 not found — will be seeded on server start');
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  await cleanup(User, TEST_USER);
  console.log('\n====================================');
  console.log('🧪 DEBUG COMPLETE\n');
  process.exit(0);
}

async function cleanup(User, username) {
  await User.deleteOne({ username });
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
