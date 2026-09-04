const path = require('path');
const fs = require('fs');

class LocalStorageProvider {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFileUrl(req, filename) {
    if (!filename) return null;
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    // Return relative or absolute URL accessible via Express static
    const host = req ? `${req.protocol}://${req.get('host')}` : '';
    return `${host}/uploads/${filename}`;
  }
}

class S3StorageProvider {
  constructor(bucketName) {
    this.bucketName = bucketName;
  }
  // Pluggable cloud hook
  getFileUrl(req, filename) {
    return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
  }
}

class StorageService {
  constructor() {
    const s3Bucket = process.env.AWS_S3_BUCKET;
    if (s3Bucket) {
      this.provider = new S3StorageProvider(s3Bucket);
      console.log('StorageService: Using S3 Storage Provider');
    } else {
      this.provider = new LocalStorageProvider();
      console.log('StorageService: Using Local Disk Storage Provider');
    }
  }

  getUrl(req, filename) {
    return this.provider.getFileUrl(req, filename);
  }
}

module.exports = new StorageService();
