const axios  = require('axios');
const { SocialAccount } = require('../../models');
const logger = require('../../utils/logger');
const META   = 'https://graph.facebook.com/v18.0';

class InboxService {

  async getFacebookMessages(account) {
    try {
      const res = await axios.get(`${META}/${account.platformUserId}/conversations`, { params: { fields: 'participants,messages{message,from,created_time}', access_token: account.accessToken, limit: 20 } });
      return (res.data?.data || []).map(conv => ({ id: conv.id, platform: 'facebook', type: 'message', participants: conv.participants?.data || [], messages: (conv.messages?.data || []).map(m => ({ text: m.message, from: m.from, created_time: m.created_time, isOwn: m.from?.id === account.platformUserId })), latestMsg: conv.messages?.data?.[0]?.message || '', latestTime: conv.messages?.data?.[0]?.created_time, from: { name: conv.participants?.data?.find(p => p.id !== account.platformUserId)?.name || 'Unknown' }, accountId: account._id, unread: true }));
    } catch (e) { logger.warn(`FB msg: ${e.message}`); return []; }
  }

  async getFacebookComments(account) {
    try {
      const res = await axios.get(`${META}/${account.platformUserId}/posts`, { params: { fields: 'message,created_time,comments{message,from,created_time,id}', access_token: account.accessToken, limit: 10 } });
      const comments = [];
      (res.data?.data || []).forEach(post => { (post.comments?.data || []).forEach(c => { comments.push({ id: c.id, platform: 'facebook', type: 'comment', postId: post.id, postText: post.message?.slice(0,60) || 'Post', message: c.message, from: { name: c.from?.name || 'Unknown', id: c.from?.id }, createdTime: c.created_time, accountId: account._id, unread: true }); }); });
      return comments;
    } catch (e) { logger.warn(`FB comments: ${e.message}`); return []; }
  }

  async getInstagramComments(account) {
    try {
      const res = await axios.get(`${META}/${account.platformUserId}/media`, { params: { fields: 'caption,timestamp,comments{text,username,timestamp,id}', access_token: account.accessToken, limit: 10 } });
      const comments = [];
      (res.data?.data || []).forEach(post => { (post.comments?.data || []).forEach(c => { comments.push({ id: c.id, platform: 'instagram', type: 'comment', postId: post.id, postText: post.caption?.slice(0,60) || 'Instagram Post', message: c.text, from: { name: c.username || 'Unknown', username: c.username }, createdTime: c.timestamp, accountId: account._id, unread: true }); }); });
      return comments;
    } catch (e) { logger.warn(`IG comments: ${e.message}`); return []; }
  }

  async getInstagramMessages(account) {
    try {
      const res = await axios.get(`${META}/${account.platformUserId}/conversations`, { params: { fields: 'participants,messages{text,from,timestamp}', platform: 'instagram', access_token: account.accessToken, limit: 20 } });
      return (res.data?.data || []).map(conv => ({ id: conv.id, platform: 'instagram', type: 'message', participants: conv.participants?.data || [], messages: (conv.messages?.data || []).map(m => ({ text: m.text, from: m.from, created_time: m.timestamp, isOwn: m.from?.id === account.platformUserId })), latestMsg: conv.messages?.data?.[0]?.text || '', latestTime: conv.messages?.data?.[0]?.timestamp, from: { name: conv.participants?.data?.find(p => p.id !== account.platformUserId)?.name || 'Unknown' }, accountId: account._id, unread: true }));
    } catch (e) { logger.warn(`IG DMs: ${e.message}`); return []; }
  }

  async getTwitterDMs(account) {
    try {
      const res = await axios.get('https://api.twitter.com/2/dm_conversations', { params: { 'dm_event.fields': 'text,created_at,sender_id', expansions: 'sender_id', 'user.fields': 'name,username', max_results: 20 }, headers: { Authorization: `Bearer ${account.accessToken}` } });
      return (res.data?.data || []).map(conv => ({ id: conv.id, platform: 'twitter', type: 'message', latestMsg: conv.dm_events?.[0]?.text || '', latestTime: conv.dm_events?.[0]?.created_at, from: { name: 'Twitter User' }, messages: (conv.dm_events || []).map(e => ({ text: e.text, created_time: e.created_at, isOwn: e.sender_id === account.platformUserId })), accountId: account._id, unread: true }));
    } catch (e) { logger.warn(`Twitter DMs: ${e.message}`); return []; }
  }

  async getTwitterMentions(account) {
    try {
      const res = await axios.get(`https://api.twitter.com/2/users/${account.platformUserId}/mentions`, { params: { 'tweet.fields': 'text,created_at,author_id', expansions: 'author_id', 'user.fields': 'name,username', max_results: 20 }, headers: { Authorization: `Bearer ${account.accessToken}` } });
      const users = res.data?.includes?.users || [];
      return (res.data?.data || []).map(tweet => { const a = users.find(u => u.id === tweet.author_id); return { id: tweet.id, platform: 'twitter', type: 'comment', message: tweet.text, postText: 'Your tweet', from: { name: a?.name || 'Twitter User', username: a?.username }, createdTime: tweet.created_at, tweetId: tweet.id, accountId: account._id, unread: true }; });
    } catch (e) { logger.warn(`Twitter mentions: ${e.message}`); return []; }
  }

