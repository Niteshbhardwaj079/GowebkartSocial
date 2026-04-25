const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const OTPSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, index: true },
  otp:       { type: String, required: true },
  type:      { type: String, enum: ['email_verify', 'password_reset', 'login'], default: 'email_verify' },
  attempts:  { type: Number, default: 0 },
  isUsed:    { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Auto delete after expiry
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash OTP before save (so DB breach doesn't leak codes)
OTPSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) return next();
  this.otp = await bcrypt.hash(this.otp, 8);
  next();
});

OTPSchema.methods.compareOTP = async function(entered) {
  return bcrypt.compare(String(entered).trim(), this.otp);
};

const OTP = mongoose.model('OTP', OTPSchema);
module.exports = OTP;
