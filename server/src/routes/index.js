const express     = require('express');
const { protect } = require('../middleware/auth.middleware');
const { Post, User, SocialAccount } = require('../models');
const aiService   = require('../services/ai/ai.service');

// ── POST ROUTES ──
const postRouter = express.Router();
const postCtrl   = require('../controllers/post.controller');

postRouter.get('/calendar',     protect, postCtrl.getCalendarPosts);
postRouter.post('/bulk-upload', protect, postCtrl.bulkUpload);
postRouter.get('/',             protect, postCtrl.getPosts);
postRouter.post('/',            protect, postCtrl.createPost);
postRouter.get('/:id',          protect, postCtrl.getPost);
postRouter.put('/:id',          protect, postCtrl.updatePost);
postRouter.delete('/:id',       protect, postCtrl.deletePost);

// ── AI ROUTES ──
const aiRouter = express.Router();
const AI_LIMITS = { free: 999999, basic: 999999, pro: 999999 };

const checkAILimit = async (req, res, next) => {
  try {
    const plan  = req.user?.plan || 'free';
    const limit = AI_LIMITS[plan] || 999999;
    const used  = req.user?.usage?.aiUsageToday || 0;
    if (used >= limit) {
      return res.status(403).json({ success: false, message: 'AI limit reached for today' });
    }
    // Usage increment karo (silently - fail hone pe bhi continue)
    User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.aiUsageToday': 1 } }).catch(() => {});
    next();
  } catch (e) {
    next(); // Error pe bhi AI use hone do
  }
};

