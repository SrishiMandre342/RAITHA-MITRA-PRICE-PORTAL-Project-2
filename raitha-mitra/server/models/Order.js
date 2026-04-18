/**
 * Order Model — v2
 * Added: inventoryDeducted flag to prevent double-deduction on race conditions
 */
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    seller:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },

    cropName:      String,
    quantity:      { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    quantityUnit:  { type: String, default: 'kg' },
    pricePerUnit:  { type: Number, required: true },
    totalAmount:   { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    payment: {
      method:          { type: String, enum: ['phonepe', 'upi', 'cash', 'bank_transfer'], default: 'cash' },
      status:          { type: String, enum: ['pending', 'paid', 'failed', 'refunded'],   default: 'pending' },
      transactionId:   String,
      paidAt:          Date,
      merchantOrderId: String,
    },

    deliveryAddress: {
      district: String,
      village:  String,
      pincode:  String,
    },

    // Prevents inventory being deducted twice (e.g. double webhook)
    inventoryDeducted: { type: Boolean, default: false },

    notes:        String,
    cancelReason: String,
  },
  { timestamps: true }
);

OrderSchema.index({ buyer: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, createdAt: -1 });
OrderSchema.index({ listing: 1 });

module.exports = mongoose.model('Order', OrderSchema);
