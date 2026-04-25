const router     = require('express').Router();
const multer     = require('multer');
const { protect } = require('../middleware/auth.middleware');
const storageCtrl = require('../controllers/storage.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/avi'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and videos allowed'));
  }
});

// Settings manage karo
router.get('/settings',                  protect, storageCtrl.getSettings);
router.put('/settings/active',           protect, storageCtrl.setActiveProvider);
router.post('/settings/cloudinary',      protect, storageCtrl.saveCloudinary);
router.post('/settings/aws-s3',          protect, storageCtrl.saveS3);
router.post('/settings/imagekit',        protect, storageCtrl.saveImageKit);
router.get('/settings/test/:provider',   protect, storageCtrl.testConnection);
router.delete('/settings/:provider',     protect, storageCtrl.removeProvider);

// File upload
router.post('/upload', protect, upload.array('files', 10), storageCtrl.uploadFile);

module.exports = router;
