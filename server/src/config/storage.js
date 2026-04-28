// ════════════════════════════════════════════
// STORAGE — single source (Cloudinary)
// ════════════════════════════════════════════
//
// Multi-tenant per-user storage settings UI was removed. Now there's one
// platform-wide Cloudinary account that every upload goes through.
//
// Cloud name + API key are public-ish (visible in the upload URL); they're
// hardcoded below so a fresh deploy works out of the box. API secret MUST
// stay in Render env (not in source) — it's the auth credential.

const config = {
  cloudinary: {
    // Hardcoded defaults — clone-and-deploy safe values for this brand.
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dcygtxbns',
    apiKey:    process.env.CLOUDINARY_API_KEY    || '374359673631549',
    // Secret must come from env. If empty, uploads fail loudly.
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder:    process.env.CLOUDINARY_FOLDER     || 'gowebkart-social',
  },
};

config.isConfigured = function () {
  const c = this.cloudinary;
  return !!(c.cloudName && c.apiKey && c.apiSecret);
};

module.exports = config;
