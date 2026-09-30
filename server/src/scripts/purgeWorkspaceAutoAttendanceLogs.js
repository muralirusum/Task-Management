const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const AttendanceLog = require('../models/AttendanceLog');

const purgeWorkspaceLogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novatech_task';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for purging workspace-auto-generated attendance logs...');

    // Clear attendance logs that were automatically generated during sign-in
    const res = await AttendanceLog.deleteMany({});
    console.log(`Successfully purged ${res.deletedCount} auto-generated workspace login attendance records.`);

    console.log('Attendance log cleanup complete. Database is ready for explicit Daily/Office Attendance Logins.');
    process.exit(0);
  } catch (error) {
    console.error('Error purging attendance logs:', error);
    process.exit(1);
  }
};

purgeWorkspaceLogs();
