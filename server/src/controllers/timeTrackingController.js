const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { getAccessibleUserIds, canAccessUser } = require('../middlewares/hierarchy');

// @desc    Get currently active running timer for current user
// @route   GET /api/time/active
// @access  Private
const getActiveTimer = async (req, res) => {
  try {
    const activeEntry = await TimeEntry.findOne({
      userId: req.user._id,
      status: { $in: ['running', 'paused'] },
    }).populate('taskId', 'title product project priority estimatedHours actualHours status');

    res.json({
      success: true,
      activeTimer: activeEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active timer',
      error: error.message,
    });
  }
};

// @desc    Start timer on a task
// @route   POST /api/time/start
// @access  Private
const startTimer = async (req, res) => {
  try {
    const { taskId, note } = req.body;
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'TaskId is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if another timer is running; if so, stop or pause it
    const existingActive = await TimeEntry.findOne({
      userId: req.user._id,
      status: 'running',
    });

    if (existingActive) {
      const now = new Date();
      const sessionSeconds = Math.round((now - new Date(existingActive.startTime)) / 1000);
      existingActive.durationSeconds += sessionSeconds;
      existingActive.status = 'completed';
      existingActive.endTime = now;
      await existingActive.save();
    }

    const entry = await TimeEntry.create({
      userId: req.user._id,
      taskId: task._id,
      startTime: new Date(),
      status: 'running',
      type: 'timer',
      note: note || `Started work on ${task.title}`,
    });

    // Update task status to 'In Progress' if 'Assigned'
    if (task.status === 'Assigned') {
      task.status = 'In Progress';
    }
    task.timerState = {
      isRunning: true,
      lastStartedAt: new Date(),
      totalElapsedSeconds: task.timerState?.totalElapsedSeconds || 0,
    };
    await task.save();

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TIMER_STARTED',
      taskId: task._id,
      taskTitle: task.title,
      description: `${req.user.name} started live work timer on "${task.title}".`,
      level: req.user.level,
      isInternalOnly: false,
    });

    const populatedEntry = await TimeEntry.findById(entry._id).populate(
      'taskId',
      'title product project priority estimatedHours actualHours status'
    );

    res.status(201).json({
      success: true,
      message: 'Timer started',
      activeTimer: populatedEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start timer',
      error: error.message,
    });
  }
};

// @desc    Pause active timer
// @route   POST /api/time/pause
// @access  Private
const pauseTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({
      userId: req.user._id,
      status: 'running',
    }).populate('taskId');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'No running timer found' });
    }

    const now = new Date();
    const sessionSeconds = Math.round((now - new Date(entry.startTime)) / 1000);
    entry.durationSeconds = (entry.durationSeconds || 0) + sessionSeconds;
    entry.status = 'paused';
    entry.endTime = now;
    await entry.save();

    if (entry.taskId) {
      entry.taskId.timerState.isRunning = false;
      entry.taskId.timerState.totalElapsedSeconds += sessionSeconds;
      entry.taskId.actualHours = Number(
        (entry.taskId.timerState.totalElapsedSeconds / 3600).toFixed(2)
      );
      await entry.taskId.save();
    }

    res.json({
      success: true,
      message: 'Timer paused',
      activeTimer: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to pause timer',
      error: error.message,
    });
  }
};

// @desc    Resume paused timer
// @route   POST /api/time/resume
// @access  Private
const resumeTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({
      userId: req.user._id,
      status: 'paused',
    }).populate('taskId');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'No paused timer found to resume' });
    }

    entry.startTime = new Date();
    entry.status = 'running';
    await entry.save();

    if (entry.taskId) {
      entry.taskId.timerState.isRunning = true;
      entry.taskId.timerState.lastStartedAt = new Date();
      await entry.taskId.save();
    }

    res.json({
      success: true,
      message: 'Timer resumed',
      activeTimer: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resume timer',
      error: error.message,
    });
  }
};

// @desc    Stop active/paused timer
// @route   POST /api/time/stop
// @access  Private
const stopTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({
      userId: req.user._id,
      status: { $in: ['running', 'paused'] },
    }).populate('taskId');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'No active timer found to stop' });
    }

    const now = new Date();
    if (entry.status === 'running') {
      const sessionSeconds = Math.round((now - new Date(entry.startTime)) / 1000);
      entry.durationSeconds = (entry.durationSeconds || 0) + sessionSeconds;
    }
    entry.status = 'completed';
    entry.endTime = now;
    await entry.save();

    if (entry.taskId) {
      entry.taskId.timerState.isRunning = false;
      const totalSec = (entry.taskId.timerState.totalElapsedSeconds || 0) + (entry.durationSeconds || 0);
      entry.taskId.timerState.totalElapsedSeconds = totalSec;
      entry.taskId.actualHours = Number((totalSec / 3600).toFixed(2));
      await entry.taskId.save();
    }

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TIMER_STOPPED',
      taskId: entry.taskId ? entry.taskId._id : null,
      taskTitle: entry.taskId ? entry.taskId.title : '',
      description: `${req.user.name} stopped timer. Session duration: ${Math.round(entry.durationSeconds / 60)} minutes.`,
      level: req.user.level,
      isInternalOnly: false,
    });

    res.json({
      success: true,
      message: 'Timer stopped and time recorded successfully',
      recordedDurationMinutes: Math.round(entry.durationSeconds / 60),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop timer',
      error: error.message,
    });
  }
};

