const logger = require('../../utils/logger');

class StorageService {

  // ─────────────────────────────────────────
  // MAIN UPLOAD — provider ke hisaab se upload karo
  // ─────────────────────────────────────────
  async upload(fileBuffer, mimetype, options = {}) {
    const { provider, config, folder = 'social-saas', filename } = options;

    switch (provider) {
      case 'cloudinary': return await this.uploadToCloudinary(fileBuffer, mimetype, config, folder);
      case 'aws_s3':     return await this.uploadToS3(fileBuffer, mimetype, config, folder, filename);
      case 'imagekit':   return await this.uploadToImageKit(fileBuffer, mimetype, config, folder, filename);
      default:           return await this.uploadToLocal(fileBuffer, mimetype, filename);
    }
  }

  // ─────────────────────────────────────────
  // 1. CLOUDINARY
  // ─────────────────────────────────────────
  async uploadToCloudinary(fileBuffer, mimetype, config, folder) {
    const cloudinary = require('cloudinary').v2;

    // User ki apni credentials se instance banao
    const instance = cloudinary.config({
      cloud_name: config.cloudName,
      api_key:    config.apiKey,
      api_secret: config.apiSecret
    });

    return new Promise((resolve, reject) => {
      const isVideo       = mimetype.startsWith('video/');
      const resourceType  = isVideo ? 'video' : 'image';

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(isVideo && { eager: [{ width: 400, height: 300, crop: 'fill', format: 'jpg' }] })
        },
        (error, result) => {
          if (error) return reject(new Error(`Cloudinary: ${error.message}`));
          resolve({
            url:          result.secure_url,
            publicId:     result.public_id,
            type:         isVideo ? 'video' : 'image',
            thumbnail:    isVideo ? result.eager?.[0]?.secure_url : result.secure_url,
            size:         result.bytes,
            width:        result.width,
            height:       result.height,
            provider:     'cloudinary',
            deleteInfo:   { publicId: result.public_id, resourceType }
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // ─────────────────────────────────────────
  // 2. AWS S3
  // ─────────────────────────────────────────
  async uploadToS3(fileBuffer, mimetype, config, folder, filename) {
    // Lazy load — sirf tab load ho jab user S3 use kare
    let AWS;
    try {
      AWS = require('aws-sdk');
    } catch {
      throw new Error('AWS SDK not installed. Server mein: npm install aws-sdk');
    }

    const s3 = new AWS.S3({
      accessKeyId:     config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region:          config.region || 'ap-south-1'
    });

    const isVideo  = mimetype.startsWith('video/');
    const ext      = mimetype.split('/')[1] || 'jpg';
    const key      = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const params = {
      Bucket:      config.bucketName,
      Key:         key,
      Body:        fileBuffer,
      ContentType: mimetype,
      ACL:         'public-read' // Public access taaki URL se access ho sake
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, async (err, data) => {
        if (err) return reject(new Error(`S3: ${err.message}`));

        // Video ke liye thumbnail generate karo (S3 me alag se banana padega)
        const thumbnailUrl = isVideo
          ? `https://via.placeholder.com/400x300?text=Video`
          : data.Location;

        resolve({
          url:        data.Location,
          publicId:   key,
          type:       isVideo ? 'video' : 'image',
          thumbnail:  thumbnailUrl,
          size:       fileBuffer.length,
          provider:   'aws_s3',
          deleteInfo: { key, bucket: config.bucketName }
        });
      });
    });
  }

  // ─────────────────────────────────────────
  // 3. IMAGEKIT
  // ─────────────────────────────────────────
  async uploadToImageKit(fileBuffer, mimetype, config, folder, filename) {
    let ImageKit;
    try {
      ImageKit = require('imagekit');
    } catch {
      throw new Error('ImageKit SDK not installed. Server mein: npm install imagekit');
    }

    const imagekit = new ImageKit({
      publicKey:   config.publicKey,
      privateKey:  config.privateKey,
      urlEndpoint: config.urlEndpoint
    });

    const isVideo = mimetype.startsWith('video/');
    const ext     = mimetype.split('/')[1] || 'jpg';
    const fname   = filename || `upload-${Date.now()}.${ext}`;

    return new Promise((resolve, reject) => {
      imagekit.upload({
        file:     fileBuffer.toString('base64'),
        fileName: fname,
        folder:   `/${folder}`,
        useUniqueFileName: true,
      }, (error, result) => {
        if (error) return reject(new Error(`ImageKit: ${error.message}`));
        resolve({
          url:        result.url,
          publicId:   result.fileId,
          type:       isVideo ? 'video' : 'image',
          thumbnail:  isVideo ? result.thumbnail : result.url,
          size:       result.size,
          width:      result.width,
          height:     result.height,
          provider:   'imagekit',
          deleteInfo: { fileId: result.fileId }
        });
      });
    });
  }

  // ─────────────────────────────────────────
  // 4. LOCAL (Fallback — no external storage)
  // ─────────────────────────────────────────
  async uploadToLocal(fileBuffer, mimetype, filename) {
    // Temporary — sirf development ke liye
    // Production mein koi ek storage configure karna padega
    logger.warn('Using local storage — configure a storage provider in Storage Settings');
    return {
      url:       `data:${mimetype};base64,${fileBuffer.toString('base64')}`,
      publicId:  `local-${Date.now()}`,
      type:      mimetype.startsWith('video/') ? 'video' : 'image',
      thumbnail: null,
      size:      fileBuffer.length,
      provider:  'local',
      deleteInfo: null
    };
  }

  // ─────────────────────────────────────────
  // DELETE — provider ke hisaab se delete karo
  // ─────────────────────────────────────────
  async delete(provider, config, deleteInfo) {
    try {
      switch (provider) {
        case 'cloudinary': {
          const cloudinary = require('cloudinary').v2;
          cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret });
          await cloudinary.uploader.destroy(deleteInfo.publicId, { resource_type: deleteInfo.resourceType || 'image' });
          break;
        }
        case 'aws_s3': {
          const AWS = require('aws-sdk');
          const s3  = new AWS.S3({ accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, region: config.region });
          await s3.deleteObject({ Bucket: deleteInfo.bucket, Key: deleteInfo.key }).promise();
          break;
        }
        case 'imagekit': {
          const ImageKit = require('imagekit');
          const ik = new ImageKit({ publicKey: config.publicKey, privateKey: config.privateKey, urlEndpoint: config.urlEndpoint });
          await ik.deleteFile(deleteInfo.fileId);
          break;
        }
      }
      logger.info(`✅ File deleted from ${provider}`);
    } catch (e) {
      logger.error(`Delete error (${provider}): ${e.message}`);
    }
  }

  // ─────────────────────────────────────────
  // TEST CONNECTION — keys sahi hain ya nahi
  // ─────────────────────────────────────────
  async testConnection(provider, config) {
    try {
      switch (provider) {

        case 'cloudinary': {
          const cloudinary = require('cloudinary').v2;
          cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret });
          const result = await cloudinary.api.ping();
          return { success: true, message: '✅ Cloudinary connected!', info: { cloudName: config.cloudName } };
        }

        case 'aws_s3': {
          const AWS = require('aws-sdk');
          const s3  = new AWS.S3({ accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, region: config.region });
          await s3.headBucket({ Bucket: config.bucketName }).promise();
          return { success: true, message: '✅ AWS S3 connected!', info: { bucket: config.bucketName, region: config.region } };
        }

        case 'imagekit': {
          const ImageKit = require('imagekit');
          const ik = new ImageKit({ publicKey: config.publicKey, privateKey: config.privateKey, urlEndpoint: config.urlEndpoint });
          // ImageKit list files se test karo
          await ik.listFiles({ limit: 1 });
          return { success: true, message: '✅ ImageKit connected!', info: { urlEndpoint: config.urlEndpoint } };
        }

        default:
          return { success: false, message: 'Invalid provider' };
      }
    } catch (e) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  }
}

module.exports = new StorageService();
