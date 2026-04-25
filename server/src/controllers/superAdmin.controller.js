const { User, Company, Post } = require('../models');
const Plan = require('../models/Plan.model');
const logger = require('../utils/logger');

// ✅ GET - Super Admin Dashboard Stats
exports.getSuperAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, planCounts] = await Promise.all([
      User.countDocuments({ isDemo: { $ne: true } }),
      Post.countDocuments(),
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ])
    ]);

    const recentUsers = await User.find({ isDemo: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email plan role createdAt isActive');

    res.json({
      success: true,
      stats: { totalUsers, totalPosts },
      planCounts,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET - All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    if (plan) filter.plan = plan;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-password')
      .populate('company', 'name');

    const total = await User.countDocuments(filter);

    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE User Plan
exports.updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'basic', 'pro'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Plan updated: ${user.email} → ${plan} by ${req.user.email}`);
    res.json({ success: true, message: `Plan updated to ${plan}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE User Status (active/inactive)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET All Plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CREATE Plan
exports.createPlan = async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, message: 'Plan created!', plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE Plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated!', plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE Plan
exports.deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Seed default plans (pehli baar chalao)
exports.seedPlans = async (req, res) => {
  try {
    const existing = await Plan.countDocuments();
    if (existing > 0) {
      return res.json({ success: true, message: 'Plans already exist' });
    }

    await Plan.insertMany([
      {
        name: 'free', displayName: 'Free', description: 'Perfect to get started',
        price: { monthly: 0, yearly: 0 },
        limits: { postsPerMonth: 30, socialAccounts: 3, aiCallsPerDay: 5, teamMembers: 1, adsAccess: false, bulkUpload: false, analyticsAdvanced: false },
        isActive: true, sortOrder: 1
      },
      {
        name: 'basic', displayName: 'Basic', description: 'For growing businesses',
        price: { monthly: 999, yearly: 799 },
        limits: { postsPerMonth: 100, socialAccounts: 10, aiCallsPerDay: 20, teamMembers: 3, adsAccess: true, bulkUpload: true, analyticsAdvanced: true },
        isActive: true, isPopular: true, sortOrder: 2
      },
      {
        name: 'pro', displayName: 'Pro', description: 'For agencies & power users',
        price: { monthly: 2499, yearly: 1999 },
        limits: { postsPerMonth: 999999, socialAccounts: 999, aiCallsPerDay: 999999, teamMembers: 999, adsAccess: true, bulkUpload: true, analyticsAdvanced: true, whiteLabel: true, apiAccess: true },
        isActive: true, sortOrder: 3
      }
    ]);

    res.json({ success: true, message: '✅ Default plans created!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CREATE Admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const { Company } = require('../models');
    const company = await Company.create({
      name: `${name}'s Workspace`,
      planLimits: { maxUsers: 50, maxSocialAccounts: 50, postsPerMonth: 999999, aiCallsPerDay: 999999, adsAccess: true }
    });
    const admin = await User.create({
      name, email, password,
      role: 'admin', plan: 'pro',
      company: company._id, isEmailVerified: true
    });
    company.owner = admin._id;
    await company.save();
    logger.info(`Admin created: ${email} by ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: `✅ Admin account created for ${name}`,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ PROMOTE User to Admin
exports.promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin', plan: 'pro' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `${user.name} is now an Admin! 👑`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DEMOTE Admin to User
exports.demoteToUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot demote superadmin' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'user' }, { new: true }).select('-password');
    res.json({ success: true, message: `${user.name} is now a regular User`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET All Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('-password').populate('company', 'name').sort({ createdAt: -1 });
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
