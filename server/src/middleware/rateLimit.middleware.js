const rateLimit = require('express-rate-limit');

const baseOpts = {
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Bahut requests! Thodi der baad try karein.' },
};

// Login / register / forgot-password — strict
exports.authLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,                    // 10 attempts per IP per window
});

// OTP verify / resend — extra strict (brute-force target)
exports.otpLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 6,
});

// Payment endpoints — modest limit
exports.paymentLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 20,
});
