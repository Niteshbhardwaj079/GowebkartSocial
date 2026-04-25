require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const connectDB   = require('./config/db');
const scheduler   = require('./services/scheduler/scheduler.service');
const logger      = require('./utils/logger');

// ── Startup validation ──
const WEAK_JWT_SECRETS = [
  'social-saas-secret-key-change-in-production-2025',
  'your-secret-key', 'secret', 'changeme',
];
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET missing or too short (min 32 chars). Set a strong secret in .env');
  process.exit(1);
}
if (WEAK_JWT_SECRETS.includes(process.env.JWT_SECRET) && process.env.NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET is using a known/default value. Generate a fresh random secret for production.');
  process.exit(1);
}

const { postRouter, aiRouter, uploadRouter, analyticsRouter, socialRouter, adsRouter, adminRouter } = require('./routes');
const { apiSettingsRouter, superAdminRouter, publicPlansRouter } = require('./routes/extra.routes');
const authRouter         = require('./routes/auth.routes');
const inboxRouter        = require('./routes/inbox.routes');
const companyRouter      = require('./routes/company.routes');
const notificationRouter = require('./routes/notification.routes');
const storageRouter      = require('./routes/storage.routes');
const supportRouter      = require('./routes/support.routes');
const paymentRouter      = require('./routes/payment.routes');
const auditRouter        = require('./routes/audit.routes');
const trackActivity      = require('./middleware/trackActivity.middleware');

const app = express();
// Render/Heroku/etc sit behind a proxy — needed for express-rate-limit to read real IP
app.set('trust proxy', 1);
app.use(helmet());

// CORS — strict allowlist if CLIENT_URL is set, otherwise permissive (warn).
// Bearer-token API (no cookies), so CORS is a hardening layer not a primary defense.
const explicitOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim()).filter(Boolean)
  : null;
if (!explicitOrigins) {
  logger.warn('⚠️  CLIENT_URL not set — CORS is permissive. Set CLIENT_URL=https://your-frontend in production.');
}
function isOriginAllowed(origin) {
  if (!origin) return true;                                       // server-to-server, curl, same-origin
  if (!explicitOrigins) return true;                              // permissive default
  if (explicitOrigins.includes(origin)) return true;              // exact match
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return true; // any Render deploy
  if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return true;   // local dev always
  return false;
}
app.use(cors({
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    return cb(null, false);   // tells cors() to omit ACAO header — clean rejection, no 500
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Track lastActiveAt on every API request (after protect populates req.user).
// trackActivity itself is throttled per-user — see middleware for details.
app.use('/api', trackActivity);

app.use('/api/auth',          authRouter);
app.use('/api/posts',         postRouter);
app.use('/api/ai',            aiRouter);
app.use('/api/upload',        uploadRouter);
app.use('/api/storage',       storageRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/social',        socialRouter);
app.use('/api/ads',           adsRouter);
app.use('/api/admin',         adminRouter);
app.use('/api/api-settings',  apiSettingsRouter);
app.use('/api/superadmin',    superAdminRouter);
app.use('/api/inbox',         inboxRouter);
app.use('/api/company',       companyRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/support',       supportRouter);
app.use('/api/payment',       paymentRouter);
app.use('/api/audit',         auditRouter);
app.use('/api',               publicPlansRouter);

app.get('/health', (req, res) => res.json({ status:'OK', message:'🚀 Server running!', time: new Date() }));
app.use((req, res) => res.status(404).json({ success:false, message:`Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => { logger.error(err.message); res.status(500).json({ success:false, message:err.message }); });

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Server on http://localhost:${PORT}`);
    scheduler.start();
  });
});
module.exports = app;
