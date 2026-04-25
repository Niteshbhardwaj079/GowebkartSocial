const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ✅ Login check karo
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please login first' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate('company');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ✅ Role check — sirf admin/superadmin ke liye
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for your role' });
  }
  next();
};

// ✅ Plan check — sirf paid plan users ke liye
exports.requirePlan = (...plans) => (req, res, next) => {
  if (!plans.includes(req.user.plan)) {
    return res.status(403).json({ success: false, message: 'Please upgrade your plan to use this feature' });
  }
  next();
};

// ✅ Per-admin permission check (superadmin always passes)
exports.requirePermission = (...keys) => (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  const perms = req.user.permissions || {};
  for (const k of keys) {
    if (!perms[k]) {
      return res.status(403).json({ success: false, message: `Permission denied: ${k} not granted by super admin` });
    }
  }
  next();
};
