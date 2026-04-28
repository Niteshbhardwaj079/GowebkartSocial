const StorageSettings = require('../models/StorageSettings.model');
const storageService  = require('../services/storage/storage.service');
const storageConfig   = require('../config/storage');
const logger          = require('../utils/logger');

// ✅ GET storage settings (keys hidden)
exports.getSettings = async (req, res) => {
  try {
    let settings = await StorageSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await StorageSettings.create({ user: req.user._id, company: req.user.company?._id });
    }

    // Keys mat bhejo — sirf isConfigured aur provider info bhejo
    res.json({
      success: true,
      settings: {
        activeProvider: settings.activeProvider,
        stats:          settings.stats,
        cloudinary:  { isConfigured: settings.cloudinary?.isConfigured || false,  configuredAt: settings.cloudinary?.configuredAt,  folder: settings.cloudinary?.folder },
        aws_s3:      { isConfigured: settings.aws_s3?.isConfigured     || false,  configuredAt: settings.aws_s3?.configuredAt,      folder: settings.aws_s3?.folder, region: settings.aws_s3?.region },
        imagekit:    { isConfigured: settings.imagekit?.isConfigured   || false,  configuredAt: settings.imagekit?.configuredAt,    folder: settings.imagekit?.folder, urlEndpoint: settings.imagekit?.urlEndpoint },
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// If user is still on default 'local' or has no active provider, promote
// the just-saved provider to active. Saves the user a click and prevents
// the "Storage configure nahi hai" error on the next upload.
async function autoActivateIfNoActive(userId, provider) {
  const cur = await StorageSettings.findOne({ user: userId }).select('activeProvider');
  if (!cur || !cur.activeProvider || cur.activeProvider === 'local') {
    await StorageSettings.findOneAndUpdate({ user: userId }, { activeProvider: provider });
    return true;
  }
  return false;
}

// ✅ SAVE Cloudinary keys
exports.saveCloudinary = async (req, res) => {
  try {
    const { cloudName, apiKey, apiSecret, folder } = req.body;
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: 'Cloud Name, API Key aur API Secret zaroori hain' });
    }

    // Test connection
    const test = await storageService.testConnection('cloudinary', { cloudName, apiKey, apiSecret });
    if (!test.success) {
      return res.status(400).json({ success: false, message: `Invalid keys: ${test.message}` });
    }

    await StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id, company: req.user.company?._id,
        'cloudinary.cloudName':    cloudName,
        'cloudinary.apiKey':       apiKey,
        'cloudinary.apiSecret':    apiSecret,
        'cloudinary.folder':       folder || 'social-saas',
        'cloudinary.isConfigured': true,
        'cloudinary.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );
    const activated = await autoActivateIfNoActive(req.user._id, 'cloudinary');

    logger.info(`Cloudinary configured for user ${req.user._id}${activated ? ' (auto-activated)' : ''}`);
    res.json({ success: true, message: activated ? '✅ Cloudinary connected & set as active storage!' : '✅ Cloudinary connected!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ SAVE AWS S3 keys
exports.saveS3 = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName, folder } = req.body;
    if (!accessKeyId || !secretAccessKey || !bucketName) {
      return res.status(400).json({ success: false, message: 'Access Key ID, Secret Access Key aur Bucket Name zaroori hain' });
    }

    // Test connection
    const test = await storageService.testConnection('aws_s3', { accessKeyId, secretAccessKey, region: region || 'ap-south-1', bucketName });
    if (!test.success) {
      return res.status(400).json({ success: false, message: `S3 connection failed: ${test.message}` });
    }

    await StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id, company: req.user.company?._id,
        'aws_s3.accessKeyId':     accessKeyId,
        'aws_s3.secretAccessKey': secretAccessKey,
        'aws_s3.region':          region || 'ap-south-1',
        'aws_s3.bucketName':      bucketName,
        'aws_s3.folder':          folder || 'social-saas',
        'aws_s3.isConfigured':    true,
        'aws_s3.configuredAt':    new Date()
      },
      { upsert: true, new: true }
    );

    const activated = await autoActivateIfNoActive(req.user._id, 'aws_s3');
    logger.info(`AWS S3 configured for user ${req.user._id}${activated ? ' (auto-activated)' : ''}`);
    res.json({ success: true, message: activated ? '✅ AWS S3 connected & set as active storage!' : '✅ AWS S3 connected!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ SAVE ImageKit keys
exports.saveImageKit = async (req, res) => {
  try {
    const { publicKey, privateKey, urlEndpoint, folder } = req.body;
    if (!publicKey || !privateKey || !urlEndpoint) {
      return res.status(400).json({ success: false, message: 'Public Key, Private Key aur URL Endpoint zaroori hain' });
    }

    // Test connection
    const test = await storageService.testConnection('imagekit', { publicKey, privateKey, urlEndpoint });
    if (!test.success) {
      return res.status(400).json({ success: false, message: `ImageKit connection failed: ${test.message}` });
    }

    await StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id, company: req.user.company?._id,
        'imagekit.publicKey':    publicKey,
        'imagekit.privateKey':   privateKey,
        'imagekit.urlEndpoint':  urlEndpoint,
        'imagekit.folder':       folder || 'social-saas',
        'imagekit.isConfigured': true,
        'imagekit.configuredAt': new Date()
      },
      { upsert: true, new: true }
    );

    const activated = await autoActivateIfNoActive(req.user._id, 'imagekit');
    logger.info(`ImageKit configured for user ${req.user._id}${activated ? ' (auto-activated)' : ''}`);
    res.json({ success: true, message: activated ? '✅ ImageKit connected & set as active storage!' : '✅ ImageKit connected!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ SET ACTIVE PROVIDER — kaunsa use karna hai
exports.setActiveProvider = async (req, res) => {
  try {
    const { provider } = req.body;
    const allowed = ['cloudinary', 'aws_s3', 'imagekit'];

    if (!allowed.includes(provider)) {
      return res.status(400).json({ success: false, message: 'Invalid provider' });
    }

    // Check karo ki provider configured hai
    const settings = await StorageSettings.findOne({ user: req.user._id }).select(
      '+cloudinary.isConfigured +aws_s3.isConfigured +imagekit.isConfigured'
    );

    if (!settings?.[provider]?.isConfigured) {
      return res.status(400).json({
        success: false,
        message: `${provider} configure nahi hai. Pehle keys save karein.`
      });
    }

    await StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      { activeProvider: provider }
    );

    const providerNames = { cloudinary:'Cloudinary', aws_s3:'AWS S3', imagekit:'ImageKit' };
    res.json({ success: true, message: `✅ ${providerNames[provider]} ab active storage hai!` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ TEST CONNECTION — keys sahi hain?
exports.testConnection = async (req, res) => {
  try {
    const { provider } = req.params;
    const settings = await StorageSettings.findOne({ user: req.user._id }).select(
      '+cloudinary.cloudName +cloudinary.apiKey +cloudinary.apiSecret ' +
      '+aws_s3.accessKeyId +aws_s3.secretAccessKey +aws_s3.region +aws_s3.bucketName ' +
      '+imagekit.publicKey +imagekit.privateKey +imagekit.urlEndpoint'
    );

    if (!settings?.[provider]?.isConfigured) {
      return res.status(400).json({ success: false, message: 'Provider configured nahi hai' });
    }

    const config = settings[provider];
    const result = await storageService.testConnection(provider, config);

    res.json(result);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ REMOVE a provider's keys
exports.removeProvider = async (req, res) => {
  try {
    const { provider } = req.params;
    const updateObj = {};
    updateObj[`${provider}.isConfigured`] = false;

    const settings = await StorageSettings.findOne({ user: req.user._id });

    // Agar active provider remove ho raha hai
    if (settings?.activeProvider === provider) {
      updateObj.activeProvider = 'local';
    }

    await StorageSettings.findOneAndUpdate({ user: req.user._id }, { $set: updateObj, $unset: { [provider]: 1 } });

    res.json({ success: true, message: `${provider} keys removed` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ UPLOAD FILE — single platform-wide Cloudinary (config-driven)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.files?.length && !req.file) {
      return res.status(400).json({ success: false, message: 'Koi file upload nahi ki' });
    }
    if (!storageConfig.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configure nahi hai. Server admin se contact karein (CLOUDINARY_API_SECRET env var missing).',
      });
    }

    const files = req.files || [req.file];
    const cfg   = storageConfig.cloudinary;
    // Per-company sub-folder so different companies' assets don't collide.
    const subFolder = req.user.isDemo
      ? `${cfg.folder}/demo`
      : `${cfg.folder}/${req.user.company?._id || req.user.company || req.user._id}`;

    const results = [];
    for (const file of files) {
      const result = await storageService.upload(file.buffer, file.mimetype, {
        provider: 'cloudinary',
        config:   { cloudName: cfg.cloudName, apiKey: cfg.apiKey, apiSecret: cfg.apiSecret },
        folder:   subFolder,
      });
      results.push(result);
    }

    // Best-effort stats — never block the response if it fails.
    StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        $setOnInsert: { user: req.user._id, company: req.user.company?._id, activeProvider: 'cloudinary' },
        $inc: { 'stats.totalUploads': results.length, 'stats.totalSize': results.reduce((s,r) => s + (r.size||0), 0) },
        'stats.lastUploadAt': new Date(),
      },
      { upsert: true }
    ).catch(() => {});

    res.json({ success: true, files: results, provider: 'cloudinary' });
  } catch (e) {
    logger.error(`Upload error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
};