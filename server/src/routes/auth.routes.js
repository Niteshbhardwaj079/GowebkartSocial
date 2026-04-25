const router   = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register',         authLimiter, authCtrl.register);
router.post('/verify-otp',       otpLimiter,  authCtrl.verifyOTP);
router.post('/resend-otp',       otpLimiter,  authCtrl.resendOTP);
router.post('/login',            authLimiter, authCtrl.login);
router.post('/demo',             authLimiter, authCtrl.demoLogin);
router.post('/forgot-password',  authLimiter, authCtrl.forgotPassword);
router.post('/reset-password',   authLimiter, authCtrl.resetPassword);
router.get('/me',                protect, authCtrl.getMe);
router.put('/profile',           protect, authCtrl.updateProfile);
router.put('/change-password',   protect, authCtrl.changePassword);

module.exports = router;
