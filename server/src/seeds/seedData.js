const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Task = require('../models/Task');
const DailyWork = require('../models/DailyWork');
const Approval = require('../models/Approval');
const TimeEntry = require('../models/TimeEntry');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const AttendanceLog = require('../models/AttendanceLog');
const LeaveRequest = require('../models/LeaveRequest');

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Starting database cleanup for NovaTech Solutions Pvt. Ltd....');

    // Clear existing collections
    await User.deleteMany({});
    await Task.deleteMany({});
    await DailyWork.deleteMany({});
    await Approval.deleteMany({});
    await TimeEntry.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await AttendanceLog.deleteMany({});
    await LeaveRequest.deleteMany({});

    console.log('[Seed] Cleared all existing mock data.');

    // CREATE ONLY THE DEFAULT CEO ACCOUNT
    await User.create({
      name: 'Admin CEO',
      email: 'ceo@novatech.com',
      password: 'Demo@123',
      role: 'ceo',
      position: 'Chief Executive Officer (CEO)',
      department: 'Executive Management',
      managerId: null,
      level: 1,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      phone: '+91 98765 11001',
      status: 'active',
    });

    console.log('[Seed] Created default CEO account (ceo@novatech.com / Demo@123). No other data was created.');

  } catch (error) {
    console.error('[Seed] Error during cleanup:', error);
    process.exit(1);
  }
};

module.exports = seedDatabase;
