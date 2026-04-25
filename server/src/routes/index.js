const express     = require('express');
const { protect, authorize, requirePlan } = require('../middleware/auth.middleware');
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

// Diagnostics — superadmin can verify which platform creds are configured.
// Never leaks the actual values, just presence + length.
socialRouter.get('/diagnostics', protect, authorize('admin', 'superadmin'), (req, res) => {
  const checkEnv = (key) => {
    const v = process.env[key];
    if (!v || v === 'baad_mein') return { set: false };
    return { set: true, length: v.length };
  };
  res.json({
    success: true,
    env: {
      SERVER_URL: process.env.SERVER_URL || null,
      CLIENT_URL: process.env.CLIENT_URL || null,
      facebook: { appId: checkEnv('FACEBOOK_APP_ID'), appSecret: checkEnv('FACEBOOK_APP_SECRET') },
      twitter:  { apiKey: checkEnv('TWITTER_API_KEY'), apiSecret: checkEnv('TWITTER_API_SECRET') },
      linkedin: { clientId: checkEnv('LINKEDIN_CLIENT_ID'), clientSecret: checkEnv('LINKEDIN_CLIENT_SECRET') },
      youtube:  { clientId: checkEnv('YOUTUBE_CLIENT_ID'), clientSecret: checkEnv('YOUTUBE_CLIENT_SECRET') },
    },
    expectedRedirects: process.env.SERVER_URL ? {
      facebook: `${process.env.SERVER_URL}/api/social/callback/facebook`,
      twitter:  `${process.env.SERVER_URL}/api/social/callback/twitter`,
      linkedin: `${process.env.SERVER_URL}/api/social/callback/linkedin`,
    } : null,
  });
});

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

// Resolve which FB app credentials to use for a given user — prefer the
// user's own keys (saved via API Settings), fall back to global Render env.
async function resolveFbAppCreds(userId) {
  try {
    const UserApiSettings = require('../models/UserApiSettings.model');
    const us = await UserApiSettings.findOne({ user: userId })
      .select('+facebook.appId +facebook.appSecret');
    if (us?.facebook?.appId && us?.facebook?.appSecret) {
      return { appId: us.facebook.appId, appSecret: us.facebook.appSecret, source: 'user' };
    }
  } catch {}
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== 'baad_mein' &&
      process.env.FACEBOOK_APP_SECRET) {
    return { appId: process.env.FACEBOOK_APP_ID, appSecret: process.env.FACEBOOK_APP_SECRET, source: 'env' };
  }
  return null;
}

