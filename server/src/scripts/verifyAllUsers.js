const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const verifyAllUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novatech_task';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for verifying user accounts...');

    const res = await User.updateMany(
      { emailVerified: false },
      { $set: { emailVerified: true, otpCode: null, otpCodeHash: null, otpExpire: null } }
    );

    console.log(`Successfully verified ${res.modifiedCount} user accounts.`);
    process.exit(0);
  } catch (error) {
    console.error('Error verifying user accounts:', error);
    process.exit(1);
  }
};

verifyAllUsers();
