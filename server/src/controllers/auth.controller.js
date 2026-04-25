const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const { User, Company } = require('../models');
const OTP          = require('../models/OTP.model');
const emailService = require('../services/email/email.service');
const logger       = require('../utils/logger');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
const generateOTP   = () => Math.floor(100000 + Math.random() * 900000).toString();

const userResponse = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  plan: user.plan, language: user.language, avatar: user.avatar,
  company: user.company, usage: user.usage, isDemo: user.isDemo || false,
  isEmailVerified: user.isEmailVerified
});

// ✅ REGISTER → OTP bhejo
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Naam, email aur password zaroori hain' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Valid email address dalein' });
    if (password.length < 6)    return res.status(400).json({ success: false, message: 'Password kam se kam 6 characters ka hona chahiye' });

    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Yeh email already registered hai' });

    const company = await Company.create({ name: companyName || `${name}'s Workspace` });
    const user    = await User.create({ name, email, password, company: company._id, role: 'admin', isEmailVerified: false });
    company.owner = user._id;
    await company.save();

    const otpCode = generateOTP();
    await OTP.deleteMany({ email, type: 'email_verify' });
    await OTP.create({ email, otp: otpCode, type: 'email_verify', expiresAt: new Date(Date.now() + (Number(process.env.OTP_EXPIRE_MINUTES)||10)*60000) });
    await emailService.sendOTP(email, otpCode, name);

    logger.info(`Registered: ${email}`);
    res.status(201).json({ success: true, requireOTP: true, email, userId: user._id, message: `✅ OTP ${email} par bheja gaya! Verify karein.` });
  } catch (e) { logger.error(e.message); res.status(500).json({ success: false, message: e.message }); }
};

// ✅ VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email aur OTP dalein' });

    const rec = await OTP.findOne({ email, type: 'email_verify', isUsed: false });
    if (!rec) return res.status(400).json({ success: false, message: 'OTP nahi mila. Dobara bhejein.' });
    if (new Date() > rec.expiresAt) { await OTP.deleteOne({ _id: rec._id }); return res.status(400).json({ success: false, message: 'OTP expire ho gaya' }); }
    if (rec.attempts >= 5) { await OTP.deleteOne({ _id: rec._id }); return res.status(400).json({ success: false, message: 'Bahut attempts. Naya OTP mangaein.' }); }

    if (!(await rec.compareOTP(otp))) {
      rec.attempts++; await rec.save();
      return res.status(400).json({ success: false, message: `Galat OTP. ${5 - rec.attempts} attempts baaki.` });
    }

    rec.isUsed = true; await rec.save();
    const user = await User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true }).populate('company');
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });

    await emailService.sendWelcome(email, user.name, user.plan);
    const token = generateToken(user._id);
    logger.info(`Email verified: ${email}`);
    res.json({ success: true, message: '🎉 Email verify ho gaya! Welcome!', token, user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ RESEND OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email pehle se verify hai' });

    const recent = await OTP.findOne({ email, type: 'email_verify', createdAt: { $gte: new Date(Date.now()-60000) } });
    if (recent) return res.status(429).json({ success: false, message: '1 minute baad try karein' });

    const otpCode = generateOTP();
    await OTP.deleteMany({ email, type: 'email_verify' });
    await OTP.create({ email, otp: otpCode, type: 'email_verify', expiresAt: new Date(Date.now() + (Number(process.env.OTP_EXPIRE_MINUTES)||10)*60000) });
    await emailService.sendOTP(email, otpCode, user.name);
    res.json({ success: true, message: `✅ Naya OTP ${email} par bheja gaya` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email aur password dalein' });

    const user = await User.findOne({ email }).select('+password').populate('company');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Galat email ya password' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivate ho gaya' });

    if (!user.isEmailVerified) {
      const otpCode = generateOTP();
      await OTP.deleteMany({ email, type: 'email_verify' });
      await OTP.create({ email, otp: otpCode, type: 'email_verify', expiresAt: new Date(Date.now() + (Number(process.env.OTP_EXPIRE_MINUTES)||10)*60000) });
      await emailService.sendOTP(email, otpCode, user.name);
      return res.status(403).json({ success: false, requireOTP: true, email, message: 'Email verify nahi hui. OTP bheja gaya.' });
    }

    const token = generateToken(user._id);
    logger.info(`Login: ${email}`);
    res.json({ success: true, message: 'Login successful!', token, user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ DEMO LOGIN
exports.demoLogin = async (req, res) => {
  try {
    let u = await User.findOne({ email: 'demo@socialsaas.com' }).populate('company');
    if (!u) {
      const c = await Company.create({ name: 'Demo Company' });
      u = await User.create({ name: 'Demo User', email: 'demo@socialsaas.com', password: 'Demo@12345', role: 'user', plan: 'basic', company: c._id, isDemo: true, isEmailVerified: true });
      c.owner = u._id; await c.save();
      u = await User.findById(u._id).populate('company');
    }
    res.json({ success: true, token: generateToken(u._id), user: userResponse(u) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Yeh email registered nahi hai' });

    const token  = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 30*60*1000);
    await user.save();

    await emailService.sendPasswordReset(email, user.name, `${process.env.CLIENT_URL}/reset-password?token=${token}`);
    res.json({ success: true, message: `✅ Password reset link ${email} par bheja gaya` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user   = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Token invalid ya expire' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password 6+ characters ka hona chahiye' });

    user.password = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ success: true, message: '✅ Password change ho gaya!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('company');
  res.json({ success: true, user: userResponse(user) });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, language, timezone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, language, timezone }, { new: true }).populate('company');
    res.json({ success: true, user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Dono password dalein' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password 6+ characters ka hona chahiye' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ success: false, message: 'Current password galat hai' });
    user.password = newPassword; await user.save();
    res.json({ success: true, message: '✅ Password change ho gaya!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
