const { User, Company, Post, SocialAccount } = require('../models');
const Plan = require('../models/Plan.model');
const OTP = require('../models/OTP.model');
const NotificationSettings = require('../models/NotificationSettings.model');
const StorageSettings = require('../models/StorageSettings.model');
const UserApiSettings = require('../models/UserApiSettings.model');
const Subscription = require('../models/Subscription.model');
const SupportTicket = require('../models/SupportTicket.model');
const audit = require('../services/audit/audit.service');
const logger = require('../utils/logger');

/**
 * Cascade delete a user and all user-scoped data.
 * Preserves Payment and ActivityLog rows for legal/audit purposes (those have
 * denormalized email/role on them so they remain readable after deletion).
 *
 * Returns counts for diagnostics.
 */
async function cascadeDeleteUser(user) {
  const userId = user._id;
  const email  = user.email;
  const results = await Promise.allSettled([
    Post.deleteMany({ user: userId }),
    SocialAccount.deleteMany({ user: userId }),
    OTP.deleteMany({ email }),
    NotificationSettings.deleteMany({ user: userId }),
    StorageSettings.deleteMany({ user: userId }),
    UserApiSettings.deleteMany({ user: userId }),
    Subscription.deleteMany({ user: userId }),
    SupportTicket.deleteMany({ user: userId }),
  ]);
  // Owner-of-company cleanup: if this user was the only owner of a company with
  // no remaining members, drop the company too. Otherwise just unset owner.
  if (user.company) {
    const remaining = await User.countDocuments({ company: user.company, _id: { $ne: userId } });
    if (remaining === 0) {
      await Company.findByIdAndDelete(user.company);
    } else {
      const company = await Company.findById(user.company);
      if (company && String(company.owner) === String(userId)) {
        // Promote oldest remaining user to owner
        const newOwner = await User.findOne({ company: user.company, _id: { $ne: userId } }).sort({ createdAt: 1 });
        if (newOwner) { company.owner = newOwner._id; await company.save(); }
      }
    }
  }
  await User.findByIdAndDelete(userId);
  return results.map((r, i) => ({ ok: r.status === 'fulfilled', deletedCount: r.value?.deletedCount }));
}

exports.cascadeDeleteUser = cascadeDeleteUser;

// Aggregate post + engagement stats per user. Returns Map<userId, stats>.
async function getPostStatsByUser(userIds) {
  if (!userIds?.length) return new Map();
  const rows = await Post.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: {
      _id: '$user',
      totalPosts:     { $sum: 1 },
      publishedPosts: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
      scheduledPosts: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      failedPosts:    { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      likes:          { $sum: { $ifNull: ['$engagement.likes',       0] } },
      comments:       { $sum: { $ifNull: ['$engagement.comments',    0] } },
      shares:         { $sum: { $ifNull: ['$engagement.shares',      0] } },
      reach:          { $sum: { $ifNull: ['$engagement.reach',       0] } },
      impressions:    { $sum: { $ifNull: ['$engagement.impressions', 0] } },
    }}
  ]);
  const map = new Map();
  for (const r of rows) {
    map.set(String(r._id), {
      totalPosts: r.totalPosts, publishedPosts: r.publishedPosts,
      scheduledPosts: r.scheduledPosts, failedPosts: r.failedPosts,
      likes: r.likes, comments: r.comments, shares: r.shares,
      reach: r.reach, impressions: r.impressions,
      engagement: r.likes + r.comments + r.shares,
    });
  }
  return map;
}

const EMPTY_STATS = { totalPosts:0, publishedPosts:0, scheduledPosts:0, failedPosts:0, likes:0, comments:0, shares:0, reach:0, impressions:0, engagement:0 };

