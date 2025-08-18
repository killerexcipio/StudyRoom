// server/utils/fileHelper.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const logger = require('./logger');

class FileHelper {
  // File size constants
  static get SIZES() {
    return {
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };
  }

  // Allowed file types by category
  static get ALLOWED_TYPES() {
    return {
      images: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff'
      ],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/rtf',
        'application/rtf'
      ],
      audio: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/m4a',
        'audio/flac',
        'audio/webm'
      ],
      video: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/webm',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv'
      ],
      archives: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip'
      ]
    };
  }

  // Size limits by file type (in bytes)
  static get SIZE_LIMITS() {
    return {
      images: 10 * this.SIZES.MB,
      documents: 25 * this.SIZES.MB,
      audio: 50 * this.SIZES.MB,
      video: 100 * this.SIZES.MB,
      archives: 50 * this.SIZES.MB,
      default: 10 * this.SIZES.MB
    };
  }

  // Get file extension from filename
  static getFileExtension(filename) {
    if (!filename) return '';
    return path.extname(filename).toLowerCase().substring(1);
  }

  // Get file name without extension
  static getFileNameWithoutExtension(filename) {
    if (!filename) return '';
    return path.basename(filename, path.extname(filename));
  }

  // Get MIME type from file extension
  static getMimeType(filename) {
    return mime.lookup(filename) || 'application/octet-stream';
  }

  // Get file category based on MIME type
  static getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.ALLOWED_TYPES)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return 'other';
  }

  // Check if file type is allowed
  static isFileTypeAllowed(mimeType, allowedTypes = null) {
    if (allowedTypes) {
      return allowedTypes.includes(mimeType);
    }
    
    const allAllowedTypes = Object.values(this.ALLOWED_TYPES).flat();
    return allAllowedTypes.includes(mimeType);
  }

  // Validate file size
  static validateFileSize(fileSize, category = 'default') {
    const limit = this.SIZE_LIMITS[category] || this.SIZE_LIMITS.default;
    return fileSize <= limit;
  }

  // Format file size to human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate unique filename
  static generateUniqueFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const extension = this.getFileExtension(originalName);
    const baseName = this.getFileNameWithoutExtension(originalName);
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50);
    
    return `${prefix}${sanitizedBaseName}_${timestamp}_${random}.${extension}`;
  }

  // Sanitize filename
  static sanitizeFilename(filename) {
    // Remove or replace dangerous characters
    const sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
    
    return sanitized || 'file';
  }

  // Generate file hash (MD5)
  static async generateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (error) {
      logger.error('Failed to generate file hash:', error);
      throw error;
    }
  }

  // Check if file exists
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file stats
  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error('Failed to get file stats:', error);
      throw error;
    }
  }

  // Create directory recursively
  static async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      logger.error('Failed to create directory:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted:', filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('File not found for deletion:', filePath);
        return true; // File doesn't exist, consider it deleted
      }
      logger.error('Failed to delete file:', error);
      throw error;
    }
  }

  // Copy file
  static async copyFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      await this.createDirectory(destDir);
      
      await fs.copyFile(sourcePath, destinationPath);
      logger.info('File copied:', { from: sourcePath, to: destinationPath });
      return true;
    } catch (error) {
      logger.error('Failed to copy file:', error);
      throw error;
    }
  }

  // Move file
  static async moveFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      await this.createDirectory(destDir);
      
      await fs.rename(sourcePath, destinationPath);
      logger.info('File moved:', { from: sourcePath, to: destinationPath });
      return true;
    } catch (error) {
      logger.error('Failed to move file:', error);
      throw error;
    }
  }

  // Read file content
  static async readFile(filePath, encoding = 'utf8') {
    try {
      const content = await fs.readFile(filePath, encoding);
      return content;
    } catch (error) {
      logger.error('Failed to read file:', error);
      throw error;
    }
  }

  // Write file content
  static async writeFile(filePath, content, encoding = 'utf8') {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await this.createDirectory(dir);
      
      await fs.writeFile(filePath, content, encoding);
      logger.info('File written:', filePath);
      return true;
    } catch (error) {
      logger.error('Failed to write file:', error);
      throw error;
    }
  }

  // Get directory contents
  static async getDirectoryContents(dirPath) {
    try {
      const contents = await fs.readdir(dirPath, { withFileTypes: true });
      
      const files = [];
      const directories = [];
      
      for (const item of contents) {
        if (item.isFile()) {
          files.push(item.name);
        } else if (item.isDirectory()) {
          directories.push(item.name);
        }
      }
      
      return { files, directories };
    } catch (error) {
      logger.error('Failed to read directory:', error);
      throw error;
    }
  }

  // Clean up old files
  static async cleanupOldFiles(directory, maxAge = 30) {
    try {
      const contents = await this.getDirectoryContents(directory);
      const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const filename of contents.files) {
        const filePath = path.join(directory, filename);
        const stats = await this.getFileStats(filePath);
        
        if (stats.modified < cutoffDate) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} old files from ${directory}`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      throw error;
    }
  }

  // Get file encoding
  static async detectFileEncoding(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Simple encoding detection based on BOM
      if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';
      }
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return 'utf16le';
      }
      if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return 'utf16be';
      }
      
      // Default to UTF-8 for text files
      return 'utf8';
    } catch (error) {
      logger.error('Failed to detect file encoding:', error);
      return 'utf8';
    }
  }

  // Validate file signature (magic bytes)
  static async validateFileSignature(filePath, expectedMimeType) {
    try {
      const buffer = await fs.readFile(filePath);
      const signature = buffer.slice(0, 8).toString('hex').toUpperCase();
      
      // Common file signatures
      const signatures = {
        'image/jpeg': ['FFD8FF'],
        'image/png': ['89504E47'],
        'image/gif': ['47494638'],
        'image/webp': ['52494646'],
        'application/pdf': ['255044462D'],
        'application/zip': ['504B0304', '504B0506'],
        'video/mp4': ['66747970'],
        'audio/mpeg': ['494433', 'FFFB', 'FFF3']
      };
      
      const expectedSignatures = signatures[expectedMimeType];
      if (!expectedSignatures) {
        return true; // Can't validate, assume valid
      }
      
      return expectedSignatures.some(sig => signature.startsWith(sig));
    } catch (error) {
      logger.error('Failed to validate file signature:', error);
      return false;
    }
  }

  // Compress file (placeholder for compression logic)
  static async compressFile(filePath, compressionLevel = 6) {
    try {
      // Placeholder for compression implementation
      // In production, use libraries like node-gzip, sharp (for images), etc.
      logger.info('File compression not implemented yet:', filePath);
      return filePath;
    } catch (error) {
      logger.error('Failed to compress file:', error);
      throw error;
    }
  }

  // Generate thumbnail for images (placeholder)
  static async generateThumbnail(imagePath, thumbnailPath, size = { width: 200, height: 200 }) {
    try {
      // Placeholder for thumbnail generation
      // In production, use libraries like sharp, jimp, etc.
      logger.info('Thumbnail generation not implemented yet:', { imagePath, thumbnailPath, size });
      return thumbnailPath;
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error);
      throw error;
    }
  }

  // Get image dimensions (placeholder)
  static async getImageDimensions(imagePath) {
    try {
      // Placeholder for image dimension detection
      // In production, use libraries like sharp, image-size, etc.
      logger.info('Image dimension detection not implemented yet:', imagePath);
      return { width: 0, height: 0 };
    } catch (error) {
      logger.error('Failed to get image dimensions:', error);
      throw error;
    }
  }

  // Get video duration (placeholder)
  static async getVideoDuration(videoPath) {
    try {
      // Placeholder for video duration detection
      // In production, use libraries like ffprobe, node-ffmpeg, etc.
      logger.info('Video duration detection not implemented yet:', videoPath);
      return 0;
    } catch (error) {
      logger.error('Failed to get video duration:', error);
      throw error;
    }
  }

  // Scan file for viruses (placeholder)
  static async scanFileForViruses(filePath) {
    try {
      // Placeholder for virus scanning
      // In production, integrate with antivirus APIs like ClamAV, VirusTotal, etc.
      logger.info('Virus scanning not implemented yet:', filePath);
      return { clean: true, threats: [] };
    } catch (error) {
      logger.error('Failed to scan file for viruses:', error);
      throw error;
    }
  }

  // Get total directory size
  static async getDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      
      const processDirectory = async (dir) => {
        const contents = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of contents) {
          const itemPath = path.join(dir, item.name);
          
          if (item.isFile()) {
            const stats = await fs.stat(itemPath);
            totalSize += stats.size;
          } else if (item.isDirectory()) {
            await processDirectory(itemPath);
          }
        }
      };
      
      await processDirectory(dirPath);
      return totalSize;
    } catch (error) {
      logger.error('Failed to get directory size:', error);
      throw error;
    }
  }

  // Create backup of file
  static async backupFile(filePath, backupDir = null) {
    try {
      const filename = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${timestamp}_${filename}`;
      
      const backupPath = backupDir 
        ? path.join(backupDir, backupFilename)
        : path.join(path.dirname(filePath), 'backups', backupFilename);
      
      await this.copyFile(filePath, backupPath);
      logger.info('File backup created:', backupPath);
      return backupPath;
    } catch (error) {
      logger.error('Failed to backup file:', error);
      throw error;
    }
  }

  // Extract metadata from file
  static async extractMetadata(filePath) {
    try {
      const stats = await this.getFileStats(filePath);
      const extension = this.getFileExtension(filePath);
      const mimeType = this.getMimeType(filePath);
      const category = this.getFileCategory(mimeType);
      
      let metadata = {
        filename: path.basename(filePath),
        extension,
        mimeType,
        category,
        size: stats.size,
        formattedSize: this.formatFileSize(stats.size),
        created: stats.created,
        modified: stats.modified,
        accessed: stats.accessed
      };
      
      // Add specific metadata based on file type
      if (category === 'images') {
        // metadata.dimensions = await this.getImageDimensions(filePath);
      } else if (category === 'video') {
        // metadata.duration = await this.getVideoDuration(filePath);
      }
      
      return metadata;
    } catch (error) {
      logger.error('Failed to extract metadata:', error);
      throw error;
    }
  }
}

module.exports = FileHelper;