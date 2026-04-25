const multer = require('multer');
const cloudinary = require('../../config/cloudinary');
const path = require('path');

// Multer memory storage (file pehle memory mein, phir Cloudinary par)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Use JPG, PNG, GIF, MP4, MOV'), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Cloudinary par upload karo
exports.uploadToCloudinary = async (fileBuffer, mimetype, folder = 'social-saas') => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Video ke liye thumbnail bhi banao
        ...(isVideo && { eager: [{ width: 400, height: 300, crop: 'fill', format: 'jpg' }] })
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url:       result.secure_url,
          publicId:  result.public_id,
          type:      isVideo ? 'video' : 'image',
          thumbnail: isVideo ? result.eager?.[0]?.secure_url : result.secure_url,
          width:     result.width,
          height:    result.height,
          size:      result.bytes
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Cloudinary se delete karo
exports.deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};