  async getLinkedInMessages(account) {
    try {
      const res = await axios.get('https://api.linkedin.com/v2/conversations', { params: { keyVersion: 'LEGACY_INBOX', q: 'participant' }, headers: { Authorization: `Bearer ${account.accessToken}` } });
      return (res.data?.elements || []).map(conv => ({ id: conv.entityUrn || conv.id, platform: 'linkedin', type: 'message', latestMsg: conv.events?.[0]?.eventContent?.messageEvent?.body || '', latestTime: conv.lastActivityAt ? new Date(conv.lastActivityAt).toISOString() : null, from: { name: 'LinkedIn User' }, messages: (conv.events || []).map(e => ({ text: e.eventContent?.messageEvent?.body || '', created_time: new Date(e.createdAt || Date.now()).toISOString(), isOwn: false })), accountId: account._id, unread: (conv.unreadCount || 0) > 0 }));
    } catch (e) { logger.warn(`LinkedIn msg: ${e.message}`); return []; }
  }

  async getLinkedInComments(account) {
    try {
      const postsRes = await axios.get(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A${account.platformUserId})`, { headers: { Authorization: `Bearer ${account.accessToken}` } });
      const comments = [];
      for (const post of (postsRes.data?.elements || []).slice(0, 5)) {
        try {
          const commRes = await axios.get(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(post.id)}/comments`, { headers: { Authorization: `Bearer ${account.accessToken}` } });
          (commRes.data?.elements || []).forEach(c => { comments.push({ id: c.id, platform: 'linkedin', type: 'comment', postId: post.id, postText: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text?.slice(0,60) || 'LinkedIn Post', message: c.message?.text || '', from: { name: 'LinkedIn User' }, createdTime: new Date(c.created?.time || Date.now()).toISOString(), accountId: account._id, unread: true }); });
        } catch {}
      }
      return comments;
    } catch (e) { logger.warn(`LinkedIn comments: ${e.message}`); return []; }
  }

  async replyToFacebookComment(id, msg, token)  { const r = await axios.post(`${META}/${id}/comments`, { message: msg }, { params: { access_token: token } }); return r.data; }
  async replyToInstagramComment(id, msg, token) { const r = await axios.post(`${META}/${id}/replies`,  { message: msg }, { params: { access_token: token } }); return r.data; }
  async replyToFacebookMessage(recipId, msg, pageId, token) { const r = await axios.post(`${META}/${pageId}/messages`, { recipient: { id: recipId }, message: { text: msg } }, { params: { access_token: token } }); return r.data; }
  async replyToTwitterTweet(tweetId, msg, token) { const r = await axios.post('https://api.twitter.com/2/tweets', { text: msg, reply: { in_reply_to_tweet_id: tweetId } }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }); return r.data; }
  async replyToTwitterDM(convId, msg, token)    { const r = await axios.post(`https://api.twitter.com/2/dm_conversations/${convId}/messages`, { text: msg }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }); return r.data; }
  async replyToLinkedInMessage(convId, msg, token) { const r = await axios.post('https://api.linkedin.com/v2/messages', { recipients: [convId], subject: 'Reply', body: msg }, { headers: { Authorization: `Bearer ${token}` } }); return r.data; }
  async replyToLinkedInComment(commentId, postId, msg, token) { const r = await axios.post(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}/comments`, { message: { text: msg }, object: postId }, { headers: { Authorization: `Bearer ${token}` } }); return r.data; }
  async hideComment(id, token, hide = true)  { try { await axios.post(`${META}/${id}`, { is_hidden: hide }, { params: { access_token: token } }); } catch {} }
  async likeComment(id, token)               { try { await axios.post(`${META}/${id}/likes`, {}, { params: { access_token: token } }); } catch {} }

  async getAllInboxItems(userId) {
    const accounts = await SocialAccount.find({ user: userId, isActive: true }).select('+accessToken');
    const all = [];
    for (const acc of accounts) {
      const results = await Promise.allSettled([
        acc.platform === 'facebook'  ? this.getFacebookMessages(acc)  : [],
        acc.platform === 'facebook'  ? this.getFacebookComments(acc)  : [],
        acc.platform === 'instagram' ? this.getInstagramComments(acc) : [],
        acc.platform === 'instagram' ? this.getInstagramMessages(acc) : [],
        acc.platform === 'twitter'   ? this.getTwitterDMs(acc)        : [],
        acc.platform === 'twitter'   ? this.getTwitterMentions(acc)   : [],
        acc.platform === 'linkedin'  ? this.getLinkedInMessages(acc)  : [],
        acc.platform === 'linkedin'  ? this.getLinkedInComments(acc)  : [],
      ]);
      results.forEach(r => { if (r.status === 'fulfilled') all.push(...(r.value || [])); });
    }
    return all.sort((a, b) => new Date(b.latestTime || b.createdTime || 0) - new Date(a.latestTime || a.createdTime || 0));
  }
}

module.exports = new InboxService();
