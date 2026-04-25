const ActivityLog = require('../models/ActivityLog.model');
const AppSettings = require('../models/AppSettings.model');
const auditService = require('../services/audit/audit.service');
const logger = require('../utils/logger');

// GET /api/audit — superadmin: all logs
// GET /api/audit/company — admin: their company only
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, category, actorId, search, days, scope = 'all' } = req.query;
    const filter = {};

    if (scope === 'company') {
      // Admin path — restrict to their own company
      filter.company = req.user.company?._id || req.user.company;
    }

    if (category)  filter.category = category;
    if (action)    filter.action   = { $regex: action, $options: 'i' };
    if (actorId)   filter['actor.userId'] = actorId;
    if (search)    filter.$or = [
      { description:   { $regex: search, $options: 'i' } },
      { 'actor.name':  { $regex: search, $options: 'i' } },
      { 'actor.email': { $regex: search, $options: 'i' } },
      { 'target.name': { $regex: search, $options: 'i' } },
    ];
    if (days) {
      const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: since };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 })
        .limit(Number(limit)).skip((Number(page) - 1) * Number(limit)).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ success: true, logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (e) {
    logger.error(`Audit list error: ${e.message}`);
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/audit/stats — counts by category, last 30 days
exports.stats = async (req, res) => {
  try {
    const isCompanyScope = req.query.scope === 'company';
    const baseMatch = isCompanyScope ? { company: req.user.company?._id || req.user.company } : {};
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byCategory, byDay, total, oldest] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { ...baseMatch, createdAt: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      ActivityLog.aggregate([
        { $match: { ...baseMatch, createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
      ActivityLog.countDocuments(baseMatch),
      ActivityLog.findOne(baseMatch).sort({ createdAt: 1 }).select('createdAt').lean(),
    ]);

    res.json({ success: true, byCategory, byDay, total, oldestAt: oldest?.createdAt });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/audit/settings — superadmin only
exports.getSettings = async (req, res) => {
  try {
    const s = await AppSettings.get();
    res.json({ success: true, settings: s.audit });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/audit/settings — superadmin updates retention
exports.updateSettings = async (req, res) => {
  try {
    const { retentionDays, enabled } = req.body;
    const s = await AppSettings.get();
    if (retentionDays !== undefined) s.audit.retentionDays = Math.max(1, Math.min(730, Number(retentionDays)));
    if (enabled !== undefined)       s.audit.enabled = !!enabled;
    await s.save();
    auditService.invalidateCache();

    auditService.log({
      req, action: 'audit.settings.updated', category: 'system',
      description: `Audit retention set to ${s.audit.retentionDays} days, enabled=${s.audit.enabled}`,
    });

    res.json({ success: true, settings: s.audit });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// DELETE /api/audit/clear — superadmin one-click clear (with optional filter)
exports.clear = async (req, res) => {
  try {
    const { olderThanDays, category } = req.body || {};
    const filter = {};
    if (olderThanDays) filter.createdAt = { $lt: new Date(Date.now() - Number(olderThanDays) * 24 * 60 * 60 * 1000) };
    if (category)      filter.category = category;

    const result = await ActivityLog.deleteMany(filter);

    auditService.log({
      req, action: 'audit.cleared', category: 'system',
      description: `${result.deletedCount} audit logs cleared`,
      metadata: { filter },
    });

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
