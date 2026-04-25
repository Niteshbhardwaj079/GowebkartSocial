require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const connectDB   = require('./config/db');
const scheduler   = require('./services/scheduler/scheduler.service');
const logger      = require('./utils/logger');

const { postRouter, aiRouter, uploadRouter, analyticsRouter, socialRouter, adsRouter, adminRouter } = require('./routes');
const { apiSettingsRouter, superAdminRouter, publicPlansRouter } = require('./routes/extra.routes');
const authRouter         = require('./routes/auth.routes');
const inboxRouter        = require('./routes/inbox.routes');
const companyRouter      = require('./routes/company.routes');
const notificationRouter = require('./routes/notification.routes');
const storageRouter      = require('./routes/storage.routes');
const supportRouter      = require('./routes/support.routes');
const paymentRouter      = require('./routes/payment.routes');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

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
