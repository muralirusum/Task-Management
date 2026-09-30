const AttendanceLog = require('../models/AttendanceLog');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// @desc    Mark attendance (login/logout)
// @route   POST /api/attendance/log
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { action, date, timestamp, location } = req.body;
    
    // We already have user from auth middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Auto-close any unclosed active logs from previous days for this user
    await AttendanceLog.updateMany(
      { userId: user._id, status: 'active', date: { $ne: date } },
      { $set: { status: 'incomplete' } }
    );

    // Look for an existing record for this user on this specific date or active session
    let log = await AttendanceLog.findOne({ userId: user._id, date });
    if (!log && action === 'logout') {
      log = await AttendanceLog.findOne({ userId: user._id, status: 'active' });
    }

    if (action === 'login') {
      if (log) {
        if (log.status === 'active') {
          return res.status(200).json({
            success: true,
            message: 'You are already logged in for attendance.',
            log
          });
        }
        // Reactivate session if previously completed/incomplete
        log.status = 'active';
        log.timestamp = timestamp || Date.now();
        if (location) log.location = location;
        await log.save();
      } else {
        // First attendance login of the day
        log = await AttendanceLog.create({
          userId: user._id,
          name: user.name,
          role: user.role,
          department: user.department,
          managerId: user.managerId,
          action: 'login',
          date,
          timestamp: timestamp || Date.now(),
          location,
          status: 'active',
          ipAddress: req.ip || req.connection.remoteAddress
        });
      }
    } else if (action === 'logout') {
      if (log) {
        // Update the existing record with the latest logout time
        log.logoutTimestamp = timestamp || Date.now();
        log.logoutLocation = location;
        log.status = 'completed';
        await log.save();
      } else {
        log = await AttendanceLog.create({
          userId: user._id,
          name: user.name,
          role: user.role,
          department: user.department,
          managerId: user.managerId,
          action: 'logout',
          date,
          timestamp: timestamp,
          logoutTimestamp: timestamp,
          logoutLocation: location,
          status: 'completed',
          ipAddress: req.ip || req.connection.remoteAddress
        });
      }
    }

    return res.status(200).json({
      success: true,
      log
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all attendance logs
// @route   GET /api/attendance/logs
// @access  Private
const getLogs = async (req, res) => {
  try {
    // Automatically purge legacy fake/demo logs and orphaned logs safely
    try {
      const validUsers = await User.find().select('_id');
      const validUserIds = validUsers.map(u => u._id);

      await AttendanceLog.deleteMany({
        $or: [
          { email: { $in: ['employ@cgxptech.com', 'employ@novatech.com', 'manager@novatech.com', 'ceo@novatech.com'] } },
          { name: { $in: ['Employee User', 'Manager User', 'Admin CEO'] } },
          { userId: { $nin: validUserIds } }
        ]
      });
    } catch (cleanErr) {
      console.warn('[AttendanceLog Cleanup] Non-fatal warning:', cleanErr.message);
    }

    const logs = await AttendanceLog.find().sort({ timestamp: -1 });
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Submit a leave request
// @route   POST /api/attendance/leave
// @access  Private
const requestLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, days } = req.body;
    
    const user = await User.findById(req.user._id);

    const leave = await LeaveRequest.create({
      userId: user._id,
      name: user.name,
      role: user.role,
      department: user.department,
      leaveType,
      fromDate,
      toDate,
      reason,
      days
    });

    res.status(201).json({
      success: true,
      leave
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all leave requests
// @route   GET /api/attendance/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      leaves
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update leave status
// @route   PATCH /api/attendance/leave/:id
// @access  Private (Manager/CEO)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leaveId = req.params.id;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.reviewedBy = req.user.name;
    await leave.save();

    res.status(200).json({
      success: true,
      leave
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Clear attendance logs
// @route   DELETE /api/attendance/logs
// @access  Private
const clearLogs = async (req, res) => {
  try {
    await AttendanceLog.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'Attendance logs cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete attendance logs for a specific user
// @route   DELETE /api/attendance/logs/user/:userId
// @access  Private
const deleteUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    await AttendanceLog.deleteMany({ userId });
    res.status(200).json({
      success: true,
      message: 'User attendance logs deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  markAttendance,
  getLogs,
  clearLogs,
  deleteUserLogs,
  requestLeave,
  getLeaves,
  updateLeaveStatus
};
