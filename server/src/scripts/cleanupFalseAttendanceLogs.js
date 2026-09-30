const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');

const cleanupFalseLogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novatech_task';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Attendance Log Cleanup...');

    // 1. Delete fake/demo logs
    const fakeRes = await AttendanceLog.deleteMany({
      $or: [
        { email: { $in: ['employ@cgxptech.com', 'employ@novatech.com', 'manager@novatech.com', 'ceo@novatech.com'] } },
        { name: { $in: ['Employee User', 'Manager User', 'Admin CEO'] } }
      ]
    });
    console.log(`Deleted ${fakeRes.deletedCount} legacy fake attendance logs.`);

    // 2. Delete orphaned logs for deleted users
    const validUsers = await User.find().select('_id');
    const validUserIds = validUsers.map(u => u._id);
    const orphanRes = await AttendanceLog.deleteMany({ userId: { $nin: validUserIds } });
    console.log(`Deleted ${orphanRes.deletedCount} orphaned attendance logs.`);

    console.log('Attendance Log Cleanup Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up attendance logs:', error);
    process.exit(1);
  }
};

cleanupFalseLogs();
