const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  // Who did it
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:   String,
    email:  String,
    role:   { type: String, enum: ['superadmin', 'admin', 'user', 'system', 'guest'] },
  },
  // What happened — namespaced like 'user.registered', 'post.published'
  action:      { type: String, required: true },
  category:    { type: String, enum: ['auth', 'user', 'post', 'plan', 'admin', 'payment', 'social', 'system'], required: true },
  description: String,
  // Affected entity
  target: {
    type: { type: String },
    id:   mongoose.Schema.Types.ObjectId,
    name: String,
  },
  // Context — anything extra that's useful for an audit row
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip:        String,
  userAgent: String,
  // Scoping — admins can filter to their company
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  // TTL: each row carries its own expiry, computed at write time from current retention setting
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Auto-delete after expiresAt (TTL index — MongoDB removes docs in background)
ActivityLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Common filter paths
ActivityLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
ActivityLogSchema.index({ company: 1, createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
