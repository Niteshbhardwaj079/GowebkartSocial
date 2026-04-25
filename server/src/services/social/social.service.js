const axios = require('axios');
const logger = require('../../utils/logger');

class SocialService {

  // Main function — platform ke hisaab se post karo
  async publishToPlatform(platform, account, post) {
    const handlers = {
      facebook:  () => this.publishToFacebook(account, post),
      instagram: () => this.publishToInstagram(account, post),
      twitter:   () => this.publishToTwitter(account, post),
      linkedin:  () => this.publishToLinkedIn(account, post),
      youtube:   () => this.publishToYouTube(account, post),
    };

    const handler = handlers[platform];
    if (!handler) throw new Error(`Platform '${platform}' not supported yet`);

    logger.info(`Publishing to ${platform} for account ${account._id}`);
    return await handler();
  }

  // ─────────────────────────────────────────
  // FACEBOOK
  // ─────────────────────────────────────────
  async publishToFacebook(account, post) {
    try {
      const text  = post.platformContent?.facebook?.text || post.content?.text || '';
      const media = post.content?.media || [];
      const token = account.accessToken;
      const pageId = account.platformUserId;

      let response;

      if (media.length > 0 && media[0].type === 'video') {
        response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/videos`,
          { file_url: media[0].url, description: text, access_token: token }
        );
      } else if (media.length > 0 && media[0].type === 'image') {
        response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/photos`,
          { url: media[0].url, caption: text, access_token: token }
        );
      } else {
        response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/feed`,
          { message: text, access_token: token }
        );
      }

      return { postId: response.data.id, platform: 'facebook' };

    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Facebook: ${msg}`);
    }
  }

  // ─────────────────────────────────────────
  // INSTAGRAM
  // ─────────────────────────────────────────
  async publishToInstagram(account, post) {
    try {
      const text     = post.platformContent?.instagram?.text || post.content?.text || '';
      const media    = post.content?.media || [];
      const postType = post.platformContent?.instagram?.type || 'post';
      const token    = account.accessToken;
      const igId     = account.platformUserId;

      if (!media.length) throw new Error('Instagram requires at least one image or video');

      let containerId;

      if (postType === 'reel' || (media[0]?.type === 'video')) {
        const res = await axios.post(
          `https://graph.facebook.com/v18.0/${igId}/media`,
          { video_url: media[0].url, caption: text, media_type: 'REELS', access_token: token }
        );
        containerId = res.data.id;
        await this._waitForIG(containerId, token);

      } else if (media.length > 1) {
        // Carousel (multiple images)
        const childIds = [];
        for (const m of media) {
          const r = await axios.post(
            `https://graph.facebook.com/v18.0/${igId}/media`,
            { image_url: m.url, is_carousel_item: true, access_token: token }
          );
          childIds.push(r.data.id);
        }
        const res = await axios.post(
          `https://graph.facebook.com/v18.0/${igId}/media`,
          { media_type: 'CAROUSEL', caption: text, children: childIds.join(','), access_token: token }
        );
        containerId = res.data.id;

      } else {
        const res = await axios.post(
          `https://graph.facebook.com/v18.0/${igId}/media`,
          { image_url: media[0].url, caption: text, access_token: token }
        );
        containerId = res.data.id;
      }

      // Final publish
      const pub = await axios.post(
        `https://graph.facebook.com/v18.0/${igId}/media_publish`,
        { creation_id: containerId, access_token: token }
      );

      return { postId: pub.data.id, platform: 'instagram' };

    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Instagram: ${msg}`);
    }
  }

  // Instagram video processing wait
  async _waitForIG(containerId, token, tries = 12) {
    for (let i = 0; i < tries; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await axios.get(
        `https://graph.facebook.com/v18.0/${containerId}`,
        { params: { fields: 'status_code', access_token: token } }
      );
      if (res.data.status_code === 'FINISHED') return;
      if (res.data.status_code === 'ERROR') throw new Error('Instagram video processing failed');
    }
    throw new Error('Instagram processing timeout');
  }

  // ─────────────────────────────────────────
  // TWITTER (X)
  // ─────────────────────────────────────────
  async publishToTwitter(account, post) {
    try {
      const text = post.platformContent?.twitter?.text || post.content?.text || '';

      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        { text: text.substring(0, 280) },
        {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { postId: response.data.data.id, platform: 'twitter' };

    } catch (error) {
      const msg = error.response?.data?.detail || error.message;
      throw new Error(`Twitter: ${msg}`);
    }
  }

  // ─────────────────────────────────────────
  // LINKEDIN
  // ─────────────────────────────────────────
  async publishToLinkedIn(account, post) {
    try {
      const text  = post.platformContent?.linkedin?.text || post.content?.text || '';
      const media = post.content?.media || [];

      const body = {
        author: `urn:li:person:${account.platformUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE',
            ...(media.length > 0 && {
              media: [{ status: 'READY', originalUrl: media[0].url }]
            })
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        body,
        {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { postId: response.headers['x-restli-id'], platform: 'linkedin' };

    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      throw new Error(`LinkedIn: ${msg}`);
    }
  }

  // ─────────────────────────────────────────
  // YOUTUBE
  // ─────────────────────────────────────────
  async publishToYouTube(account, post) {
    try {
      const ytContent = post.platformContent?.youtube || {};
      const media     = post.content?.media || [];

      if (!media.length || media[0]?.type !== 'video') {
        throw new Error('YouTube requires a video');
      }

      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos',
        {
          snippet: {
            title:       ytContent.title || 'New Video',
            description: ytContent.description || post.content?.text || '',
            tags:        ytContent.tags || []
          },
          status: { privacyStatus: 'public' }
        },
        {
          headers: { 'Authorization': `Bearer ${account.accessToken}` },
          params:  { part: 'snippet,status', uploadType: 'resumable' }
        }
      );

      return { postId: response.data.id, platform: 'youtube' };

    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`YouTube: ${msg}`);
    }
  }
}

module.exports = new SocialService();