aiRouter.post('/caption',  protect, checkAILimit, async (req, res) => {
  try { res.json({ success: true, ...(await aiService.generateCaption(req.body)) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
aiRouter.post('/hashtags', protect, checkAILimit, async (req, res) => {
  try { res.json({ success: true, hashtags: aiService.generateHashtags(req.body.topic, req.body.platform) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
aiRouter.post('/ideas', protect, async (req, res) => {
  try { res.json({ success: true, ideas: aiService.generatePostIdeas(req.body.niche, req.body.count) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
aiRouter.post('/rewrite', protect, checkAILimit, async (req, res) => {
  try { res.json({ success: true, ...aiService.rewriteContent(req.body.text, req.body.style) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── UPLOAD ROUTES ──
const uploadRouter  = express.Router();
const uploadService = require('../services/upload/upload.service');

uploadRouter.post('/media', protect, uploadService.upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files' });
    const results = [];
    for (const file of req.files) {
      results.push(await uploadService.uploadToCloudinary(file.buffer, file.mimetype, `social-saas/${req.user._id}`));
    }
    res.json({ success: true, files: results });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ANALYTICS ROUTES ──
const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', protect, async (req, res) => {
  try {
    const uid  = req.user._id;
    const now  = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo    = new Date(Date.now() - 7*24*60*60*1000);

    const [total, scheduled, published, failed, drafts, recent] = await Promise.all([
      Post.countDocuments({ user: uid }),
      Post.countDocuments({ user: uid, status: 'scheduled' }),
      Post.countDocuments({ user: uid, status: 'published', createdAt: { $gte: monthStart } }),
      Post.countDocuments({ user: uid, status: 'failed' }),
      Post.countDocuments({ user: uid, status: 'draft' }),
      Post.find({ user: uid }).sort({ createdAt: -1 }).limit(5)
    ]);

    const platformStats = await Post.aggregate([
      { $match: { user: uid, status: 'published' } },
      { $unwind: '$platforms' },
      { $group: { _id: '$platforms.platform', count: { $sum: 1 } } }
    ]);

    const last7Days = await Post.aggregate([
      { $match: { user: uid, createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const engagement = await Post.aggregate([
      { $match: { user: uid, status: 'published' } },
      { $group: { _id: null, likes: { $sum: '$engagement.likes' }, comments: { $sum: '$engagement.comments' }, shares: { $sum: '$engagement.shares' } } }
    ]);

    res.json({
      success: true,
      stats: { total, scheduled, published, failed, drafts },
      platformStats, last7Days, recent,
      engagement: engagement[0] || { likes:0, comments:0, shares:0 },
      usage: { postsThisMonth: req.user.usage.postsThisMonth, aiUsageToday: req.user.usage.aiUsageToday, plan: req.user.plan }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── SOCIAL ACCOUNT ROUTES ──
const socialRouter = express.Router();
const axios        = require('axios');

socialRouter.get('/accounts', protect, async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ user: req.user._id, isActive: true }).select('-accessToken -refreshToken');
    res.json({ success: true, accounts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

socialRouter.delete('/accounts/:id', protect, async (req, res) => {
  try {
    await SocialAccount.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ success: true, message: 'Account disconnected' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

socialRouter.get('/facebook/connect', protect, (req, res) => {
  if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID === 'baad_mein') {
    return res.status(400).json({ success: false, message: 'Facebook API keys add karein (API Settings mein)' });
  }
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: `${process.env.SERVER_URL}/api/social/callback/facebook`,
    scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
    state: req.user._id.toString()
  });
  res.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?${params}` });
});

socialRouter.get('/twitter/connect', protect, (req, res) => {
  if (!process.env.TWITTER_API_KEY || process.env.TWITTER_API_KEY === 'baad_mein') {
    return res.status(400).json({ success: false, message: 'Twitter API keys add karein' });
  }
  const params = new URLSearchParams({
    response_type: 'code', client_id: process.env.TWITTER_API_KEY,
    redirect_uri: `${process.env.SERVER_URL}/api/social/callback/twitter`,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: req.user._id.toString(), code_challenge: 'challenge', code_challenge_method: 'plain'
  });
  res.json({ url: `https://twitter.com/i/oauth2/authorize?${params}` });
});

socialRouter.get('/linkedin/connect', protect, (req, res) => {
  if (!process.env.LINKEDIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID === 'baad_mein') {
    return res.status(400).json({ success: false, message: 'LinkedIn API keys add karein' });
  }
  const params = new URLSearchParams({
    response_type: 'code', client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${process.env.SERVER_URL}/api/social/callback/linkedin`,
    scope: 'r_liteprofile r_emailaddress w_member_social',
    state: req.user._id.toString()
  });
  res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params}` });
});

// OAuth Callbacks
socialRouter.get('/callback/facebook', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: process.env.FACEBOOK_APP_ID, client_secret: process.env.FACEBOOK_APP_SECRET, redirect_uri: `${process.env.SERVER_URL}/api/social/callback/facebook`, code }
    });
    const token   = tokenRes.data.access_token;
    const userRes = await axios.get('https://graph.facebook.com/v18.0/me', { params: { fields: 'id,name,picture', access_token: token } });
    const fbUser  = userRes.data;
    await SocialAccount.findOneAndUpdate(
      { user: userId, platform: 'facebook', platformUserId: fbUser.id },
      { platformUsername: fbUser.name, displayName: fbUser.name, profilePicture: fbUser.picture?.data?.url, accessToken: token, isActive: true, lastSync: new Date() },
      { upsert: true, new: true }
    );
    res.redirect(`${process.env.CLIENT_URL}/accounts?connected=facebook`);
  } catch (e) { res.redirect(`${process.env.CLIENT_URL}/accounts?error=facebook_failed`); }
});

// ── ADS ROUTES ──
const adsRouter    = express.Router();
const adsService   = require('../services/ads/ads.service');
const { AdCampaign } = require('../models');
const { requirePlan, authorize } = require('../middleware/auth.middleware');

adsRouter.get('/accounts', protect, requirePlan('basic','pro'), async (req, res) => {
  try {
    const fb = await SocialAccount.findOne({ user: req.user._id, platform: 'facebook' }).select('+accessToken');
    if (!fb) return res.status(400).json({ success: false, message: 'Facebook connect karein' });
    const accounts = await adsService.getAdAccounts(fb.accessToken);
    res.json({ success: true, accounts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adsRouter.get('/campaigns', protect, requirePlan('basic','pro'), async (req, res) => {
  try {
    const campaigns = await AdCampaign.find({ user: req.user._id }).populate('post','content.text').sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adsRouter.post('/campaigns', protect, requirePlan('basic','pro'), async (req, res) => {
  try {
    const { name, objective, audience, budget, duration, placements, postId, adAccountId } = req.body;
    const fb = await SocialAccount.findOne({ user: req.user._id, platform: 'facebook' }).select('+accessToken');
    if (!fb) return res.status(400).json({ success: false, message: 'Facebook not connected' });
    const token = fb.accessToken;
    const metaCampaignId = await adsService.createCampaign(adAccountId, { name, objective }, token);
    const metaAdSetId    = await adsService.createAdSet(adAccountId, metaCampaignId, { name:`${name}-AdSet`, audience, budget, duration, placements }, token);
    const metaAdId       = await adsService.createAd(adAccountId, metaAdSetId, { name:`${name}-Ad`, pageId: fb.platformUserId, postId }, token);
    const campaign = await AdCampaign.create({ user: req.user._id, company: req.user.company?._id, name, objective, audience, budget, duration, placements, post: postId, socialAccount: fb._id, metaCampaignId, metaAdSetId, metaAdId, metaAdAccountId: adAccountId, status: 'pending' });
    res.status(201).json({ success: true, campaign });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adsRouter.post('/campaigns/:id/publish', protect, requirePlan('basic','pro'), async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({ _id: req.params.id, user: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found' });
    const fb = await SocialAccount.findById(campaign.socialAccount).select('+accessToken');
    await adsService.publishCampaign(campaign._id, campaign, fb.accessToken);
    res.json({ success: true, message: 'Campaign live! 🚀' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adsRouter.post('/campaigns/:id/pause', protect, requirePlan('basic','pro'), async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({ _id: req.params.id, user: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found' });
    const fb = await SocialAccount.findById(campaign.socialAccount).select('+accessToken');
    await adsService.pauseCampaign(campaign.metaCampaignId, fb.accessToken);
    await AdCampaign.findByIdAndUpdate(campaign._id, { status: 'paused' });
    res.json({ success: true, message: 'Campaign paused' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADMIN ROUTES ──
const adminRouter = express.Router();
adminRouter.get('/users', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company?._id }).select('-password').sort({ createdAt: -1 }).lean();

    // Aggregate post stats per user (same shape as superAdmin)
    const userIds = users.map(u => u._id);
    const rows = userIds.length ? await Post.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: {
        _id: '$user',
        totalPosts:     { $sum: 1 },
        publishedPosts: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        scheduledPosts: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
        failedPosts:    { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        likes:          { $sum: { $ifNull: ['$engagement.likes',    0] } },
        comments:       { $sum: { $ifNull: ['$engagement.comments', 0] } },
        shares:         { $sum: { $ifNull: ['$engagement.shares',   0] } },
        reach:          { $sum: { $ifNull: ['$engagement.reach',    0] } },
      }}
    ]) : [];
    const map = new Map(rows.map(r => [String(r._id), r]));
    users.forEach(u => {
      const s = map.get(String(u._id));
      u.postStats = s
        ? { totalPosts:s.totalPosts, publishedPosts:s.publishedPosts, scheduledPosts:s.scheduledPosts, failedPosts:s.failedPosts,
            likes:s.likes, comments:s.comments, shares:s.shares, reach:s.reach,
            engagement: s.likes + s.comments + s.shares }
        : { totalPosts:0, publishedPosts:0, scheduledPosts:0, failedPosts:0, likes:0, comments:0, shares:0, reach:0, engagement:0 };
    });

    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
const audit = require('../services/audit/audit.service');
const { cascadeDeleteUser: superAdminCascade } = require('../controllers/superAdmin.controller');
adminRouter.put('/users/:id/plan', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { plan: req.body.plan }, { new: true });
    audit.log({ req, action: 'user.plan.changed', category: 'plan',
      description: `${req.user.email} set ${user.email}'s plan to ${req.body.plan}`,
      target: { type: 'user', id: user._id, name: user.name },
      metadata: { plan: req.body.plan }, company: user.company });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
adminRouter.put('/users/:id/status', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    audit.log({ req, action: req.body.isActive ? 'user.activated' : 'user.deactivated', category: 'admin',
      description: `${req.user.email} ${req.body.isActive ? 'activated' : 'deactivated'} ${user.email}`,
      target: { type: 'user', id: user._id, name: user.name }, company: user.company });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
// Admin can delete users in their own company (NOT admins or superadmins)
adminRouter.delete('/users/:id', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role !== 'user') return res.status(403).json({ success: false, message: 'Admins can only delete regular users' });
    if (String(target._id) === String(req.user._id)) return res.status(400).json({ success: false, message: "You can't delete your own account" });
    if (req.user.role === 'admin' && String(target.company) !== String(req.user.company?._id || req.user.company)) {
      return res.status(403).json({ success: false, message: 'Can only delete users in your own company' });
    }

    audit.log({ req, action: 'user.deleted', category: 'admin',
      description: `${req.user.email} deleted user ${target.email}`,
      target: { type: 'user', id: target._id, name: target.name },
      metadata: { email: target.email, role: target.role, plan: target.plan },
      company: target.company });

    await superAdminCascade(target);
    res.json({ success: true, message: `🗑️ ${target.name} deleted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = { postRouter, aiRouter, uploadRouter, analyticsRouter, socialRouter, adsRouter, adminRouter };
