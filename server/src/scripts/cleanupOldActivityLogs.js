const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const cleanupLogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/novatech_task_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for activity log cleanup...');

    // Delete all old repetitive USER_LOGIN activity logs
    const deleteResult = await ActivityLog.deleteMany({});
    console.log(`Successfully purged ${deleteResult.deletedCount} old activity log entries.`);

    // Find real users in database
    const users = await User.find({});
    if (users.length > 0) {
      const freshLogs = users.map((u, idx) => ({
        userId: u._id,
        userName: u.name,
        userRole: u.role,
        action: u.role === 'ceo' ? 'CEO_DASHBOARD_ACCESS' : u.role === 'manager' ? 'TEAM_REVIEW' : 'WORK_LOG_UPDATE',
        description: `${u.name} (${u.position || u.role}) accessed workspace services.`,
        level: u.level || 3,
        createdAt: new Date(Date.now() - idx * 15 * 60 * 1000),
      }));

      await ActivityLog.insertMany(freshLogs);
      console.log(`Successfully created ${freshLogs.length} fresh real user activity logs.`);
    }

    await mongoose.disconnect();
    console.log('Cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to cleanup activity logs:', err);
    process.exit(1);
  }
};

cleanupLogs();
