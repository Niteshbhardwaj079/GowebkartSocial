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
      const now = new Date();
      // Pick: (a) scheduled posts whose time has come,
      //       (b) posts stuck in 'publishing' for >5 min (recovery from a crash/restart)
      const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000);
      const posts = await Post.find({
        $or: [
          { status: 'scheduled', 'scheduling.scheduledAt': { $lte: now } },
          { status: 'publishing', updatedAt: { $lte: stuckCutoff } },
        ],
      }).limit(10);

      for (const post of posts) {
        await this.publishOne(post).catch(err =>
          logger.error(`publishOne crashed for ${post._id}: ${err.message}`)
        );
      }
    } catch (err) {
      logger.error(`Scheduler error: ${err.message}`);
    }
  }

  // Publish a single post across all its platforms. Used by both the cron
  // sweep and the inline "Post Now" path in the controller.
  async publishOne(post) {
    const now = new Date();
    post.status = 'publishing';
    await post.save();

    for (const platform of post.platforms) {
      try {
        if (!platform.socialAccountId) {
          platform.status = 'failed';
          platform.error  = 'No connected account for this platform';
          continue;
        }
        const account = await SocialAccount.findById(platform.socialAccountId).select('+accessToken');
        if (!account || !account.isActive) {
          platform.status = 'failed';
          platform.error  = 'Connected account not found or has been disconnected';
          continue;
        }

        const result = await socialService.publishToPlatform(platform.platform, account, post);
        platform.status         = 'published';
        platform.platformPostId = result?.postId || result?.id || result?.post_id;
        platform.publishedAt    = now;
        platform.error          = undefined;
      } catch (err) {
        platform.status = 'failed';
        platform.error  = err.message;
        logger.warn(`Publish failed (${platform.platform}, post ${post._id}): ${err.message}`);
      }
    }

    const successes = post.platforms.filter(p => p.status === 'published').length;
    const total     = post.platforms.length;
    post.status = total === 0
      ? 'failed'
      : successes === total
        ? 'published'
        : successes > 0
          ? 'published'  // partial success — overall published; per-platform errors visible in detail
          : 'failed';

    await post.save();
    logger.info(`Post ${post._id}: ${post.status} (${successes}/${total} platforms succeeded)`);

    // Audit — actor is the post owner
    try {
      const owner = await User.findById(post.user).select('name email role').lean();
      audit.log({
        actor: owner ? { userId: owner._id, name: owner.name, email: owner.email, role: owner.role } : { role: 'system' },
        action: post.status === 'published' ? 'post.published' : 'post.failed',
        category: 'post',
        description: post.status === 'published'
          ? `Published to ${post.platforms.filter(p => p.status === 'published').map(p => p.platform).join(', ') || 'no platform'}`
          : `Publish failed: ${post.platforms.filter(p => p.error).map(p => `${p.platform}: ${p.error}`).join('; ').slice(0, 200) || 'no platforms succeeded'}`,
        target: { type: 'post', id: post._id, name: (post.content?.text || '').slice(0, 60) },
        metadata: { platformResults: post.platforms.map(p => ({ platform: p.platform, status: p.status, error: p.error })) },
        company: post.company,
      });
    } catch {}

    return post;
  }
}

module.exports = new SchedulerService();
