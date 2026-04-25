const { Post, User } = require('../models');
const audit = require('../services/audit/audit.service');
const logger = require('../utils/logger');

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

    const postData = {
      ...req.body,
      user: user._id,
      company: user.company?._id
    };

    // Agar scheduledAt hai to status = scheduled, warna draft
    if (postData.scheduling?.scheduledAt) {
      postData.status = 'scheduled';
    }

    const post = await Post.create(postData);

    // Usage counter +1
    await User.findByIdAndUpdate(user._id, { $inc: { 'usage.postsThisMonth': 1 } });

    logger.info(`Post created: ${post._id} by user ${user._id}`);
    audit.log({
      req,
      action: post.status === 'scheduled' ? 'post.scheduled' : 'post.created',
      category: 'post',
      description: post.status === 'scheduled'
        ? `Scheduled post for ${new Date(post.scheduling.scheduledAt).toLocaleString('en-IN')}`
        : `Created post (${post.platforms?.map(p => p.platform).join(', ') || 'draft'})`,
      target: { type: 'post', id: post._id, name: (post.content?.text || '').slice(0, 60) },
      metadata: {
        platforms: post.platforms?.map(p => p.platform),
        scheduledAt: post.scheduling?.scheduledAt,
      },
    });
    res.status(201).json({ success: true, message: 'Post created!', post });

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
