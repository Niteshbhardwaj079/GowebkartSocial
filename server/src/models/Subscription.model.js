const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Current Plan
  plan:   { type: String, enum: ['free','basic','pro'], default: 'free' },
  status: { type: String, enum: ['active','expired','cancelled','trial','grace'], default: 'active' },

  // Dates
  startDate:  { type: Date, default: Date.now },
  endDate:    Date,               // Kab expire hoga
  trialEnd:   Date,               // Trial end date

  // Billing
  billingCycle: { type: String, enum: ['monthly','yearly'], default: 'monthly' },
  amount:       { type: Number, default: 0 },  // Last paid amount

  // Razorpay
  razorpaySubscriptionId: String,
  razorpayCustomerId:     String,

  // Alerts sent (duplicate avoid karne ke liye)
  alertsSent: {
    days30: { type: Boolean, default: false },
    days15: { type: Boolean, default: false },
    days10: { type: Boolean, default: false },
    days7:  { type: Boolean, default: false },
    days5:  { type: Boolean, default: false },
    days3:  { type: Boolean, default: false },
    days1:  { type: Boolean, default: false },
    expired:{ type: Boolean, default: false },
  },

  // History
  history: [{
    plan:      String,
    amount:    Number,
    startDate: Date,
    endDate:   Date,
    paymentId: String,
    activatedAt: Date,
  }],

}, { timestamps: true });

// Days remaining compute karo
SubscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const diff = this.endDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

SubscriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
