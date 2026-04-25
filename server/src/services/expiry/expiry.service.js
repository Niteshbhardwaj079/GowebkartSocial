const Subscription        = require('../../models/Subscription.model');
const ExpiryAlertSettings = require('../../models/ExpiryAlertSettings.model');
const { User }            = require('../../models');
const emailService        = require('../email/email.service');
const expiryTemplates     = require('../email/expiry.templates');
const logger              = require('../../utils/logger');

class ExpiryService {

  // ── Har roz cron job se call hoga ──
  async checkAndSendAlerts() {
    try {
      logger.info('🔍 Checking subscription expiries...');

      // Settings lo
      const settings = await this.getSettings();
      const now = new Date();

      // Sab active subscriptions lo jo expire hone wali hain
      const subscriptions = await Subscription.find({
        status: { $in: ['active', 'grace'] },
        endDate: { $exists: true, $ne: null },
        plan:    { $ne: 'free' },
      }).populate('user', 'name email').populate('company');

      let alertsSentCount = 0;

      for (const sub of subscriptions) {
        if (!sub.user || !sub.endDate) continue;

        const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));

        // ── Expired ──
        if (daysLeft <= 0) {
          await this.handleExpired(sub, settings);
          continue;
        }

        // ── Client alerts ──
        if (settings.clientEmailEnabled) {
          for (const day of settings.clientAlertDays) {
            const alertKey = `days${day}`;
            if (daysLeft === day && !sub.alertsSent?.[alertKey]) {
              await this.sendClientAlert(sub, daysLeft, settings);
              sub.alertsSent = sub.alertsSent || {};
              sub.alertsSent[alertKey] = true;
              sub.markModified('alertsSent');
              await sub.save();
              alertsSentCount++;
            }
          }
        }

        // ── Admin alerts ──
        if (settings.adminEmailEnabled) {
          for (const day of settings.adminAlertDays) {
            const alertKey = `admin_days${day}`;
            if (daysLeft === day && !sub.alertsSent?.[alertKey]) {
              await this.sendAdminAlert(sub, daysLeft, settings);
              sub.alertsSent[alertKey] = true;
              sub.markModified('alertsSent');
              await sub.save();
              alertsSentCount++;
            }
          }
        }
      }

