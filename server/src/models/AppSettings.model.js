const mongoose = require('mongoose');

// Singleton config doc — one row, key='global'
const AppSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },

  audit: {
    retentionDays:   { type: Number, default: 90, min: 1, max: 730 },
    enabled:         { type: Boolean, default: true },
  },
}, { timestamps: true });

AppSettingsSchema.statics.get = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