socialRouter.get('/facebook/connect', protect, async (req, res) => {
  const creds = await resolveFbAppCreds(req.user._id);
  if (!creds) {
    return res.status(400).json({
      success: false,
      message: 'Facebook keys missing. API Settings me apne FB App ID/Secret save karein, ya Render env me FACEBOOK_APP_ID/FACEBOOK_APP_SECRET set karein.',
    });
  }
  if (!process.env.SERVER_URL) {
    return res.status(500).json({ success: false, message: 'SERVER_URL env var missing — OAuth callback nahi banega' });
  }
  const params = new URLSearchParams({
    client_id:    creds.appId,
    redirect_uri: `${process.env.SERVER_URL}/api/social/callback/facebook`,
    // public_profile + email = Login.  pages_show_list = enumerate user's Pages.
    // pages_manage_posts/pages_read_engagement = FB page posting + insights.
    // instagram_basic/instagram_content_publish = IG Business posting.
    // business_management = needed for some IG Graph endpoints.
    scope:         'public_profile,email,pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management',
    response_type: 'code',
    state:         req.user._id.toString(),
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
  const logger = require('../utils/logger');
  const { code, state: userId, error, error_description } = req.query;

  // FB returned an OAuth error directly (e.g., user denied permission)
  if (error) {
    logger.warn(`FB OAuth user-side error: ${error} — ${error_description}`);
    return res.redirect(`${process.env.CLIENT_URL}/accounts?error=fb&msg=${encodeURIComponent(error_description || error)}`);
  }
  if (!code || !userId) {
    return res.redirect(`${process.env.CLIENT_URL}/accounts?error=fb&msg=${encodeURIComponent('Missing code or state')}`);
  }

  try {
    // Use the SAME app credentials the user started OAuth with. Per-user
    // keys (from API Settings) take priority; otherwise fall back to env.
    // Without this, an OAuth started with user keys is rejected by the
    // exchange call using global keys ("App ID mismatch") and the
    // SocialAccount row never gets saved.
    const creds = await resolveFbAppCreds(userId);
    if (!creds) {
      logger.warn(`FB callback: no app creds available for user ${userId}`);
      return res.redirect(`${process.env.CLIENT_URL}/accounts?error=fb&msg=${encodeURIComponent('FB app credentials missing on server')}`);
    }
    logger.info(`FB callback using ${creds.source} keys for user ${userId}`);

    // 1. Exchange code → short-lived token
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id:     creds.appId,
        client_secret: creds.appSecret,
        redirect_uri:  `${process.env.SERVER_URL}/api/social/callback/facebook`,
        code,
      },
    });
    const shortToken = tokenRes.data.access_token;

    // 2. Exchange short-lived → long-lived (60 day) token
    let longToken = shortToken;
    try {
      const llRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type:        'fb_exchange_token',
          client_id:         creds.appId,
          client_secret:     creds.appSecret,
          fb_exchange_token: shortToken,
        },
      });
      longToken = llRes.data.access_token || shortToken;
    } catch (llErr) {
      logger.warn(`FB long-lived exchange failed (will use short token): ${llErr.response?.data?.error?.message || llErr.message}`);
    }

    // 3. Get the user's FB profile
    const userRes = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: { fields: 'id,name,picture', access_token: longToken },
    });
    const fbUser = userRes.data;
    const tokenExpiry = new Date(Date.now() + 55 * 24 * 60 * 60 * 1000); // ~55 days

    // 4. Save/update the personal FB account row (bookkeeping; posting happens via Pages)
    await SocialAccount.findOneAndUpdate(
      { user: userId, platform: 'facebook', platformUserId: fbUser.id },
      {
        platformUsername: fbUser.name,
        displayName:      fbUser.name,
        profilePicture:   fbUser.picture?.data?.url,
        accessToken:      longToken,
        tokenExpiry,
        accountType:      'personal',
        isActive:         true,
        lastSync:         new Date(),
        metadata:         { source: 'facebook-login' },
      },
      { upsert: true, new: true }
    );

    // 5. Enumerate user's FB Pages — each page is its own posting target.
    let pagesCount = 0, igCount = 0;
    try {
      const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: {
          fields: 'id,name,access_token,picture,category,instagram_business_account{id,username,profile_picture_url}',
          access_token: longToken,
        },
      });
      const pages = pagesRes.data?.data || [];

      for (const page of pages) {
        // 5a. Save this Facebook Page (its own page-token is what you POST with)
        await SocialAccount.findOneAndUpdate(
          { user: userId, platform: 'facebook', platformUserId: page.id },
          {
            platformUsername: page.name,
            displayName:      page.name,
            profilePicture:   page.picture?.data?.url,
            accessToken:      page.access_token, // page tokens don't expire if user token is long-lived
            accountType:      'page',
            isActive:         true,
            lastSync:         new Date(),
            metadata:         { category: page.category, parentUser: fbUser.id },
          },
          { upsert: true, new: true }
        );
        pagesCount++;

        // 5b. If this Page has a linked IG Business account, save it as an IG row
        if (page.instagram_business_account?.id) {
          const ig = page.instagram_business_account;
          await SocialAccount.findOneAndUpdate(
            { user: userId, platform: 'instagram', platformUserId: ig.id },
            {
              platformUsername: ig.username,
              displayName:      ig.username,
              profilePicture:   ig.profile_picture_url,
              accessToken:      page.access_token, // IG Graph API uses the linked Page's token
              accountType:      'business',
              isActive:         true,
              lastSync:         new Date(),
              metadata:         { linkedFacebookPageId: page.id, linkedFacebookPageName: page.name },
            },
            { upsert: true, new: true }
          );
          igCount++;
        }
      }
      logger.info(`FB connected for user ${userId}: ${pagesCount} pages, ${igCount} IG business accounts`);
    } catch (pagesErr) {
      // Page enumeration failed (likely missing permission). Log and continue —
      // the personal connection is already saved.
      logger.warn(`FB pages enum failed: ${pagesErr.response?.data?.error?.message || pagesErr.message}`);
    }

    return res.redirect(`${process.env.CLIENT_URL}/accounts?connected=facebook&pages=${pagesCount}&ig=${igCount}`);

  } catch (e) {
    const fbErr = e.response?.data?.error;
    const detail = fbErr?.message || fbErr?.error_user_msg || e.message;
    logger.error(`FB callback failed for user ${userId}: ${detail}`);
    return res.redirect(`${process.env.CLIENT_URL}/accounts?error=fb&msg=${encodeURIComponent(detail.slice(0, 200))}`);
  }
});

// ── ADS ROUTES ──
const adsRouter    = express.Router();
const adsService   = require('../services/ads/ads.service');
const { AdCampaign } = require('../models');
// requirePlan + authorize are imported at top of file

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
