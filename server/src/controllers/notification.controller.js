const NotificationSettings = require('../models/NotificationSettings.model');
const emailService = require('../services/email/email.service');
const { User } = require('../models');
const logger = require('../utils/logger');

// ✅ GET notification settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user._id });
    if (!settings) {
      // Default settings banao
      settings = await NotificationSettings.create({ user: req.user._id });
    }
    res.json({ success: true, settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ UPDATE notification settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await NotificationSettings.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: '✅ Notification settings save ho gayi!', settings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ TEST email bhejo
exports.testEmail = async (req, res) => {
  try {
    const user = req.user;
    const result = await emailService.sendEmail({
      to: user.email,
      subject: '✅ Test Email — GowebkartSocial',
      html: `<div style="font-family:Arial,sans-serif;padding:20px"><h2>✅ Email kaam kar raha hai!</h2><p>Namaste <strong>${user.name}</strong>, aapki email notifications sahi se configure hain.</p></div>`
    });
    if (result.dev) {
      return res.json({ success: true, message: 'Email configured nahi hai. .env mein EMAIL_USER aur EMAIL_PASS add karein.', dev: true });
    }
    res.json({ success: true, message: `✅ Test email ${user.email} par bheja gaya!` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ TAG/MENTION alert manually trigger (inbox se)
exports.sendTagAlert = async (req, res) => {
  try {
    const { taggedBy, platform, content, accountName, type = 'tag' } = req.body;
    const user = await User.findById(req.user._id);

    const settings = await NotificationSettings.findOne({ user: req.user._id });

    // Check karo notifications enabled hain ya nahi
    if (!settings?.email?.enabled) {
      return res.json({ success: true, message: 'Email notifications disabled hain' });
    }

    const alertEmail = settings.alertEmail || user.email;

    // Content analysis
    const analysis = emailService.analyzeContent(content || '');

    if (analysis.isAbusive && settings.email.onAbuseDetected) {
      await emailService.sendAbuseAlert({ to: alertEmail, userName: user.name, from: taggedBy, platform, content, accountName: accountName || 'Your Account' });
      logger.info(`Abuse alert sent to ${alertEmail}`);
    }

    if ((content?.includes('@') || type === 'tag') && settings.email.onTagged) {
      await emailService.sendTagAlert({ to: alertEmail, userName: user.name, taggedBy, platform, content, accountName: accountName || 'Your Account' });
      logger.info(`Tag alert sent to ${alertEmail}`);
    }

    if (type === 'mention' && settings.email.onMentioned) {
      await emailService.sendMentionAlert({ to: alertEmail, userName: user.name, mentionedBy: taggedBy, platform, content, accountName: accountName || 'Your Account' });
    }

    res.json({ success: true, message: 'Alert email bheja gaya!', isAbusive: analysis.isAbusive });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Inbox service se automatically call hoga yeh ──
exports.processInboxItem = async (userId, item) => {
  try {
    const user     = await User.findById(userId);
    const settings = await NotificationSettings.findOne({ user: userId });
    if (!settings?.email?.enabled || !user) return;

    const alertEmail = settings.alertEmail || user.email;
    const content    = item.message || item.latestMsg || '';
    const from       = item.from?.name || item.from?.username || 'Someone';
    const platform   = item.platform;

    // Platform enabled check
    if (settings.platforms && settings.platforms[platform] === false) return;

    const analysis = emailService.analyzeContent(content);

    // 1. Abuse detected
    if (analysis.isAbusive && settings.email.onAbuseDetected) {
      await emailService.sendAbuseAlert({ to: alertEmail, userName: user.name, from, platform, content, accountName: item.accountName || 'Your Account' });
    }

    // 2. Tag detected (@username in content)
    if (analysis.hasTag && settings.email.onTagged) {
      await emailService.sendTagAlert({ to: alertEmail, userName: user.name, taggedBy: from, platform, content, accountName: item.accountName || 'Your Account' });
    }

    // 3. New message
    if (item.type === 'message' && settings.email.onNewMessage) {
      await emailService.sendNewCommentAlert({ to: alertEmail, from, platform, content, accountName: item.accountName || 'Your Account', type: 'message' });
    }

    // 4. New comment
    if (item.type === 'comment' && settings.email.onNewComment) {
      await emailService.sendNewCommentAlert({ to: alertEmail, from, platform, content, accountName: item.accountName || 'Your Account', type: 'comment' });
    }

  } catch (e) {
    logger.error(`Process inbox item error: ${e.message}`);
  }
};
