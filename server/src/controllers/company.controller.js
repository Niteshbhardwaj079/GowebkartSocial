const { Company } = require('../models');
const cloudinary  = require('../config/cloudinary');
const logger      = require('../utils/logger');

// ✅ GET Company Profile
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company?._id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ UPDATE Company Details
exports.updateCompany = async (req, res) => {
  try {
    const allowed = ['name','website','phone','address','city','state','country','pincode','about','industry','socialLinks'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Branding update
    if (req.body.branding) {
      updates['branding.primaryColor']   = req.body.branding.primaryColor;
      updates['branding.secondaryColor'] = req.body.branding.secondaryColor;
      updates['branding.tagline']        = req.body.branding.tagline;
    }

    const company = await Company.findByIdAndUpdate(req.user.company?._id, { $set: updates }, { new: true });
    res.json({ success: true, message: '✅ Company updated!', company });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ UPLOAD Company Logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `social-saas/logos/${req.user.company?._id}`, resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'limit' }] },
        (err, res) => err ? reject(err) : resolve(res)
      );
      stream.end(req.file.buffer);
    });

    const company = await Company.findByIdAndUpdate(req.user.company?._id, { logo: result.secure_url }, { new: true });
    res.json({ success: true, message: '✅ Logo uploaded!', logo: result.secure_url, company });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ UPLOAD Cover/Banner Image
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `social-saas/banners/${req.user.company?._id}`, resource_type: 'image', transformation: [{ width: 1200, height: 400, crop: 'fill' }] },
        (err, res) => err ? reject(err) : resolve(res)
      );
      stream.end(req.file.buffer);
    });

    const company = await Company.findByIdAndUpdate(req.user.company?._id, { 'branding.bannerImage': result.secure_url }, { new: true });
    res.json({ success: true, message: '✅ Banner uploaded!', banner: result.secure_url, company });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ ADMIN — Super Admin ek client ko package assign kare
exports.assignPackage = async (req, res) => {
  try {
    const { userId, plan, customLimits } = req.body;
    const { User } = require('../models');

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Plan update
    user.plan = plan;
    await user.save();

    // Custom limits agar hain
    if (customLimits && user.company) {
      await Company.findByIdAndUpdate(user.company, {
        planLimits: {
          postsPerMonth:     customLimits.postsPerMonth     || 100,
          maxSocialAccounts: customLimits.maxSocialAccounts || 10,
          aiCallsPerDay:     customLimits.aiCallsPerDay     || 20,
          adsAccess:         customLimits.adsAccess         || false,
          maxUsers:          customLimits.maxUsers          || 5,
        }
      });
    }

    logger.info(`Package assigned: ${user.email} → ${plan}`);
    res.json({ success: true, message: `✅ ${plan} plan assigned to ${user.name}!` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ✅ GET All Companies (super admin ke liye)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('owner', 'name email plan').sort({ createdAt: -1 });
    res.json({ success: true, companies });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
