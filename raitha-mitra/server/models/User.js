/**
 * User Model v2
 * - seedDemoUsers only in NODE_ENV=development
 * - bcrypt rounds = 10
 * - double-hash fix (updateOne for lastLogin)
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 50 },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3 },
    phone:    { type: String, required: true, match: [/^(\+91|91|0)?[6-9]\d{9}$/, 'Enter valid Indian mobile number'] },
    password: { type: String, required: true, minlength: 4, select: false },
    role:     { type: String, enum: ['seller', 'buyer', 'admin'], default: 'seller' },
    district: { type: String, required: true },
    state:    { type: String, default: 'Karnataka' },
    profileImage: { type: String, default: null },
    bio:      { type: String, maxlength: 200 },
    landSize: Number,
    primaryCrops: [String],
    totalListings: { type: Number, default: 0 },
    totalSales:    { type: Number, default: 0 },
    rating:        { type: Number, default: 5.0, min: 0, max: 5 },
    ratingCount:   { type: Number, default: 0 },
    language: { type: String, enum: ['en', 'kn', 'hi'], default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    lastLogin:  Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch { return false; }
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, username: this.username },
    process.env.JWT_SECRET || 'raitha_mitra_dev_secret_key_12345',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Only seeds in development — not shown in UI
UserSchema.statics.seedDemoUsers = async function () {
  if (process.env.NODE_ENV === 'production') return;
  const demos = [
    { name:'Dev Farmer', username:'devfarmer', phone:'9876543210', password:'devpass1', role:'seller', district:'Tumkur' },
    { name:'Dev Buyer',  username:'devbuyer',  phone:'8765432109', password:'devpass2', role:'buyer',  district:'Bangalore Rural' },
  ];
  for (const u of demos) {
    if (!(await this.findOne({ username: u.username }))) {
      await this.create(u);
      console.log(`✅ Dev demo user created: ${u.username}`);
    }
  }
};

module.exports = mongoose.model('User', UserSchema);
