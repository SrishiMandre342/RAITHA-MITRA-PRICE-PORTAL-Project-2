/**
 * Listing Model
 * Represents a crop listing posted by a seller
 */

const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName: String,   // Denormalized for quick display
    sellerPhone: String,

    // Crop details
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Other'],
      default: 'Vegetables',
    },
    variety: String, // e.g., "Nasik Onion", "Alphonso Mango"

    // Pricing
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceUnit: {
      type: String,
      enum: ['per_kg', 'per_quintal', 'per_piece', 'per_dozen'],
      default: 'per_kg',
    },
    negotiable: { type: Boolean, default: true },

    // Quantity
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    quantityUnit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'pieces'],
      default: 'kg',
    },
    minimumOrder: { type: Number, default: 10 },

    // Location
    district: {
      type: String,
      required: [true, 'District is required'],
    },
    taluk: String,
    village: String,
    state: { type: String, default: 'Karnataka' },
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },

    // Media
    images: [
      {
        url: String,
        filename: String,
        isMain: { type: Boolean, default: false },
      },
    ],

    // Description
    description: {
      type: String,
      maxlength: 500,
    },
    harvestDate: Date,
    availableFrom: Date,
    availableTill: Date,

    // Status
    status: {
      type: String,
      enum: ['active', 'sold', 'expired', 'deleted'],
      default: 'active',
    },

    // Engagement
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },

    // Tags for search
    tags: [String],

    // Delivery options
    delivery: {
      available: { type: Boolean, default: false },
      radius: Number, // km
      charge: Number, // per km or flat
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for performance ──────────────────────────────────────────────────
ListingSchema.index({ district: 1, status: 1 });
ListingSchema.index({ cropName: 'text', description: 'text', tags: 'text' });
ListingSchema.index({ seller: 1 });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', ListingSchema);
