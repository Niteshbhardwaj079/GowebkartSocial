const router       = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const SupportTicket = require('../models/SupportTicket.model');
const chatbotService = require('../services/chatbot/chatbot.service');
const emailService   = require('../services/email/email.service');
const { User }       = require('../models');
const logger         = require('../utils/logger');

// ══════════════════════════════════════════
// CHATBOT
// ══════════════════════════════════════════

// Chat message send karo
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    const response    = chatbotService.getResponse(message);
    const quickReplies = chatbotService.getQuickReplies();

    res.json({
      success: true,
      response,
      quickReplies: response.found ? [] : quickReplies.slice(0, 4),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Quick replies fetch karo
router.get('/chat/quick-replies', protect, async (req, res) => {
  res.json({ success: true, quickReplies: chatbotService.getQuickReplies() });
});

// ══════════════════════════════════════════
// SUPPORT TICKETS
// ══════════════════════════════════════════

// ✅ Create ticket — client problem report kare
router.post('/tickets', protect, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject aur description required hai' });
    }

    const ticket = await SupportTicket.create({
      user:        req.user._id,
      company:     req.user.company?._id,
      userName:    req.user.name,
      userEmail:   req.user.email,
      subject,
      description,
      category:    category || 'technical',
      priority:    priority || 'medium',
    });

    // 1. Client ko confirmation bhejo
    const company = req.user.company;
    await emailService.sendTicketConfirmation(req.user.email, {
      ticketId: ticket.ticketId,
      name:     req.user.name,
      subject,
      company
    });

    // 2. Super admin ko notification bhejo
    const superAdminEmail = await getSuperAdminEmail();
    if (superAdminEmail) {
      await emailService.sendSupportTicketToAdmin({
        ticket: { ...ticket.toObject(), userName: req.user.name, userEmail: req.user.email },
        adminEmail: superAdminEmail,
        company
      });
      ticket.adminNotified = true;
      await ticket.save();
    }

    logger.info(`Support ticket created: ${ticket.ticketId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `✅ Ticket #${ticket.ticketId} submit ho gaya! Email check karein.`,
      ticket: { ticketId: ticket.ticketId, status: ticket.status }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ✅ User ke tickets
router.get('/tickets', protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ✅ Single ticket
router.get('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ✅ ADMIN — All tickets
router.get('/admin/tickets', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SupportTicket.countDocuments(filter);
    res.json({ success: true, tickets, total });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ✅ ADMIN — Reply to ticket
router.put('/admin/tickets/:id/reply', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { reply, status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { adminReply: reply, repliedAt: new Date(), repliedBy: req.user._id, status: status || 'in_progress' },
      { new: true }
    ).populate('user', 'name email');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Client ko reply mail karo
    if (ticket.user?.email) {
      const { baseTemplate } = require('../services/email/email.templates');
      const subject = `✅ Re: [#${ticket.ticketId}] ${ticket.subject}`;
      const html = baseTemplate({
        company: null,
        title: `Reply to your support ticket`,
        preheader: `Aapke ticket #${ticket.ticketId} ka reply aa gaya`,
        body: `
          <div style="font-size:20px;font-weight:800;margin-bottom:8px;">📩 Ticket Reply</div>
          <p>Namaste <strong>${ticket.user.name}</strong>,</p>
          <p>Aapke support ticket <strong>#${ticket.ticketId}</strong> ka reply aa gaya hai:</p>
          <div style="background:#f0f7ff;border-radius:10px;padding:16px;border-left:4px solid #0066cc;margin:16px 0;">
            <p style="font-size:14px;line-height:1.7;">${reply}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="padding:8px;color:#6b7c93;font-weight:600;font-size:13px;">Ticket ID</td><td style="padding:8px;font-weight:700;font-size:13px;">#${ticket.ticketId}</td></tr>
            <tr><td style="padding:8px;color:#6b7c93;font-weight:600;font-size:13px;">Subject</td><td style="padding:8px;font-size:13px;">${ticket.subject}</td></tr>
            <tr><td style="padding:8px;color:#6b7c93;font-weight:600;font-size:13px;">Status</td><td style="padding:8px;font-size:13px;">${status || 'In Progress'}</td></tr>
          </table>
          <div style="text-align:center;margin:20px 0;">
            <a href="${process.env.CLIENT_URL||'#'}/support" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;">📋 Ticket Dekhen</a>
          </div>
        `
      });
      await emailService.sendEmail({ to: ticket.user.email, subject, html });
    }

    res.json({ success: true, message: '✅ Reply sent to client!', ticket });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ✅ ADMIN — Update ticket status
router.put('/admin/tickets/:id/status', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, ticket });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Helper: Super admin ka email lo ──
async function getSuperAdminEmail() {
  try {
    // .env mein set kiya hua email pehle check karo
    if (process.env.SUPPORT_ADMIN_EMAIL) return process.env.SUPPORT_ADMIN_EMAIL;

    // DB se superadmin email lo
    const admin = await User.findOne({ role: 'superadmin' }).select('email');
    return admin?.email || process.env.EMAIL_USER;
  } catch { return process.env.EMAIL_USER; }
}

module.exports = router;
