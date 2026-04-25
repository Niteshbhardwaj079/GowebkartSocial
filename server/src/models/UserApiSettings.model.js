const mongoose = require('mongoose');

// UserApiSettings = har user ki apni social media API keys
// Ye encrypt hokar store hongi DB mein
const UserApiSettingsSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Facebook & Instagram
  facebook: {
    appId:        { type: String, select: false },
    appSecret:    { type: String, select: false },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

  // Twitter
  twitter: {
    apiKey:       { type: String, select: false },
    apiSecret:    { type: String, select: false },
    bearerToken:  { type: String, select: false },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

  // LinkedIn
  linkedin: {
    clientId:     { type: String, select: false },
    clientSecret: { type: String, select: false },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

  // YouTube / Google
  youtube: {
    clientId:     { type: String, select: false },
    clientSecret: { type: String, select: false },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

}, { timestamps: true });

const UserApiSettings = mongoose.model('UserApiSettings', UserApiSettingsSchema);
module.exports = UserApiSettings;
