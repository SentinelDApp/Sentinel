require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Database & Models
const connectDB = require('./config/db');
const StakeholderRequest = require('./models/StakeholderRequest');
const User = require('./models/User');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ================= DATABASE CONNECTION ================= //
connectDB();

// ================= MIDDLEWARE ================= //
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= FILE UPLOAD CONFIG ================= //
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

// Create uploads folder if not exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// ================= ROUTES ================= //

// Auth routes (login flow)
app.use('/api/auth', authRoutes);

// Admin routes (protected)
app.use('/api/admin', adminRoutes);

// ================= REGISTRATION ENDPOINT ================= //
/**
 * STAKEHOLDER REGISTRATION
 * 
 * This is the entry point for new stakeholders.
 * They submit their wallet, info, and documents.
 * Admin must approve before they can access the system.
 */
app.post('/api/register', upload.single('verificationDoc'), async (req, res) => {
  try {
    const { walletAddress, fullName, role, organizationName } = req.body;

    // Validation
    if (!walletAddress || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, full name, and role are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Verification document is required'
      });
    }

    const normalizedWallet = walletAddress.toLowerCase();

    // Check if wallet already has a pending/approved request
    const existingRequest = await StakeholderRequest.findOne({
      walletAddress: normalizedWallet
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending registration request'
        });
      }
      if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'This wallet is already registered and approved'
        });
      }
      // If REJECTED, allow re-registration by updating the existing request
      existingRequest.fullName = fullName;
      existingRequest.requestedRole = role.toLowerCase();
      existingRequest.organizationName = organizationName || '';
      existingRequest.verificationDocumentPath = req.file.path;
      existingRequest.status = 'PENDING';
      existingRequest.rejectionReason = null;
      existingRequest.createdAt = new Date();
      await existingRequest.save();

      return res.status(201).json({
        success: true,
        message: 'Registration request resubmitted successfully. Wait for admin approval.'
      });
    }

    // Check if wallet already exists as approved user
    const existingUser = await User.findOne({ walletAddress: normalizedWallet });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This wallet is already registered'
      });
    }

    // Create new request
    const newRequest = new StakeholderRequest({
      walletAddress: normalizedWallet,
      fullName,
      requestedRole: role.toLowerCase(),
      organizationName: organizationName || '',
      verificationDocumentPath: req.file.path
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. Wait for admin approval.'
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// ================= HEALTH CHECK ================= //
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ================= ERROR HANDLING ================= //
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ================= SEED ADMIN (Development Only) ================= //
const seedAdmin = async () => {
  try {
    const adminWallet = process.env.ADMIN_WALLET_ADDRESS;
    if (!adminWallet || adminWallet === '0xYourAdminWalletAddressHere') {
      console.log('⚠️ No admin wallet configured. Set ADMIN_WALLET_ADDRESS in .env');
      return;
    }

    const existingAdmin = await User.findOne({ 
      walletAddress: adminWallet.toLowerCase() 
    });

    if (!existingAdmin) {
      const admin = new User({
        walletAddress: adminWallet.toLowerCase(),
        role: 'admin',
        status: 'ACTIVE',
        fullName: 'System Administrator',
        organizationName: 'Sentinel',
        approvedBy: 'system'
      });
      await admin.save();
      console.log('✅ Admin user created:', adminWallet);
    } else {
      console.log('✅ Admin already exists:', adminWallet);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// ================= START SERVER ================= //
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Seed admin on startup
  await seedAdmin();
});