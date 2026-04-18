/**
 * Price Routes
 * GET /api/prices              - All prices (filtered)
 * GET /api/prices/crop/:name   - Prices for a specific crop
 * GET /api/prices/market/:name - Prices for a specific market
 * GET /api/prices/trending     - Trending crops by price movement
 */

const express = require('express');
const router = express.Router();
const Price = require('../models/Price');

// ─── GET ALL PRICES ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { crop, market, district, category, date, limit = 100 } = req.query;

    const query = {};
    if (crop) query.cropName = { $regex: crop, $options: 'i' };
    if (market) query.market = { $regex: market, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };
    if (category) query.category = category;

    // Default: today's prices
    if (date) {
      const d = new Date(date);
      query.priceDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }

    const prices = await Price.find(query)
      .sort({ priceDate: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: prices.length, prices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices.' });
  }
});

// ─── PRICES FOR A SPECIFIC CROP ───────────────────────────────────────────────
router.get('/crop/:name', async (req, res) => {
  try {
    const prices = await Price.find({
      cropName: { $regex: req.params.name, $options: 'i' },
    }).sort({ priceDate: -1 }).limit(50);

    if (!prices.length) {
      return res.status(404).json({ error: `No prices found for ${req.params.name}` });
    }

    // Group by market
    const byMarket = prices.reduce((acc, p) => {
      if (!acc[p.market]) acc[p.market] = [];
      acc[p.market].push(p);
      return acc;
    }, {});

    res.json({
      success: true,
      crop: req.params.name,
      prices,
      byMarket,
      summary: {
        avgModal: Math.round(prices.reduce((a, p) => a + p.modalPrice, 0) / prices.length),
        minOverall: Math.min(...prices.map(p => p.minPrice)),
        maxOverall: Math.max(...prices.map(p => p.maxPrice)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crop prices.' });
  }
});

// ─── TRENDING CROPS ───────────────────────────────────────────────────────────
router.get('/trending', async (req, res) => {
  try {
    // Crops with highest positive price change
    const trending = await Price.aggregate([
      { $match: { trend: 'up' } },
      { $group: {
        _id: '$cropName',
        avgChangePct: { $avg: '$priceChangePct' },
        avgModal: { $avg: '$modalPrice' },
        category: { $first: '$category' },
      }},
      { $sort: { avgChangePct: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, trending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending data.' });
  }
});

// ─── PRICE HISTORY FOR A CROP + MARKET ───────────────────────────────────────
router.get('/history/:crop/:market', async (req, res) => {
  try {
    const prices = await Price.find({
      cropName: { $regex: req.params.crop, $options: 'i' },
      market: { $regex: req.params.market, $options: 'i' },
    }).sort({ priceDate: -1 }).limit(30);

    res.json({ success: true, prices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price history.' });
  }
});

module.exports = router;