// @desc    Add manual time entry
// @route   POST /api/time/manual
// @access  Private
const addManualTime = async (req, res) => {
  try {
    const { taskId, hours, minutes, date, note } = req.body;
    if (!taskId || (!hours && !minutes)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task ID and time spent (hours/minutes)',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const durationSeconds = totalMinutes * 60;

    const entry = await TimeEntry.create({
      userId: req.user._id,
      taskId: task._id,
      startTime: date ? new Date(date) : new Date(),
      endTime: date ? new Date(date) : new Date(),
      durationSeconds,
      type: 'manual',
      note: note || 'Manual time logged',
      status: 'completed',
    });

    // Update task actualHours
    task.actualHours = Number((task.actualHours + totalMinutes / 60).toFixed(2));
    await task.save();

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'MANUAL_TIME_LOGGED',
      taskId: task._id,
      taskTitle: task.title,
      description: `${req.user.name} logged ${totalMinutes} minutes manually on "${task.title}".`,
      level: req.user.level,
      isInternalOnly: false,
    });

    res.status(201).json({
      success: true,
      message: 'Manual time entry saved successfully',
      entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to log manual time',
      error: error.message,
    });
  }
};

// @desc    Get time logs filtered by hierarchy
// @route   GET /api/time/logs
// @access  Private
const getTimeLogs = async (req, res) => {
  try {
    const { userId, taskId } = req.query;
    const accessibleIds = await getAccessibleUserIds(req.user);

    let query = {};
    if (userId) {
      const hasAccess = await canAccessUser(req.user, userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access Denied' });
      }
      query.userId = userId;
    } else {
      query.userId = { $in: accessibleIds };
    }

    if (taskId) {
      query.taskId = taskId;
    }

    const logs = await TimeEntry.find(query)
      .populate('userId', 'name position department role avatar')
      .populate('taskId', 'title product project priority estimatedHours actualHours status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve time logs',
      error: error.message,
    });
  }
};

const getSummaryData = async (req, res) => {
  try {
    const { range = 'thisWeek' } = req.query;
    const accessibleIds = await getAccessibleUserIds(req.user);

    const now = new Date();
    let startDate, endDate;

    if (range === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (range === 'lastWeek') {
      const dayOfWeek = now.getDay();
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const tempDate = new Date(now);
      startDate = new Date(tempDate.setDate(diffToMonday - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else { // thisWeek
      const dayOfWeek = now.getDay();
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const tempDate = new Date(now);
      startDate = new Date(tempDate.setDate(diffToMonday));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const timeLogs = await TimeEntry.find({
      userId: { $in: accessibleIds },
      startTime: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'taskId',
      select: 'title estimatedHours actualHours status priority dueDate assignedTo'
    });

    const totalSeconds = timeLogs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
    const totalWorkedHours = Math.floor(totalSeconds / 3600);
    const totalWorkedMinutes = Math.floor((totalSeconds % 3600) / 60);

    const taskIds = [...new Set(timeLogs.filter(log => log.taskId).map(log => log.taskId._id.toString()))];
    
    const periodTasks = await Task.find({
      assignedTo: { $in: accessibleIds },
      $or: [
        { _id: { $in: taskIds } },
        { dueDate: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ]
    })
    .populate('assignedTo', 'name')
    .select('title estimatedHours actualHours status dueDate priority assignedTo');

    const totalTasks = periodTasks.length;
    const completedTasks = periodTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    
    const estimatedHoursDecimal = periodTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    const estimatedHours = Math.floor(estimatedHoursDecimal);
    const estimatedMinutes = Math.round((estimatedHoursDecimal - estimatedHours) * 60);

    let overtimeDecimal = 0;
    periodTasks.forEach(t => {
       if ((t.actualHours || 0) > (t.estimatedHours || 0)) {
          overtimeDecimal += (t.actualHours - t.estimatedHours);
       }
    });
    const overtimeHours = Math.floor(overtimeDecimal);
    const overtimeMinutes = Math.round((overtimeDecimal - overtimeHours) * 60);

    const dailyLogs = {};
    timeLogs.forEach(log => {
      const dateStr = new Date(log.startTime).toISOString().split('T')[0];
      if (!dailyLogs[dateStr]) dailyLogs[dateStr] = { durationSeconds: 0, logs: [] };
      dailyLogs[dateStr].durationSeconds += log.durationSeconds || 0;
      dailyLogs[dateStr].logs.push(log);
    });

    res.json({
      success: true,
      summary: {
        totalWorkedHours,
        totalWorkedMinutes,
        estimatedHours,
        estimatedMinutes,
        overtimeHours,
        overtimeMinutes,
        completedTasks,
        totalTasks
      },
      details: {
        periodTasks,
        dailyLogs,
        startDate,
        endDate
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary data', error: error.message });
  }
};

module.exports = {
  getActiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  addManualTime,
  getTimeLogs,
  getSummaryData,
};
