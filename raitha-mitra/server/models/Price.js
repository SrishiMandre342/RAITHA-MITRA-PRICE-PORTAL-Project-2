/**
 * Price Model
 * Stores AGMARKNET / eNAM market price data
 */

const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Other'],
    },
    variety: String,

    // Market info
    market: {
      type: String,
      required: true,
    },
    district: String,
    state: { type: String, default: 'Karnataka' },

    // Prices (per quintal as per AGMARKNET standard)
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true }, // Most common traded price

    // Convenience: price per kg
    minPriceKg: Number,
    maxPriceKg: Number,
    modalPriceKg: Number,

    // Arrival data
    arrivals: Number, // Quantity arrived (tonnes)
    unit: { type: String, default: 'Quintal' },

    // Trend
    previousPrice: Number,
    priceChange: Number,     // absolute change
    priceChangePct: Number,  // % change
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },

    // Date
    priceDate: { type: Date, default: Date.now },

    // Source
    source: {
      type: String,
      enum: ['AGMARKNET', 'eNAM', 'Manual', 'Simulated'],
      default: 'Simulated',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
PriceSchema.index({ cropName: 1, market: 1, priceDate: -1 });
PriceSchema.index({ district: 1, priceDate: -1 });
PriceSchema.index({ cropName: 'text' });

// ─── Pre-save: compute per-kg prices ─────────────────────────────────────────
PriceSchema.pre('save', function (next) {
  this.minPriceKg = parseFloat((this.minPrice / 100).toFixed(2));
  this.maxPriceKg = parseFloat((this.maxPrice / 100).toFixed(2));
  this.modalPriceKg = parseFloat((this.modalPrice / 100).toFixed(2));
  next();
});

module.exports = mongoose.model('Price', PriceSchema);
