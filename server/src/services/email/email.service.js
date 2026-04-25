const nodemailer = require('nodemailer');
const logger     = require('../../utils/logger');
const { templates, getCompanyInfo } = require('./email.templates');

class EmailService {

  _getTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
        logger.warn(`[DEV MODE] Email not sent. To: ${to} | Subject: ${subject}`);
        return { success: true, dev: true };
      }
      const transporter = this._getTransporter();
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `${process.env.EMAIL_SENDER_NAME || 'SocialSaaS'} <${process.env.EMAIL_USER}>`,
        to, subject, html, text: text || subject
      });
      logger.info(`✅ Email sent: ${to} [${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`❌ Email error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendOTP(to, otp, name, userId = null) {
    const company = await getCompanyInfo(userId);
    const t = templates.otp({ name, otp, expireMinutes: process.env.OTP_EXPIRE_MINUTES || 10, company });
    return this.sendEmail({ to, ...t });
  }

  async sendWelcome(to, name, plan, userId = null) {
    const company = await getCompanyInfo(userId);
    const t = templates.welcome({ name, plan, company });
    return this.sendEmail({ to, ...t });
  }

  async sendPasswordReset(to, name, resetUrl, userId = null) {
    const company = await getCompanyInfo(userId);
    const t = templates.passwordReset({ name, resetUrl, company });
    return this.sendEmail({ to, ...t });
  }

  async sendTagAlert({ to, userName, taggedBy, platform, content, accountName, userId }) {
    const company = await getCompanyInfo(userId);
    const t = templates.tagAlert({ name: userName, taggedBy, platform, content, accountName, company });
    return this.sendEmail({ to, ...t });
  }

  async sendAbuseAlert({ to, userName, from, platform, content, accountName, userId }) {
    const company = await getCompanyInfo(userId);
    const t = templates.abuseAlert({ name: userName, from, platform, content, accountName, company });
    return this.sendEmail({ to, ...t });
  }

  async sendSupportTicketToAdmin({ ticket, adminEmail, company }) {
    const t = templates.supportTicket({
      ticketId: ticket.ticketId, clientName: ticket.userName, clientEmail: ticket.userEmail,
      category: ticket.category, priority: ticket.priority, subject: ticket.subject,
      description: ticket.description, company
    });
    return this.sendEmail({ to: adminEmail, ...t });
  }

  async sendTicketConfirmation(to, { ticketId, name, subject, company }) {
    const t = templates.ticketConfirmation({ ticketId, name, subject, estimatedTime: '24 ghante mein', company });
    return this.sendEmail({ to, ...t });
  }

  async sendPostPublished(to, { name, postText, platforms, publishedAt, userId }) {
    const company = await getCompanyInfo(userId);
    const t = templates.postPublished({ name, postText, platforms, publishedAt, company });
    return this.sendEmail({ to, ...t });
  }

  async sendPostFailed(to, { name, postText, platforms, error, userId }) {
    const company = await getCompanyInfo(userId);
    const t = templates.postFailed({ name, postText, platforms, error, company });
    return this.sendEmail({ to, ...t });
  }

  async sendNewCommentAlert({ to, from, platform, content, accountName, type = 'comment', userId }) {
    const company = await getCompanyInfo(userId);
    const { baseTemplate } = require('./email.templates');
    const subject = `💬 New ${type} from ${from} on ${platform}`;
    const html = baseTemplate({
      company, title: `New ${type}`, preheader: `${from} ne ${platform} par ${type} kiya`,
      body: `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">💬 New ${type === 'message' ? 'Message' : 'Comment'}</div>
        <p><strong>${from}</strong> ne <strong>${platform}</strong> par ${type === 'message' ? 'message bheja' : 'comment kiya'} hai.</p>
        <div style="background:#f8fafc;border-radius:10px;padding:14px;border:1px solid #e2e8f0;margin:16px 0;">
          <p style="font-size:14px;">"${content}"</p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${process.env.CLIENT_URL||'#'}/inbox" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0099ff);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;">📬 Reply Karein</a>
        </div>
      `
    });
    return this.sendEmail({ to, subject, html });
  }

  async sendMentionAlert({ to, userName, mentionedBy, platform, content, accountName, userId }) {
    return this.sendTagAlert({ to, userName, taggedBy: mentionedBy, platform, content, accountName, userId });
  }

  isAbusive(text) {
    if (!text) return false;
    const words = ['fuck','shit','bastard','bitch','asshole','idiot','stupid','kill','die','madarchod','bhenchod','chutiya','saala','harami','gadha','kamina','randi','mc','bc','gandu','bkl','haramkhor','kutte','suar'];
    return words.some(w => text.toLowerCase().includes(w));
  }

  analyzeContent(text) {
    return { isAbusive: this.isAbusive(text), hasTag: /@\w+/.test(text), hasMention: text.includes('@'), wordCount: text.split(' ').length };
  }
}

module.exports = new EmailService();
