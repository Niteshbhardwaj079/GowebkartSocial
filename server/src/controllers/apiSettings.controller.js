const UserApiSettings = require('../models/UserApiSettings.model');
const { SocialAccount } = require('../models');
const axios = require('axios');
const logger = require('../utils/logger');

// ✅ GET - User ki API settings dekho (keys hidden rahegi)
exports.getSettings = async (req, res) => {
  try {
    const settings = await UserApiSettings.findOne({ user: req.user._id });

    if (!settings) {
      return res.json({
        success: true,
        settings: {
          facebook:  { isConfigured: false },
          twitter:   { isConfigured: false },
          linkedin:  { isConfigured: false },
          youtube:   { isConfigured: false },
        }
      });
    }

    // Keys mat bhejo — sirf isConfigured bhejo
    res.json({
      success: true,
      settings: {
        facebook:  { isConfigured: settings.facebook?.isConfigured || false, configuredAt: settings.facebook?.configuredAt },
        twitter:   { isConfigured: settings.twitter?.isConfigured  || false, configuredAt: settings.twitter?.configuredAt  },
        linkedin:  { isConfigured: settings.linkedin?.isConfigured || false, configuredAt: settings.linkedin?.configuredAt },
        youtube:   { isConfigured: settings.youtube?.isConfigured  || false, configuredAt: settings.youtube?.configuredAt  },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SAVE Facebook API Keys
exports.saveFacebookKeys = async (req, res) => {
  try {
    const { appId, appSecret } = req.body;

    if (!appId || !appSecret) {
      return res.status(400).json({ success: false, message: 'App ID and App Secret required' });
    }

    // Pehle test karo ki keys sahi hain
    try {
      const testRes = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          access_token: `${appId}|${appSecret}`,
          fields: 'id'
        }
      });
    } catch (testErr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook App ID or Secret. Please check and try again.'
      });
    }

    await UserApiSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        company: req.user.company?._id,
        'facebook.appId': appId,
        'facebook.appSecret': appSecret,
        'facebook.isConfigured': true,
        'facebook.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );

    logger.info(`Facebook API configured for user ${req.user._id}`);
    res.json({ success: true, message: '✅ Facebook API keys saved! Now you can connect your account.' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SAVE Twitter API Keys
exports.saveTwitterKeys = async (req, res) => {
  try {
    const { apiKey, apiSecret, bearerToken } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: 'API Key and Secret required' });
    }

    await UserApiSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        company: req.user.company?._id,
        'twitter.apiKey': apiKey,
        'twitter.apiSecret': apiSecret,
        'twitter.bearerToken': bearerToken || '',
        'twitter.isConfigured': true,
        'twitter.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '✅ Twitter API keys saved!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SAVE LinkedIn API Keys
exports.saveLinkedInKeys = async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ success: false, message: 'Client ID and Secret required' });
    }

    await UserApiSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        company: req.user.company?._id,
        'linkedin.clientId': clientId,
        'linkedin.clientSecret': clientSecret,
        'linkedin.isConfigured': true,
        'linkedin.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '✅ LinkedIn API keys saved!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SAVE YouTube API Keys
exports.saveYouTubeKeys = async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ success: false, message: 'Client ID and Secret required' });
    }

    await UserApiSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        company: req.user.company?._id,
        'youtube.clientId': clientId,
        'youtube.clientSecret': clientSecret,
        'youtube.isConfigured': true,
        'youtube.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '✅ YouTube API keys saved!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE / Reset a platform's keys
exports.deleteKeys = async (req, res) => {
  try {
    const { platform } = req.params;
    const allowed = ['facebook', 'twitter', 'linkedin', 'youtube'];

    if (!allowed.includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    const updateObj = {
      [`${platform}.appId`]:        undefined,
      [`${platform}.appSecret`]:    undefined,
      [`${platform}.apiKey`]:       undefined,
      [`${platform}.apiSecret`]:    undefined,
      [`${platform}.clientId`]:     undefined,
      [`${platform}.clientSecret`]: undefined,
      [`${platform}.isConfigured`]: false,
    };

    await UserApiSettings.findOneAndUpdate({ user: req.user._id }, { $unset: updateObj });

    // Connected accounts bhi remove karo
    await SocialAccount.updateMany(
      { user: req.user._id, platform },
      { isActive: false }
    );

    res.json({ success: true, message: `${platform} API keys removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CONNECT - User ki API se OAuth URL banao
exports.getOAuthUrl = async (req, res) => {
  try {
    const { platform } = req.params;

    // User ki apni API settings lo
    const settings = await UserApiSettings.findOne({ user: req.user._id })
      .select('+facebook.appId +facebook.appSecret +twitter.apiKey +linkedin.clientId +linkedin.clientSecret');

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: `Please add your ${platform} API keys first`
      });
    }

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const userId    = req.user._id.toString();
    let url = '';

    if (platform === 'facebook') {
      if (!settings.facebook?.isConfigured) {
        return res.status(400).json({ success: false, message: 'Add Facebook API keys first' });
      }
      const params = new URLSearchParams({
        client_id:    settings.facebook.appId,
        redirect_uri: `${serverUrl}/api/social/callback/facebook`,
        scope:        'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
        state:        userId
      });
      url = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
    }

    else if (platform === 'twitter') {
      if (!settings.twitter?.isConfigured) {
        return res.status(400).json({ success: false, message: 'Add Twitter API keys first' });
      }
      const params = new URLSearchParams({
        response_type: 'code',
        client_id:     settings.twitter.apiKey,
        redirect_uri:  `${serverUrl}/api/social/callback/twitter`,
        scope:         'tweet.read tweet.write users.read offline.access',
        state:         userId,
        code_challenge: 'challenge',
        code_challenge_method: 'plain'
      });
      url = `https://twitter.com/i/oauth2/authorize?${params}`;
    }

    else if (platform === 'linkedin') {
      if (!settings.linkedin?.isConfigured) {
        return res.status(400).json({ success: false, message: 'Add LinkedIn API keys first' });
      }
      const params = new URLSearchParams({
        response_type: 'code',
        client_id:     settings.linkedin.clientId,
        redirect_uri:  `${serverUrl}/api/social/callback/linkedin`,
        scope:         'r_liteprofile r_emailaddress w_member_social',
        state:         userId
      });
      url = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
    }

    if (!url) {
      return res.status(400).json({ success: false, message: 'Platform not supported yet' });
    }

    res.json({ success: true, url });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
