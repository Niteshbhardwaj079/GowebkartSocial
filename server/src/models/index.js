const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Company ──
const Company = require('./Company.model');

// ── User ──
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 50 },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['superadmin','admin','user'], default: 'user' },
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  plan:     { type: String, enum: ['free','basic','pro'], default: 'free' },
  usage: {
    postsThisMonth: { type: Number, default: 0 },
    aiUsageToday:   { type: Number, default: 0 },
    lastResetDate:  { type: Date,   default: Date.now }
  },
  avatar:          String,
  timezone:        { type: String, default: 'Asia/Kolkata' },
  language:        { type: String, enum: ['en','hi'], default: 'en' },
  isActive:        { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  resetPasswordToken:  String,
  resetPasswordExpire: Date,
  isDemo: { type: Boolean, default: false },
  // Activity tracking — set on login (exact) and on any authenticated request
  // (throttled to ~5 min/user to avoid DB load).
  lastLoginAt:  { type: Date },
  lastActiveAt: { type: Date },
  // Capability flags. SuperAdmin always implicitly has all true. Admins
  // get the team-management flags; team members (role='user') get the
  // post/inbox/analytics flags.
  permissions: {
    // ── Admin-level (relevant when role==='admin')
    manageUsers:        { type: Boolean, default: true  },  // create/promote/block users
    changePlans:        { type: Boolean, default: true  },  // change user plans
    viewAllPosts:       { type: Boolean, default: true  },  // see all company posts
    deletePosts:        { type: Boolean, default: false },  // delete others' posts
    manageBilling:      { type: Boolean, default: false },  // payment / Razorpay / disconnect social
    viewAuditLog:       { type: Boolean, default: true  },  // see company activity log

    // ── Team-member-level (relevant when role==='user')
    canCreatePost:      { type: Boolean, default: true  },  // create + post-now
    canSchedulePost:    { type: Boolean, default: true  },  // schedule for later
    canManageInbox:     { type: Boolean, default: true  },  // reply to comments/messages
    canViewAnalytics:   { type: Boolean, default: true  },  // see analytics page
    canConnectAccounts: { type: Boolean, default: false },  // connect/disconnect social accounts
  },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
UserSchema.methods.comparePassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};
const User = mongoose.model('User', UserSchema);

// ── SocialAccount ──
const SocialAccountSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  platform: { type: String, enum: ['facebook','instagram','twitter','linkedin','pinterest','youtube'], required: true },
  platformUserId:   String,
  platformUsername: String,
  displayName:      String,
  profilePicture:   String,
  profileUrl:       String,
  accountType: { type: String, enum: ['personal','page','group','business'], default: 'personal' },
  accessToken:  { type: String, select: false },
  refreshToken: { type: String, select: false },
  tokenExpiry:  Date,
  metadata:     { type: mongoose.Schema.Types.Mixed },
  isActive:     { type: Boolean, default: true },
  lastSync:     Date
}, { timestamps: true });
SocialAccountSchema.index({ user: 1, platform: 1, platformUserId: 1 }, { unique: true, sparse: true });
const SocialAccount = mongoose.model('SocialAccount', SocialAccountSchema);

// ── Post ──
const PostSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  content: {
    text:  { type: String, maxlength: 5000 },
    media: [{ url: String, type: { type: String, enum: ['image','video','gif'] }, thumbnail: String, publicId: String }],
    link:  String
  },
  platformContent: {
    facebook:  { text: String },
    instagram: { text: String, type: { type: String, enum: ['post','reel','story'], default: 'post' } },
    twitter:   { text: String },
    linkedin:  { text: String },
    pinterest: { text: String, boardId: String },
    youtube:   { title: String, description: String, tags: [String] }
  },
  platforms: [{
    platform:        String,
    socialAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' },
    status:          { type: String, enum: ['pending','published','failed','scheduled'], default: 'pending' },
    platformPostId:  String,
    publishedAt:     Date,
    error:           String
  }],
  scheduling: {
    scheduledAt:      Date,
    timezone:         { type: String, default: 'Asia/Kolkata' },
    isRecurring:      { type: Boolean, default: false },
    recurringPattern: String
  },
  status: { type: String, enum: ['draft','scheduled','publishing','published','failed','cancelled'], default: 'draft' },
  aiGenerated: { type: Boolean, default: false },
  hashtags:    [String],
  mentions:    [String],
  engagement: { likes: { type: Number, default: 0 }, comments: { type: Number, default: 0 }, shares: { type: Number, default: 0 }, reach: { type: Number, default: 0 }, impressions: { type: Number, default: 0 } },
  labels:   [String],
  campaign: String
}, { timestamps: true });
PostSchema.index({ status: 1, 'scheduling.scheduledAt': 1 });
PostSchema.index({ user: 1, status: 1 });
const Post = mongoose.model('Post', PostSchema);

// ── AdCampaign ──
const AdCampaignSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  name:      { type: String, required: true },
  objective: { type: String, enum: ['ENGAGEMENT','TRAFFIC','LEAD_GENERATION','REACH'], required: true },
  post:          { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  socialAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' },
  metaCampaignId: String, metaAdSetId: String, metaAdId: String, metaAdAccountId: String,
  audience: { ageMin: { type: Number, default: 18 }, ageMax: { type: Number, default: 65 }, gender: { type: String, enum: ['ALL','MALE','FEMALE'], default: 'ALL' }, locations: [{ country: String, city: String }], interests: [String] },
  budget:   { type: { type: String, enum: ['DAILY','LIFETIME'], default: 'DAILY' }, amount: { type: Number, required: true }, currency: { type: String, default: 'INR' } },
  duration: { startDate: { type: Date, required: true }, endDate: Date },
  placements: [{ type: String, enum: ['FACEBOOK_FEED','INSTAGRAM_FEED','INSTAGRAM_REELS','FACEBOOK_STORIES'] }],
  status:    { type: String, enum: ['draft','pending','active','paused','completed','failed'], default: 'draft' },
  analytics: { impressions: { type: Number, default: 0 }, clicks: { type: Number, default: 0 }, ctr: { type: Number, default: 0 }, cpc: { type: Number, default: 0 }, spend: { type: Number, default: 0 }, reach: { type: Number, default: 0 } }
}, { timestamps: true });
const AdCampaign = mongoose.model('AdCampaign', AdCampaignSchema);

module.exports = { User, Company, SocialAccount, Post, AdCampaign };
