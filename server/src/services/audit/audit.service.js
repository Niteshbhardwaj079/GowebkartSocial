const ActivityLog = require('../../models/ActivityLog.model');
const AppSettings = require('../../models/AppSettings.model');
const logger      = require('../../utils/logger');

// In-memory cache for retention setting (avoids DB hit per audit write)
let _cache = { retentionDays: 90, enabled: true, fetchedAt: 0 };
const CACHE_TTL_MS = 60_000; // 1 min

async function getSettings() {
  const now = Date.now();
  if (now - _cache.fetchedAt < CACHE_TTL_MS) return _cache;
  try {
    const doc = await AppSettings.get();
    _cache = {
      retentionDays: doc.audit?.retentionDays ?? 90,
      enabled:       doc.audit?.enabled ?? true,
      fetchedAt:     now,
    };
  } catch (e) {
    // If settings fetch fails, fall back to defaults — never block audit writes
  }
  return _cache;
}

function invalidateCache() { _cache.fetchedAt = 0; }

/**
 * Fire-and-forget audit log write. Never throws — failures are logged at warn level
 * so they don't surface to the user. Designed to be called from hot paths (controllers,
 * scheduler) without awaiting.
 *
 * Pass `req` to auto-extract IP / user-agent / actor.
 *
 * Example:
 *   audit.log({ req, action: 'user.registered', category: 'auth',
 *               description: `Registered: ${email}`, target: { type:'user', id:user._id, name }});
 */
function log({ req, actor, action, category, description, target, metadata, company }) {
  // Synchronous part — extract context, then fire async write
  const finalActor = actor || (req?.user ? {
    userId: req.user._id,
    name:   req.user.name,
    email:  req.user.email,
    role:   req.user.role,
  } : { role: 'guest' });

  const finalCompany = company
    ?? req?.user?.company?._id
    ?? req?.user?.company;

  const ip = req ? (
    req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
  ) : undefined;
  const userAgent = req?.headers['user-agent'];

  // Don't await — let the request return immediately
  (async () => {
    try {
      const settings = await getSettings();
      if (!settings.enabled) return;
      const expiresAt = new Date(Date.now() + settings.retentionDays * 24 * 60 * 60 * 1000);

      await ActivityLog.create({
        actor: finalActor,
        action, category, description,
        target, metadata,
        ip, userAgent,
        company: finalCompany,
        expiresAt,
      });
    } catch (err) {
      logger.warn(`Audit log write failed (${action}): ${err.message}`);
    }
  })();
}

module.exports = { log, getSettings, invalidateCache };
