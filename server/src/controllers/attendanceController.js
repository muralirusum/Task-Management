const AttendanceLog = require('../models/AttendanceLog');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// @desc    Mark attendance (login/logout)
// @route   POST /api/attendance/log
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { action, date, timestamp } = req.body;
    
    // We already have user from auth middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const log = await AttendanceLog.create({
      userId: user._id,
      name: user.name,
      role: user.role,
      department: user.department,
      action,
      date,
      timestamp
    });

    res.status(201).json({
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

module.exports = {
  markAttendance,
  getLogs,
  requestLeave,
  getLeaves,
  updateLeaveStatus
};
