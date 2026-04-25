const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Plan Info
  plan:         { type: String, enum: ['basic','pro'], required: true },
  billingCycle: { type: String, enum: ['monthly','yearly'], default: 'monthly' },
  amount:       { type: Number, required: true },   // INR mein (paise nahi)
  currency:     { type: String, default: 'INR' },

  // Razorpay IDs
  razorpayOrderId:   { type: String, unique: true },
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Status
  status: {
    type: String,
    enum: ['created','paid','failed','refunded'],
    default: 'created'
  },

  // Receipt
  receipt:   String,
  notes:     { type: mongoose.Schema.Types.Mixed },

  // Dates
  paidAt:    Date,
  expiresAt: Date,   // Is payment se kitni duration milegi

}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
