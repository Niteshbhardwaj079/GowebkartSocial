const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/audit.controller');

// Admin-scoped: see only company logs
router.get('/company',          protect, authorize('admin', 'superadmin'), (req, res) => {
  req.query.scope = 'company';
  ctrl.list(req, res);
});
router.get('/company/stats',    protect, authorize('admin', 'superadmin'), (req, res) => {
  req.query.scope = 'company';
  ctrl.stats(req, res);
});

// SuperAdmin-only: all logs + retention settings + clear
router.get('/',                 protect, authorize('superadmin'), ctrl.list);
router.get('/stats',            protect, authorize('superadmin'), ctrl.stats);
router.get('/settings',         protect, authorize('superadmin'), ctrl.getSettings);
router.put('/settings',         protect, authorize('superadmin'), ctrl.updateSettings);
router.delete('/clear',         protect, authorize('superadmin'), ctrl.clear);

module.exports = router;
