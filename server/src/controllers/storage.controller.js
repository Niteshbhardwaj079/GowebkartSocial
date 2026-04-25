const StorageSettings = require('../models/StorageSettings.model');
const storageService  = require('../services/storage/storage.service');
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

    logger.info(`Cloudinary configured for user ${req.user._id}`);
    res.json({ success: true, message: '✅ Cloudinary connected! Ab images/videos upload ho sakti hain.' });
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

    logger.info(`AWS S3 configured for user ${req.user._id}`);
    res.json({ success: true, message: '✅ AWS S3 connected! Files aapke bucket mein store hongi.' });
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

    logger.info(`ImageKit configured for user ${req.user._id}`);
    res.json({ success: true, message: '✅ ImageKit connected!' });
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

// ✅ UPLOAD FILE using user's configured storage
exports.uploadFile = async (req, res) => {
  try {
    if (!req.files?.length && !req.file) {
      return res.status(400).json({ success: false, message: 'Koi file upload nahi ki' });
    }

    const files = req.files || [req.file];

    // ── DEMO USER → Server ki apni Cloudinary use karo ──
    if (req.user.isDemo) {
      const cloudinary = require('../config/cloudinary');
      const results = [];
      for (const file of files) {
        const result = await new Promise((resolve, reject) => {
          const isVideo = file.mimetype.startsWith('video/');
          const stream  = cloudinary.uploader.upload_stream(
            { folder: 'social-saas/demo', resource_type: isVideo ? 'video' : 'image' },
            (err, res) => err ? reject(err) : resolve({
              url: res.secure_url, publicId: res.public_id,
              type: isVideo ? 'video' : 'image', thumbnail: res.secure_url,
              size: res.bytes, provider: 'cloudinary'
            })
          );
          stream.end(file.buffer);
        });
        results.push(result);
      }
      return res.json({ success: true, files: results, provider: 'cloudinary', isDemo: true });
    }

    // ── REAL USER → Unki apni storage settings use karo ──
    const settings = await StorageSettings.findOne({ user: req.user._id }).select(
      '+cloudinary.cloudName +cloudinary.apiKey +cloudinary.apiSecret +cloudinary.folder ' +
      '+aws_s3.accessKeyId +aws_s3.secretAccessKey +aws_s3.region +aws_s3.bucketName +aws_s3.folder ' +
      '+imagekit.publicKey +imagekit.privateKey +imagekit.urlEndpoint +imagekit.folder'
    );

    const provider = settings?.activeProvider || 'local';
    const config   = settings?.[provider] || {};

    // Agar koi provider configured nahi
    if (provider === 'local' && (!settings || !settings.cloudinary?.isConfigured)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Storage configure nahi hai. Storage Settings mein koi ek provider setup karein.',
        redirect: '/storage-settings'
      });
    }

    const results = [];
    for (const file of files) {
      const result = await storageService.upload(file.buffer, file.mimetype, {
        provider,
        config,
        folder: `${config.folder || 'social-saas'}/${req.user._id}`
      });
      results.push(result);
    }

    // Stats update karo
    await StorageSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { 'stats.totalUploads': results.length, 'stats.totalSize': results.reduce((s,r) => s + (r.size||0), 0) },
        'stats.lastUploadAt': new Date()
      }
    );

    res.json({ success: true, files: results, provider });
  } catch (e) {
    logger.error(`Upload error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
};