const mongoose = require('mongoose');

// Super admin yahan configure karega — kitne din pehle alert bhejein
const ExpiryAlertSettingsSchema = new mongoose.Schema({
  // Only one document hoga (singleton)
  singleton: { type: Boolean, default: true, unique: true },

  // Kitne din pehle client ko alert bhejein
  clientAlertDays: {
    type: [Number],
    default: [30, 15, 10, 7, 5, 3, 1],  // In sabhi dates par alert
  },

  // Kitne din pehle admin ko alert bhejein
  adminAlertDays: {
    type: [Number],
    default: [15, 7, 3, 1],
  },

  // Grace period — expire hone ke baad kitne din account chalega
  gracePeriodDays: { type: Number, default: 3 },

  // Email alerts on/off
  clientEmailEnabled: { type: Boolean, default: true },
  adminEmailEnabled:  { type: Boolean, default: true },

  // In-app notification
  inAppEnabled: { type: Boolean, default: true },

  // Dashboard banner — kitne din pehle dikhayen
  dashboardBannerDays: { type: Number, default: 10 },

  // Admin emails jo alerts receive karein
  adminEmails: [String],  // Agar empty ho to superadmin ka email use hoga

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ExpiryAlertSettings', ExpiryAlertSettingsSchema);
