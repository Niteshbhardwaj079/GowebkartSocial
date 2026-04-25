const mongoose = require('mongoose');

// Plan = subscription plan jo super admin define karta hai
const PlanSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true }, // 'free', 'basic', 'pro'
  displayName: { type: String, required: true },               // 'Free', 'Basic', 'Pro'
  description: String,
  price: {
    monthly: { type: Number, default: 0 },  // INR mein
    yearly:  { type: Number, default: 0 },
  },
  limits: {
    postsPerMonth:     { type: Number, default: 30 },
    socialAccounts:    { type: Number, default: 3 },
    aiCallsPerDay:     { type: Number, default: 5 },
    teamMembers:       { type: Number, default: 1 },
    adsAccess:         { type: Boolean, default: false },
    bulkUpload:        { type: Boolean, default: false },
    analyticsAdvanced: { type: Boolean, default: false },
    whiteLabel:        { type: Boolean, default: false },
    apiAccess:         { type: Boolean, default: false },
  },
  isActive:  { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);
module.exports = Plan;
