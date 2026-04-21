/**
 * Listings Routes
 * GET    /api/listings          - Get all listings (filtered)
 * POST   /api/listings          - Create listing (seller only)
 * GET    /api/listings/:id      - Get single listing
 * PUT    /api/listings/:id      - Update listing (owner only)
 * DELETE /api/listings/:id      - Delete listing (owner only)
 * GET    /api/listings/my       - Get my listings
 * POST   /api/listings/:id/wish - Toggle wishlist
 */

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const path = require('path');

// ─── GET ALL LISTINGS ─────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      crop, category, district, minPrice, maxPrice,
      search, page = 1, limit = 20, sortBy = 'createdAt',
    } = req.query;

    const query = { status: 'active' };

    if (crop) query.cropName = { $regex: crop, $options: 'i' };
    if (category) query.category = category;
    if (district) query.district = { $regex: district, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = sortBy === 'price_asc' ? { price: 1 } :
                      sortBy === 'price_desc' ? { price: -1 } :
                      { createdAt: -1 };

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('seller', 'name phone rating district profileImage')
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: listings.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      page: Number(page),
      listings,
    });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
});

// ─── MY LISTINGS ──────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your listings.' });
  }
});

// ─── GET SINGLE LISTING ───────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name phone rating district profileImage bio');

    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    // Increment view count
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listing.' });
  }
});

// ─── CREATE LISTING ───────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  handleUploadError(upload.array('images', 5)),
  async (req, res) => {
    try {
      const {
        cropName, category, variety, price, priceUnit,
        quantity, quantityUnit, minimumOrder, district, taluk,
        village, pincode, description, negotiable, tags,
      } = req.body;

      if (!cropName || !price || !quantity || !district) {
        return res.status(400).json({ error: 'Crop name, price, quantity, and district are required.' });
      }

      // Process uploaded images
      const images = req.files
        ? req.files.map((file, idx) => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            isMain: idx === 0,
          }))
        : [];

      const listing = await Listing.create({
        seller: req.user._id,
        sellerName: req.user.name,
        sellerPhone: req.user.phone,
        cropName, category, variety, price: Number(price),
        priceUnit: priceUnit || 'per_kg',
        quantity: Number(quantity),
        quantityUnit: quantityUnit || 'kg',
        minimumOrder: minimumOrder ? Number(minimumOrder) : 10,
        district, taluk, village, pincode,
        description, images,
        negotiable: negotiable !== 'false',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      });

      const populatedListing = await listing.populate('seller', 'name phone rating district');

      // Emit real-time event to all users in the same district
      const io = req.app.get('io');
      io.to(`district:${district}`).emit('new-listing', {
        message: `New ${cropName} listing in ${district}!`,
        listing: populatedListing,
      });
      // Broadcast to all (for home feed updates)
      io.emit('listing-created', populatedListing);

      // Update seller's listing count
      await require('../models/User').findByIdAndUpdate(req.user._id, { $inc: { totalListings: 1 } });

      res.status(201).json({ success: true, listing: populatedListing });
    } catch (err) {
      console.error('Create listing error:', err);
      res.status(500).json({ error: 'Failed to create listing.' });
    }
  }
);

// ─── UPDATE LISTING ───────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this listing.' });
    }

    const allowed = ['price', 'quantity', 'description', 'status', 'negotiable', 'minimumOrder', 'tags'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true });

    const io = req.app.get('io');
    io.emit('listing-updated', updated);

    res.json({ success: true, listing: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

// ─── DELETE LISTING ───────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await Listing.findByIdAndUpdate(req.params.id, { status: 'deleted' });
    req.app.get('io').emit('listing-deleted', { id: req.params.id });

    res.json({ success: true, message: 'Listing removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

module.exports = router;
