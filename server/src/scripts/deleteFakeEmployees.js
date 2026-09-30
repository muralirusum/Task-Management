const { connectDB } = require('../config/db');
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB via connectDB');

    const resUsers = await User.deleteMany({
      email: { $in: ['employ@cgxptech.com', 'employ@novatech.com'] }
    });

    console.log(`Successfully deleted ${resUsers.deletedCount} fake employee accounts.`);

    const resLogs = await AttendanceLog.deleteMany({
      name: 'Employee User'
    });
    console.log(`Successfully deleted ${resLogs.deletedCount} fake attendance log records.`);

    process.exit(0);
  } catch (error) {
    console.error('Error deleting fake employees:', error);
    process.exit(1);
  }
};

run();
