const router   = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const notifCtrl = require('../controllers/notification.controller');

router.get('/settings',    protect, notifCtrl.getSettings);
router.put('/settings',    protect, notifCtrl.updateSettings);
router.post('/test-email', protect, notifCtrl.testEmail);
router.post('/tag-alert',  protect, notifCtrl.sendTagAlert);

module.exports = router;
