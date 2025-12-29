require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const Stakeholder = require('./models/Stakeholder');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. SETUP FILE STORAGE (For ID Documents)
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

// Create 'uploads' folder if it doesn't exist
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// ================= ROUTES ================= //

// A. SUBMIT REGISTRATION (User Side)
app.post('/api/register', upload.single('verificationDoc'), async (req, res) => {
  try {
    const { walletAddress, fullName, role } = req.body;
    
    if (!walletAddress || !fullName || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Verification document is required" });
    }

    // Check if already exists
    const existing = await Stakeholder.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Wallet already registered" });
    }

    const newRequest = new Stakeholder({
      walletAddress: walletAddress.toLowerCase(),
      fullName,
      role,
      documentPath: req.file.path
    });

    await newRequest.save();
    res.status(201).json({ message: "Request submitted successfully!" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
});

// B. GET ALL REQUESTS (Admin Dashboard Side)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const requests = await Stakeholder.find(filter).sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// C. GET SINGLE REQUEST BY ID
app.get('/api/admin/request/:id', async (req, res) => {
  try {
    const request = await Stakeholder.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// D. APPROVE/REJECT REQUEST (Admin Action)
app.put('/api/admin/request/:id', async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { 
      status,
      ...(status === 'Approved' && { 
        approvedDate: new Date(),
        approvedBy: approvedBy || 'Admin'
      })
    };

    const updatedUser = await Stakeholder.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// E. GET STATS FOR DASHBOARD
app.get('/api/admin/stats', async (req, res) => {
  try {
    const total = await Stakeholder.countDocuments();
    const pending = await Stakeholder.countDocuments({ status: 'Pending' });
    const approved = await Stakeholder.countDocuments({ status: 'Approved' });
    const rejected = await Stakeholder.countDocuments({ status: 'Rejected' });
    
    const byRole = await Stakeholder.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({ total, pending, approved, rejected, byRole });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// F. CHECK WALLET STATUS (for login verification)
app.get('/api/check-wallet/:address', async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findOne({ 
      walletAddress: req.params.address.toLowerCase() 
    });
    
    if (!stakeholder) {
      return res.json({ registered: false });
    }
    
    res.json({ 
      registered: true, 
      status: stakeholder.status,
      role: stakeholder.role,
      fullName: stakeholder.fullName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));