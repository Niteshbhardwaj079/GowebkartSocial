// ════════════════════════════════════════════
// SOCIAL MEDIA CREDENTIALS — single source
// ════════════════════════════════════════════
//
// All FB / LinkedIn / Twitter OAuth uses these values. There is NO per-user
// override anywhere — one platform-wide app, one set of credentials.
//
// Recommended: keep secrets in Render env vars (encrypted at rest, masked
// in logs). The code below falls back to hardcoded constants below the env
// lookups — uncomment and paste the values there if you'd rather not use
// env vars. The App ID is technically public (it's in every OAuth URL),
// the Secret/Client Secret must NEVER end up in a public git history.

const config = {
  facebook: {
    // App ID is fine to hardcode here if you want — it's public in OAuth URLs.
    appId:     process.env.FACEBOOK_APP_ID     || '',
    // App Secret should stay in Render env, NOT here.
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    scopes:    'public_profile,email,pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management',
  },

  linkedin: {
    clientId:     process.env.LINKEDIN_CLIENT_ID     || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    // OIDC scopes — work with the modern "Sign In with LinkedIn using OpenID Connect"
    // + "Share on LinkedIn" products. Do NOT use r_liteprofile (partner-restricted).
    scopes:       'openid profile email w_member_social',
  },

  twitter: {
    clientId:     process.env.TWITTER_API_KEY    || '',
    clientSecret: process.env.TWITTER_API_SECRET || '',
    scopes:       'tweet.read tweet.write users.read offline.access',
  },
};

config.isConfigured = function (platform) {
  const c = this[platform];
  if (!c) return false;
  if (platform === 'facebook') return !!(c.appId && c.appSecret);
  return !!(c.clientId && c.clientSecret);
};

module.exports = config;
