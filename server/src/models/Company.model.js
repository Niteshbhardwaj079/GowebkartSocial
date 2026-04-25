const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  logo:        String,
  website:     String,
  phone:       String,
  address:     String,
  city:        String,
  state:       String,
  country:     { type: String, default: 'India' },
  pincode:     String,
  about:       String,
  industry:    String,

  socialLinks: {
    facebook:  String,
    instagram: String,
    twitter:   String,
    linkedin:  String,
    youtube:   String,
    whatsapp:  String,
  },

  branding: {
    primaryColor:   { type: String, default: '#0066cc' },
    secondaryColor: { type: String, default: '#0099ff' },
    tagline:        String,
    bannerImage:    String,
    customDomain:   String,
    favicon:        String,
  },

  planLimits: {
    maxUsers:          { type: Number, default: 3 },
    maxSocialAccounts: { type: Number, default: 5 },
    postsPerMonth:     { type: Number, default: 30 },
    aiCallsPerDay:     { type: Number, default: 999999 },
    adsAccess:         { type: Boolean, default: false }
  },

  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
