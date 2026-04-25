const cron        = require('node-cron');
const logger      = require('../../utils/logger');
const { Post, SocialAccount } = require('../../models');
const socialService   = require('../social/social.service');
const expiryService   = require('../expiry/expiry.service');

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
