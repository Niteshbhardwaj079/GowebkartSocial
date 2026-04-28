const { Post, User, SocialAccount } = require('../models');
const audit = require('../services/audit/audit.service');
const logger = require('../utils/logger');
const scheduler = require('../services/scheduler/scheduler.service');

// Plan ke hisaab se post limits
const PLAN_LIMITS = { free: 30, basic: 100, pro: 999999 };

// ✅ CREATE POST
exports.createPost = async (req, res) => {
  try {
    const user = req.user;
    const limit = PLAN_LIMITS[user.plan] || 30;

    if (user.usage.postsThisMonth >= limit) {
      return res.status(403).json({
        success: false,
        message: `Monthly post limit reached (${limit} posts). Please upgrade your plan.`
      });
    }

    // Frontend usually sends platforms as [{ platform: 'facebook' }] — a list
    // of platform NAMES with no socialAccountId resolved. Look up each user's
    // connected, active accounts for those platforms and expand into one
    // platform-entry per account (FB users may have multiple Pages).
    const requested = (req.body.platforms || [])
      .map(p => (typeof p === 'string' ? p : p.platform))
      .filter(Boolean);
    if (!requested.length) {
      return res.status(400).json({ success: false, message: 'Kam se kam ek platform select karein' });
    }

    // Company-scoped: any team member can post via the admin's connected
    // accounts. Demo users only see their own.
    const accountFilter = user.isDemo
      ? { user: user._id, platform: { $in: requested }, isActive: true }
      : { company: user.company?._id || user.company, platform: { $in: requested }, isActive: true };
    const accounts = await SocialAccount.find(accountFilter).select('_id platform accountType');

    const platformEntries = [];
    const missing = [];
    for (const name of requested) {
      const matches = accounts.filter(a => a.platform === name);
      // For Facebook, prefer 'page' accounts (you post to a Page, not a personal profile).
      const usable = name === 'facebook' && matches.some(a => a.accountType === 'page')
        ? matches.filter(a => a.accountType === 'page')
        : matches;
      if (usable.length === 0) { missing.push(name); continue; }
      for (const acc of usable) {
        platformEntries.push({ platform: name, socialAccountId: acc._id, status: 'pending' });
      }
    }

    if (platformEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Koi connected account nahi mila: ${missing.join(', ')}. Pehle Social Accounts page se connect karein.`,
      });
    }

    // Decide scheduled vs immediate. Frontend may send status='publishing' to
    // signal "Post Now" — treat that as an immediate publish, not a status to
    // store directly (storing 'publishing' would orphan the post forever as
    // the cron only sweeps 'scheduled' / stuck 'publishing' rows).
    const wantsImmediate = !req.body.scheduling?.scheduledAt || req.body.status === 'publishing';

    const postData = {
      content:         req.body.content,
      platformContent: req.body.platformContent,
      platforms:       platformEntries,
      scheduling:      wantsImmediate
        ? { scheduledAt: new Date(), timezone: req.body.scheduling?.timezone || 'Asia/Kolkata' }
        : req.body.scheduling,
      status:          'scheduled',
      hashtags:        req.body.hashtags || [],
      mentions:        req.body.mentions || [],
      aiGenerated:     !!req.body.aiGenerated,
      labels:          req.body.labels || [],
      campaign:        req.body.campaign,
      user:            user._id,
      company:         user.company?._id,
    };

    let post = await Post.create(postData);
    await User.findByIdAndUpdate(user._id, { $inc: { 'usage.postsThisMonth': 1 } });

    audit.log({
      req,
      action: wantsImmediate ? 'post.created' : 'post.scheduled',
      category: 'post',
      description: wantsImmediate
        ? `Posting to ${platformEntries.map(p => p.platform).join(', ')}`
        : `Scheduled for ${new Date(postData.scheduling.scheduledAt).toLocaleString('en-IN')}`,
      target: { type: 'post', id: post._id, name: (post.content?.text || '').slice(0, 60) },
      metadata: { platforms: requested, scheduledAt: postData.scheduling.scheduledAt },
    });

    if (wantsImmediate) {
      // Run publishing inline so the user gets the actual outcome in this
      // request, not a status that flips a minute later.
      try {
        await scheduler.publishOne(post);
      } catch (err) {
        logger.error(`Inline publish failed (post ${post._id}): ${err.message}`);
      }
      post = await Post.findById(post._id).populate('platforms.socialAccountId', 'displayName platform profilePicture');

      const failed = post.platforms.filter(p => p.status === 'failed');
      const okCount = post.platforms.filter(p => p.status === 'published').length;
      return res.status(201).json({
        success: true,
        message: post.status === 'published'
          ? `🚀 Posted to ${okCount} platform${okCount === 1 ? '' : 's'}` + (failed.length ? ` — ${failed.length} failed` : '')
          : `❌ Publish failed: ${failed.map(f => `${f.platform} — ${f.error}`).join('; ').slice(0, 200)}`,
        post,
        warnings: missing.length ? `Skipped (not connected): ${missing.join(', ')}` : undefined,
      });
    }

    return res.status(201).json({
      success: true,
      message: '📅 Post scheduled!',
      post,
      warnings: missing.length ? `Skipped (not connected): ${missing.join(', ')}` : undefined,
    });

  } catch (error) {
    logger.error(`Create post error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL POSTS (with filters + pagination)
exports.getPosts = async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 20, search } = req.query;

    const filter = { user: req.user._id };
    if (status)   filter.status = status;
    if (platform) filter['platforms.platform'] = platform;
    if (search)   filter['content.text'] = { $regex: search, $options: 'i' };

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('platforms.socialAccountId', 'displayName platform profilePicture');

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      posts,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET SINGLE POST
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
      .populate('platforms.socialAccountId', 'displayName platform profilePicture');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['draft', 'scheduled'] }
    });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found or already published' });

    Object.assign(post, req.body);
    await post.save();

    res.json({ success: true, message: 'Post updated!', post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: { $nin: ['publishing'] }
    });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found or cannot be deleted' });

    audit.log({
      req, action: 'post.deleted', category: 'post',
      description: `Deleted post: ${(post.content?.text || '').slice(0, 60)}`,
      target: { type: 'post', id: post._id, name: (post.content?.text || '').slice(0, 60) },
    });
    res.json({ success: true, message: 'Post deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ BULK CSV UPLOAD
exports.bulkUpload = async (req, res) => {
  try {
    const { posts } = req.body;
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ success: false, message: 'posts array required' });
    }

    const postsToCreate = posts.map(p => ({
      content: { text: p.text },
      platforms: p.platforms?.map(pl => ({ platform: pl })) || [],
      scheduling: { scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : null },
      status: p.scheduledAt ? 'scheduled' : 'draft',
      user: req.user._id,
      company: req.user.company?._id
    }));

    const created = await Post.insertMany(postsToCreate);

    res.json({ success: true, message: `${created.length} posts created!`, count: created.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CALENDAR POSTS (date range ke liye)
exports.getCalendarPosts = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = {
      user: req.user._id,
      'scheduling.scheduledAt': {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    };

    const posts = await Post.find(filter).sort({ 'scheduling.scheduledAt': 1 });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
