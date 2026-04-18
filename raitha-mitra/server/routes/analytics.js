/**
 * Analytics Routes — v2
 *
 * NEW: /api/analytics/profile/:userId
 *   Returns dynamic real stats from DB for profile dashboard:
 *   - totalListings (from Listing collection)
 *   - activeListings
 *   - totalOrders (as seller)
 *   - totalPurchases (as buyer)
 *   - totalRevenue (seller)
 *   - totalSpent (buyer)
 */
const express = require('express');
const router  = express.Router();
const Listing = require('../models/Listing');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

// ─── Platform-wide dashboard ──────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [totalListings, activeListings, totalOrders, topDistricts, topCrops, recentListings] =
      await Promise.all([
        Listing.countDocuments(),
        Listing.countDocuments({ status: 'active' }),
        Order.countDocuments({ status: { $in: ['confirmed', 'delivered'] } }),
        Listing.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$district', count: { $sum: 1 } } },
          { $sort: { count: -1 } }, { $limit: 5 },
        ]),
        Listing.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$cropName', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
          { $sort: { count: -1 } }, { $limit: 10 },
        ]),
        Listing.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5)
          .select('cropName price district createdAt'),
      ]);

    res.json({ success: true, stats: { totalListings, activeListings, totalOrders }, topDistricts, topCrops, recentListings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ─── Per-user profile stats (CRITICAL FIX for always-zero bug) ───────────────
router.get('/profile/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [
      totalListings,
      activeListings,
      sellerOrders,
      buyerOrders,
    ] = await Promise.all([
      // All listings ever created by this seller
      Listing.countDocuments({ seller: userId }),
      // Currently active listings
      Listing.countDocuments({ seller: userId, status: 'active' }),
      // Orders where this user is the seller
      Order.aggregate([
        { $match: { seller: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $in: ['confirmed', 'delivered'] } } },
        { $group: {
          _id: null,
          count:        { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalKgSold:  { $sum: '$quantity' },
        }},
      ]),
      // Orders where this user is the buyer
      Order.aggregate([
        { $match: { buyer: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $in: ['confirmed', 'delivered', 'pending'] } } },
        { $group: {
          _id:        null,
          count:      { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        }},
      ]),
    ]);

    const sellerStats = sellerOrders[0] || { count: 0, totalRevenue: 0, totalKgSold: 0 };
    const buyerStats  = buyerOrders[0]  || { count: 0, totalSpent: 0 };

    res.json({
      success: true,
      stats: {
        totalListings,
        activeListings,
        totalSalesOrders: sellerStats.count,
        totalRevenue:     Math.round(sellerStats.totalRevenue),
        totalKgSold:      sellerStats.totalKgSold,
        totalPurchases:   buyerStats.count,
        totalSpent:       Math.round(buyerStats.totalSpent),
      },
    });
  } catch (err) {
    console.error('❌ Profile stats error:', err);
    res.status(500).json({ error: 'Failed to fetch profile stats.' });
  }
});

// ─── Top crops ────────────────────────────────────────────────────────────────
router.get('/top-crops', async (req, res) => {
  try {
    const topCrops = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$cropName', count: { $sum: 1 }, avgPrice: { $avg: '$price' }, category: { $first: '$category' } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json({ success: true, topCrops });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top crops.' });
  }
});

module.exports = router;
