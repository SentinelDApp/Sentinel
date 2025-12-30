/**
 * ADMIN SEED SCRIPT
 * 
 * Creates an initial admin user for the Sentinel platform.
 * Run this once to set up your admin account.
 * 
 * Usage: node scripts/seedAdmin.js <walletAddress>
 * Example: node scripts/seedAdmin.js 0x1234567890abcdef1234567890abcdef12345678
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.error('\n❌ Error: Wallet address is required!');
    console.log('\nUsage: node scripts/seedAdmin.js <walletAddress>');
    console.log('Example: node scripts/seedAdmin.js 0x1234567890abcdef1234567890abcdef12345678\n');
    process.exit(1);
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    console.error('\n❌ Error: Invalid Ethereum wallet address format!');
    console.log('Wallet address must be 42 characters starting with 0x\n');
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();
    console.log('\n📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (existingAdmin) {
      console.log('\n⚠️  User with this wallet already exists:');
      console.log(`   Wallet: ${existingAdmin.walletAddress}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.status}`);
      
      if (existingAdmin.role !== 'admin') {
        console.log('\n📝 Updating user role to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.status = 'ACTIVE';
        await existingAdmin.save();
        console.log('✅ User role updated to admin!\n');
      } else {
        console.log('\n✅ User is already an admin!\n');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        walletAddress: walletAddress.toLowerCase(),
        role: 'admin',
        status: 'ACTIVE',
        fullName: 'System Administrator',
        organizationName: 'Sentinel Platform',
        approvedAt: new Date(),
        approvedBy: 'system-seed'
      });

      await adminUser.save();

      console.log('\n✅ Admin user created successfully!');
      console.log('\n📋 Admin Details:');
      console.log(`   Wallet: ${adminUser.walletAddress}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Status: ${adminUser.status}`);
      console.log(`   Nonce: ${adminUser.nonce}`);
      console.log('\n🔐 You can now login with this wallet address.\n');
    }

  } catch (error) {
    console.error('\n❌ Error seeding admin:', error.message);
    if (error.code === 11000) {
      console.log('A user with this wallet address already exists.\n');
    }
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed\n');
    process.exit(0);
  }
};

seedAdmin();
