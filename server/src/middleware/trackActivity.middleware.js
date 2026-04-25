const { User } = require('../models');

// In-memory throttle: userId → last DB write time
const _lastWrite = new Map();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup so the Map doesn't grow unbounded (every hour, drop entries older than 1h)
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, ts] of _lastWrite) if (ts < cutoff) _lastWrite.delete(id);
}, 60 * 60 * 1000).unref?.();

/**
 * Tracks user activity by updating User.lastActiveAt.
 * Throttled per-user so we don't hit the DB on every request — at most one
 * write per 5 minutes per user. Fire-and-forget (response is never blocked).
 *
 * Mount this AFTER `protect` so req.user is populated.
 */
module.exports = function trackActivity(req, res, next) {
  next(); // never block the request

  const userId = req.user?._id;
  if (!userId) return;

  const key = String(userId);
  const last = _lastWrite.get(key) || 0;
  const now = Date.now();
  if (now - last < THROTTLE_MS) return;
  _lastWrite.set(key, now);

  // Don't await — runs in background
  User.updateOne({ _id: userId }, { $set: { lastActiveAt: new Date(now) } }).catch(() => {});
};
