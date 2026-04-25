const router  = require('express').Router();
const multer  = require('multer');
const { protect, authorize } = require('../middleware/auth.middleware');
const companyCtrl = require('../controllers/company.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',            protect, companyCtrl.getCompany);
router.put('/',            protect, companyCtrl.updateCompany);
router.post('/logo',       protect, upload.single('logo'),   companyCtrl.uploadLogo);
router.post('/banner',     protect, upload.single('banner'), companyCtrl.uploadBanner);

// Super admin only
router.post('/assign-package', protect, authorize('superadmin'), companyCtrl.assignPackage);
router.get('/all',             protect, authorize('superadmin'), companyCtrl.getAllCompanies);

module.exports = router;
