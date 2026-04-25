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

  // Invoicing
  invoiceNumber: { type: String, unique: true, sparse: true },   // generated on success
  failureReason: String,                                         // if status=failed

  // Receipt
  receipt:   String,
  notes:     { type: mongoose.Schema.Types.Mixed },

  // Dates
  paidAt:    Date,
  expiresAt: Date,   // Is payment se kitni duration milegi

}, { timestamps: true });

PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

// Invoice number generator: GWS/INV/YYYYMM/00042
PaymentSchema.statics.generateInvoiceNumber = async function () {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = await this.countDocuments({ invoiceNumber: { $exists: true }, paidAt: { $gte: monthStart } });
  const seq = String(monthCount + 1).padStart(5, '0');
  return `GWS/INV/${ym}/${seq}`;
};

module.exports = mongoose.model('Payment', PaymentSchema);
