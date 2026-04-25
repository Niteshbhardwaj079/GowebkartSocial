const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true },
  otp:       { type: String, required: true },
  type:      { type: String, enum: ['email_verify', 'password_reset', 'login'], default: 'email_verify' },
  attempts:  { type: Number, default: 0 },    // Kitni baar wrong OTP dala
  isUsed:    { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Auto delete after expiry
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', OTPSchema);
module.exports = OTP;