      logger.info(`✅ Expiry check done. ${alertsSentCount} alerts sent.`);
      return alertsSentCount;

    } catch (err) {
      logger.error(`Expiry check error: ${err.message}`);
    }
  }

  // ── Client ko alert bhejo ──
  async sendClientAlert(sub, daysLeft, settings) {
    try {
      const Plan     = require('../../models/Plan.model');
      const planInfo = await Plan.findOne({ name: sub.plan });
      const renewUrl = `${process.env.CLIENT_URL}/plans`;

      const template = expiryTemplates.expiryWarning({
        name:    sub.user.name,
        plan:    sub.plan,
        daysLeft,
        renewUrl,
        company: sub.company,
        amount:  planInfo?.price?.monthly,
      });

      await emailService.sendEmail({ to: sub.user.email, ...template });
      logger.info(`📧 Expiry alert sent to ${sub.user.email} (${daysLeft} days left)`);
    } catch (err) {
      logger.error(`Client alert error: ${err.message}`);
    }
  }

  // ── Admin ko alert bhejo ──
  async sendAdminAlert(sub, daysLeft, settings) {
    try {
      const adminEmails = settings.adminEmails?.length
        ? settings.adminEmails
        : [await this.getSuperAdminEmail()];

      const adminPanelUrl = `${process.env.CLIENT_URL}/superadmin`;

      for (const adminEmail of adminEmails) {
        if (!adminEmail) continue;
        const template = expiryTemplates.adminExpiryAlert({
          clientName:    sub.user.name,
          clientEmail:   sub.user.email,
          plan:          sub.plan,
          daysLeft,
          adminPanelUrl,
          company:       null, // Admin email mein platform branding
        });
        await emailService.sendEmail({ to: adminEmail, ...template });
      }
    } catch (err) {
      logger.error(`Admin alert error: ${err.message}`);
    }
  }

  // ── Expired handle karo ──
  async handleExpired(sub, settings) {
    try {
      if (sub.alertsSent?.expired) return;

      // Grace period check
      const graceDays   = settings.gracePeriodDays || 3;
      const expiredDays = Math.abs(Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24)));

      if (expiredDays <= graceDays && sub.status !== 'expired') {
        // Grace period mein — status update karo
        sub.status = 'grace';
        await sub.save();
      } else if (expiredDays > graceDays) {
        // Grace period bhi khatam — downgrade to free
        sub.status = 'expired';
        sub.alertsSent.expired = true;
        await sub.save();

        // User ka plan free kar do
        await User.findByIdAndUpdate(sub.user._id, { plan: 'free' });

        // Expired email bhejo
        const template = expiryTemplates.planExpired({
          name:      sub.user.name,
          plan:      sub.plan,
          renewUrl:  `${process.env.CLIENT_URL}/plans`,
          company:   sub.company,
        });
        await emailService.sendEmail({ to: sub.user.email, ...template });

        logger.info(`❌ Plan expired: ${sub.user.email} → free`);
      }
    } catch (err) {
      logger.error(`Handle expired error: ${err.message}`);
    }
  }

  // ── Payment ke baad subscription activate karo ──
  async activateSubscription({ userId, plan, billingCycle, amount, paymentId, orderId, months = 1 }) {
    try {
      const now      = new Date();
      const endDate  = new Date(now);
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

      // Subscription upsert karo
      const sub = await Subscription.findOneAndUpdate(
        { user: userId },
        {
          user:         userId,
          plan,
          status:       'active',
          startDate:    now,
          endDate,
          billingCycle,
          amount,
          // Alerts reset karo
          alertsSent: {},
          $push: {
            history: { plan, amount, startDate: now, endDate, paymentId, activatedAt: now }
          }
        },
        { upsert: true, new: true }
      );

      // User ka plan update karo
      await User.findByIdAndUpdate(userId, { plan });

      logger.info(`✅ Subscription activated: ${userId} → ${plan} until ${endDate.toDateString()}`);
      return sub;

    } catch (err) {
      logger.error(`Activate subscription error: ${err.message}`);
      throw err;
    }
  }

  // ── Get subscription info ──
  async getSubscription(userId) {
    return Subscription.findOne({ user: userId }).populate('user', 'name email plan').populate('company');
  }

  // ── Get or create default settings ──
  async getSettings() {
    let settings = await ExpiryAlertSettings.findOne({ singleton: true });
    if (!settings) {
      settings = await ExpiryAlertSettings.create({ singleton: true });
    }
    return settings;
  }

  // ── Update settings ──
  async updateSettings(data, updatedBy) {
    return ExpiryAlertSettings.findOneAndUpdate(
      { singleton: true },
      { ...data, updatedBy },
      { upsert: true, new: true }
    );
  }

  // ── Helper ──
  async getSuperAdminEmail() {
    const admin = await User.findOne({ role: 'superadmin' }).select('email');
    return admin?.email || process.env.SUPPORT_ADMIN_EMAIL || process.env.EMAIL_USER;
  }

  // ── Dashboard ke liye expiry info ──
  async getExpiryInfo(userId) {
    const sub = await this.getSubscription(userId);
    if (!sub || !sub.endDate || sub.plan === 'free') {
      return { hasSubscription: false };
    }

    const settings   = await this.getSettings();
    const daysLeft   = Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24));
    const showBanner = daysLeft <= settings.dashboardBannerDays;

    return {
      hasSubscription: true,
      plan:            sub.plan,
      status:          sub.status,
      endDate:         sub.endDate,
      daysLeft,
      showBanner,
      isExpired:       daysLeft <= 0,
      isGrace:         sub.status === 'grace',
      urgency:         daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low',
    };
  }
}

module.exports = new ExpiryService();