// ✅ GET - Super Admin Dashboard Stats
exports.getSuperAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, planCounts, totalsAgg] = await Promise.all([
      User.countDocuments({ isDemo: { $ne: true } }),
      Post.countDocuments(),
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),
      Post.aggregate([
        { $group: {
          _id: null,
          likes:    { $sum: { $ifNull: ['$engagement.likes',    0] } },
          comments: { $sum: { $ifNull: ['$engagement.comments', 0] } },
          shares:   { $sum: { $ifNull: ['$engagement.shares',   0] } },
          reach:    { $sum: { $ifNull: ['$engagement.reach',    0] } },
          published:{ $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        }}
      ]),
    ]);
    const totals = totalsAgg[0] || { likes:0, comments:0, shares:0, reach:0, published:0 };

    const recentUsers = await User.find({ isDemo: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email plan role createdAt isActive')
      .lean();

    const statsMap = await getPostStatsByUser(recentUsers.map(u => u._id));
    recentUsers.forEach(u => { u.postStats = statsMap.get(String(u._id)) || EMPTY_STATS; });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        publishedPosts: totals.published,
        totalEngagement: totals.likes + totals.comments + totals.shares,
        totalReach: totals.reach,
      },
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
      .populate('company', 'name')
      .lean();

    const statsMap = await getPostStatsByUser(users.map(u => u._id));
    users.forEach(u => { u.postStats = statsMap.get(String(u._id)) || EMPTY_STATS; });

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
    audit.log({ req, action: 'user.plan.changed', category: 'plan',
      description: `${req.user.email} changed ${user.email}'s plan to ${plan}`,
      target: { type: 'user', id: user._id, name: user.name },
      metadata: { plan }, company: user.company });
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
    audit.log({ req, action: isActive ? 'user.activated' : 'user.deactivated', category: 'admin',
      description: `${req.user.email} ${isActive ? 'activated' : 'deactivated'} ${user.email}`,
      target: { type: 'user', id: user._id, name: user.name }, company: user.company });
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
    audit.log({ req, action: 'admin.created', category: 'admin',
      description: `${req.user.email} created admin ${email}`,
      target: { type: 'user', id: admin._id, name: admin.name }, company: company._id });
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
    audit.log({ req, action: 'user.promoted', category: 'admin',
      description: `${req.user.email} promoted ${user.email} to admin`,
      target: { type: 'user', id: user._id, name: user.name }, company: user.company });
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
    audit.log({ req, action: 'user.demoted', category: 'admin',
      description: `${req.user.email} demoted ${user.email} to user`,
      target: { type: 'user', id: user._id, name: user.name }, company: user.company });
    res.json({ success: true, message: `${user.name} is now a regular User`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE user (superadmin — can delete anyone except superadmin and self)
exports.deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'superadmin') return res.status(403).json({ success: false, message: 'Cannot delete a superadmin' });
    if (String(target._id) === String(req.user._id)) return res.status(400).json({ success: false, message: "You can't delete your own account" });

    // Audit BEFORE deletion so we still have user info captured
    audit.log({ req, action: 'user.deleted', category: 'admin',
      description: `${req.user.email} deleted ${target.role} ${target.email}`,
      target: { type: 'user', id: target._id, name: target.name },
      metadata: { email: target.email, role: target.role, plan: target.plan },
      company: target.company });

    const counts = await cascadeDeleteUser(target);
    logger.info(`User deleted: ${target.email} by ${req.user.email}`);

    res.json({ success: true, message: `🗑️ ${target.name} deleted`, counts });
  } catch (e) {
    logger.error(`Delete user error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ UPDATE admin permissions
exports.updateAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'permissions object required' });
    }
    const allowed = ['manageUsers','changePlans','viewAllPosts','deletePosts','manageBilling','viewAuditLog'];
    const safe = {};
    for (const k of allowed) if (k in permissions) safe[`permissions.${k}`] = !!permissions[k];

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'superadmin') return res.status(403).json({ success: false, message: 'Cannot modify superadmin permissions' });

    const updated = await User.findByIdAndUpdate(req.params.id, { $set: safe }, { new: true }).select('-password');

    audit.log({ req, action: 'admin.permissions.updated', category: 'admin',
      description: `${req.user.email} updated permissions for ${updated.email}`,
      target: { type: 'user', id: updated._id, name: updated.name },
      metadata: { permissions: updated.permissions }, company: updated.company });

    res.json({ success: true, message: 'Permissions updated', user: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET All Admins (with their own stats + clients-managed counts)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('-password').populate('company', 'name').sort({ createdAt: -1 }).lean();

    const adminIds = admins.map(a => a._id);
    const companyIds = admins.map(a => a.company?._id).filter(Boolean);

    // Each admin's own posts
    const adminStatsMap = await getPostStatsByUser(adminIds);

    // For each admin's company: how many client users + their aggregate post stats
    const clientAgg = await User.aggregate([
      { $match: { company: { $in: companyIds }, role: 'user' } },
      { $group: { _id: '$company', clients: { $sum: 1 }, userIds: { $push: '$_id' } } },
    ]);
    const clientsByCompany = new Map();
    for (const row of clientAgg) clientsByCompany.set(String(row._id), row);

    // Aggregate posts of all client-users (one query, then split by company)
    const allClientUserIds = clientAgg.flatMap(r => r.userIds);
    const clientPostStats = await getPostStatsByUser(allClientUserIds);

    admins.forEach(a => {
      a.postStats = adminStatsMap.get(String(a._id)) || EMPTY_STATS;
      const cb = clientsByCompany.get(String(a.company?._id));
      a.clientCount = cb?.clients || 0;
      // Sum client stats for this admin's company
      const sum = { ...EMPTY_STATS };
      (cb?.userIds || []).forEach(uid => {
        const s = clientPostStats.get(String(uid));
        if (!s) return;
        sum.totalPosts     += s.totalPosts;
        sum.publishedPosts += s.publishedPosts;
        sum.scheduledPosts += s.scheduledPosts;
        sum.likes          += s.likes;
        sum.comments       += s.comments;
        sum.shares         += s.shares;
        sum.reach          += s.reach;
        sum.engagement     += s.engagement;
      });
      a.clientPostStats = sum;
    });

    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
