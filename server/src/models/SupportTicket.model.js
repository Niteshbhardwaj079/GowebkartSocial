const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  ticketId:  { type: String, unique: true },  // TKT-001 format
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Ticket Info
  userName:    String,
  userEmail:   String,
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['technical','billing','account','social_media','feature_request','bug','other'],
    default: 'technical'
  },
  priority: {
    type: String,
    enum: ['low','medium','high','urgent'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['open','in_progress','resolved','closed'],
    default: 'open'
  },

  // Screenshots/attachments
  attachments: [{ url: String, name: String }],

  // Admin reply
  adminReply:   String,
  repliedAt:    Date,
  repliedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Admin email bheja?
  adminNotified: { type: Boolean, default: false },

}, { timestamps: true });

// Auto ticket ID generate karo
SupportTicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
