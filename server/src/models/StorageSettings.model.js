const mongoose = require('mongoose');

// StorageSettings = har user apni storage configure karega
const StorageSettingsSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // User ne kaunsa provider choose kiya
  activeProvider: {
    type: String,
    enum: ['cloudinary', 'aws_s3', 'imagekit', 'local'],
    default: 'local'  // Default = local (no external storage)
  },

  // ── Cloudinary ──
  cloudinary: {
    cloudName:    { type: String, select: false },
    apiKey:       { type: String, select: false },
    apiSecret:    { type: String, select: false },
    folder:       { type: String, default: 'social-saas' },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

  // ── AWS S3 ──
  aws_s3: {
    accessKeyId:     { type: String, select: false },
    secretAccessKey: { type: String, select: false },
    region:          { type: String, default: 'ap-south-1' }, // Mumbai
    bucketName:      { type: String, select: false },
    folder:          { type: String, default: 'social-saas' },
    isConfigured:    { type: Boolean, default: false },
    configuredAt:    Date
  },

  // ── ImageKit ──
  imagekit: {
    publicKey:    { type: String, select: false },
    privateKey:   { type: String, select: false },
    urlEndpoint:  { type: String, select: false }, // https://ik.imagekit.io/your_id
    folder:       { type: String, default: 'social-saas' },
    isConfigured: { type: Boolean, default: false },
    configuredAt: Date
  },

  // Storage usage stats
  stats: {
    totalUploads: { type: Number, default: 0 },
    totalSize:    { type: Number, default: 0 }, // bytes mein
    lastUploadAt: Date
  }

}, { timestamps: true });

const StorageSettings = mongoose.model('StorageSettings', StorageSettingsSchema);
module.exports = StorageSettings;
