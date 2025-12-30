/**
 * FILE UPLOAD MIDDLEWARE
 * 
 * Uses Multer with memory storage for Cloudinary uploads.
 * Files are NOT stored locally - they're kept in memory buffer
 * and uploaded directly to Cloudinary.
 * 
 * SECURITY:
 * - File type validation (JPG, PNG only - NO PDFs)
 * - File size limit (1MB)
 * - Memory storage prevents local file storage
 */

const multer = require('multer');

// Use memory storage - files go to buffer, not disk
// This is required for Cloudinary upload from buffer
const storage = multer.memoryStorage();

// File filter - only accept images (JPG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'), false);
  }
};

// Configure multer with memory storage and validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single verification document upload
// Field name: 'verificationDocument'
const uploadVerificationDocument = upload.single('verificationDocument');

// Error handling wrapper for multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 1MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    // Custom file filter errors
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  uploadVerificationDocument,
  handleUploadErrors
};
