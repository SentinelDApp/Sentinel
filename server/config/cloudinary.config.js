/**
 * CLOUDINARY CONFIGURATION
 * 
 * Sentinel uses Cloudinary for secure off-chain storage of verification documents.
 * This keeps sensitive identity documents separate from blockchain data.
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Always use HTTPS
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Object>} - Cloudinary upload result with secure_url and public_id
 */
const uploadToCloudinary = (fileBuffer, options = {}, mimeType = '') => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file type
    // PDFs must be uploaded as 'raw' for proper access
    // Images can use 'image' type
    let resourceType = 'auto';
    if (mimeType === 'application/pdf') {
      resourceType = 'raw';
    } else if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    }

    // Default options for verification documents
    const uploadOptions = {
      folder: 'sentinel/verification-documents', // Organized folder structure
      resource_type: resourceType,
      access_mode: 'public', // Make files publicly accessible
      ...options
    };

    // Create upload stream from buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public_id of the file to delete
 * @returns {Promise<Object>} - Cloudinary delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
