const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Email notifications on/off
  email: {
    enabled:         { type: Boolean, default: true },
    // Tag/Mention alerts
    onTagged:        { type: Boolean, default: true  },  // Koi tag kare
    onMentioned:     { type: Boolean, default: true  },  // Koi mention kare
    onAbuseDetected: { type: Boolean, default: true  },  // Gali/offensive content
    onNewComment:    { type: Boolean, default: false },  // Har new comment par
    onNewMessage:    { type: Boolean, default: true  },  // New DM par
    onPostPublished: { type: Boolean, default: false },  // Post publish ho jaye
    onPostFailed:    { type: Boolean, default: true  },  // Post fail ho jaye
    onPlanExpiry:    { type: Boolean, default: true  },  // Plan expire hone wala ho
  },

  // In-app notifications
  inApp: {
    enabled:     { type: Boolean, default: true },
    onTagged:    { type: Boolean, default: true },
    onMentioned: { type: Boolean, default: true },
    onAbuse:     { type: Boolean, default: true },
  },

  // Alert email (alag email par bhejna chahein to)
  alertEmail: String,

  // Platforms — kis platform ke alerts chahiye
  platforms: {
    facebook:  { type: Boolean, default: true },
    instagram: { type: Boolean, default: true },
    twitter:   { type: Boolean, default: true },
    linkedin:  { type: Boolean, default: true },
    youtube:   { type: Boolean, default: true },
  }
}, { timestamps: true });

const NotificationSettings = mongoose.model('NotificationSettings', NotificationSettingsSchema);
module.exports = NotificationSettings;
