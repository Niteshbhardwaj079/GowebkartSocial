const router   = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register',         authCtrl.register);
router.post('/verify-otp',       authCtrl.verifyOTP);
router.post('/resend-otp',       authCtrl.resendOTP);
router.post('/login',            authCtrl.login);
router.post('/demo',             authCtrl.demoLogin);
router.post('/forgot-password',  authCtrl.forgotPassword);
router.post('/reset-password',   authCtrl.resetPassword);
router.get('/me',                protect, authCtrl.getMe);
router.put('/profile',           protect, authCtrl.updateProfile);
router.put('/change-password',   protect, authCtrl.changePassword);

module.exports = router;
