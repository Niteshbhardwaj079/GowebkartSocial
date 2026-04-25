const cron        = require('node-cron');
const logger      = require('../../utils/logger');
const { Post, SocialAccount, User } = require('../../models');
const socialService   = require('../social/social.service');
const expiryService   = require('../expiry/expiry.service');
const audit           = require('../audit/audit.service');

class SchedulerService {
  start() {
    logger.info('⏰ Scheduler started');

    // ── Har minute — scheduled posts check karo
    cron.schedule('* * * * *', () => this.publishScheduledPosts());

    // ── Roz subah 9 baje — expiry alerts bhejo
    cron.schedule('0 9 * * *', () => {
      logger.info('📅 Running daily expiry check...');
      expiryService.checkAndSendAlerts();
    });

    // ── Development mein test ke liye: har ghante bhi check karo
    if (process.env.NODE_ENV === 'development') {
      cron.schedule('0 * * * *', () => expiryService.checkAndSendAlerts());
    }
  }

  async publishScheduledPosts() {
    try {
      const now  = new Date();
      const posts = await Post.find({
        status: 'scheduled',
        'scheduling.scheduledAt': { $lte: now }
      }).limit(10);

      for (const post of posts) {
        try {
          post.status = 'publishing';
          await post.save();

          for (const platform of post.platforms) {
            try {
              const account = await SocialAccount.findById(platform.socialAccountId).select('+accessToken');
              if (!account) { platform.status = 'failed'; platform.error = 'Account not found'; continue; }

              const result = await socialService.publishPost(post, account);
              platform.status         = 'published';
              platform.platformPostId = result?.id || result?.post_id;
              platform.publishedAt    = now;
            } catch (err) {
              platform.status = 'failed';
              platform.error  = err.message;
            }
          }

          const allPublished = post.platforms.every(p => p.status === 'published');
          const anyFailed    = post.platforms.some(p => p.status === 'failed');
          post.status = allPublished ? 'published' : anyFailed ? 'failed' : 'published';

          await post.save();
          logger.info(`Post ${post._id}: ${post.status}`);

          // Audit — actor is the post owner; system context (no req)
          const owner = await User.findById(post.user).select('name email role').lean();
          audit.log({
            actor: owner ? { userId: owner._id, name: owner.name, email: owner.email, role: owner.role } : { role: 'system' },
            action: post.status === 'published' ? 'post.published' : 'post.failed',
            category: 'post',
            description: post.status === 'published'
              ? `Auto-published to ${post.platforms.filter(p => p.status === 'published').map(p => p.platform).join(', ')}`
              : `Auto-publish failed: ${post.platforms.filter(p => p.error).map(p => p.error).join('; ').slice(0, 100)}`,
            target: { type: 'post', id: post._id, name: (post.content?.text || '').slice(0, 60) },
            metadata: { platformResults: post.platforms.map(p => ({ platform: p.platform, status: p.status, error: p.error })) },
            company: post.company,
          });
        } catch (err) {
          post.status = 'failed';
          await post.save();
          logger.error(`Post publish error: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`Scheduler error: ${err.message}`);
    }
  }
}

module.exports = new SchedulerService();
