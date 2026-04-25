const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const inboxService = require('../services/inbox/inbox.service');
const { SocialAccount } = require('../models');

router.get('/', protect, async (req, res) => {
  try {
    const { type, platform } = req.query;
    let items = await inboxService.getAllInboxItems(req.user._id);
    if (type)     items = items.filter(i => i.type     === type);
    if (platform) items = items.filter(i => i.platform === platform);
    res.json({ success: true, items, total: items.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/reply', protect, async (req, res) => {
  try {
    const { itemId, itemType, platform, message, recipientId, conversationId, tweetId, postId, accountId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const account = await SocialAccount.findOne({ _id: accountId, user: req.user._id }).select('+accessToken');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    let result;
    const t = account.accessToken;

    if (platform === 'facebook' && itemType === 'comment')  result = await inboxService.replyToFacebookComment(itemId, message, t);
    if (platform === 'facebook' && itemType === 'message')  result = await inboxService.replyToFacebookMessage(recipientId, message, account.platformUserId, t);
    if (platform === 'instagram' && itemType === 'comment') result = await inboxService.replyToInstagramComment(itemId, message, t);
    if (platform === 'instagram' && itemType === 'message') result = await inboxService.replyToFacebookMessage(recipientId, message, account.platformUserId, t);
    if (platform === 'twitter' && itemType === 'comment')   result = await inboxService.replyToTwitterTweet(tweetId || itemId, message, t);
    if (platform === 'twitter' && itemType === 'message')   result = await inboxService.replyToTwitterDM(conversationId || itemId, message, t);
    if (platform === 'linkedin' && itemType === 'message')  result = await inboxService.replyToLinkedInMessage(conversationId || itemId, message, t);
    if (platform === 'linkedin' && itemType === 'comment')  result = await inboxService.replyToLinkedInComment(itemId, postId, message, t);

    res.json({ success: true, message: '✅ Reply sent!', result });
  } catch (e) { res.status(500).json({ success: false, message: e.response?.data?.error?.message || e.message }); }
});

router.post('/comment/hide', protect, async (req, res) => {
  try {
    const { commentId, hide = true, accountId } = req.body;
    const account = await SocialAccount.findOne({ _id: accountId, user: req.user._id }).select('+accessToken');
    if (!account) return res.status(404).json({ success: false, message: 'Not found' });
    await inboxService.hideComment(commentId, account.accessToken, hide);
    res.json({ success: true, message: hide ? 'Comment hidden' : 'Comment visible' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/comment/like', protect, async (req, res) => {
  try {
    const { commentId, accountId } = req.body;
    const account = await SocialAccount.findOne({ _id: accountId, user: req.user._id }).select('+accessToken');
    if (!account) return res.status(404).json({ success: false, message: 'Not found' });
    await inboxService.likeComment(commentId, account.accessToken);
    res.json({ success: true, message: '❤️ Liked!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
