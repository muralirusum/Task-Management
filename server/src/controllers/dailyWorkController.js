const DailyWork = require('../models/DailyWork');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { getAccessibleUserIds, canAccessUser } = require('../middlewares/hierarchy');

// @desc    Get daily work entries
// @route   GET /api/daily-work
// @access  Private
const getDailyWork = async (req, res) => {
  try {
    const { userId, date, startDate, endDate, project } = req.query;
    const accessibleIds = await getAccessibleUserIds(req.user);

    let query = {};

    if (userId) {
      const hasAccess = await canAccessUser(req.user, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied to this employee daily work logs',
        });
      }
      query.userId = userId;
    } else {
      query.userId = { $in: accessibleIds };
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    if (project && project !== 'All') {
      query.project = project;
    }

    const entries = await DailyWork.find(query)
      .populate('userId', 'name position department role avatar')
      .populate('taskId', 'title product project priority status')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily work entries',
      error: error.message,
    });
  }
};

// @desc    Create daily work entry
// @route   POST /api/daily-work
// @access  Private
const createDailyWork = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      durationMinutes,
      taskId,
      project,
      product,
      notes,
      date,
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, start time, and end time for this work entry',
      });
    }

    let resolvedProject = project;
    let resolvedProduct = product;

    if (taskId) {
      const task = await Task.findById(taskId);
      if (task) {
        resolvedProject = resolvedProject || task.project;
        resolvedProduct = resolvedProduct || task.product;

        // Automatically accumulate time on task if duration provided
        if (durationMinutes) {
          task.actualHours = Number((task.actualHours + durationMinutes / 60).toFixed(2));
          await task.save();
        }
      }
    }

    const entry = await DailyWork.create({
      userId: req.user._id,
      taskId: taskId || null,
      date: date ? new Date(date) : new Date(),
      title,
      description: description || '',
      startTime,
      endTime,
      durationMinutes: durationMinutes || 60,
      project: resolvedProject || 'General Operations',
      product: resolvedProduct || 'NovaCRM',
      notes: notes || '',
    });

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'WORK_LOGGED',
      taskId: taskId || null,
      description: `${req.user.name} logged work: "${title}" (${durationMinutes || 60} mins).`,
      level: req.user.level,
      isInternalOnly: false,
    });

    const populatedEntry = await DailyWork.findById(entry._id)
      .populate('userId', 'name position department role avatar')
      .populate('taskId', 'title product project priority status');

    res.status(201).json({
      success: true,
      message: 'Daily work logged successfully',
      entry: populatedEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record daily work entry',
      error: error.message,
    });
  }
};

// @desc    Delete daily work entry
// @route   DELETE /api/daily-work/:id
// @access  Private
const deleteDailyWork = async (req, res) => {
  try {
    const entry = await DailyWork.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Work entry not found' });
    }

    if (entry.userId.toString() !== req.user._id.toString() && req.user.role !== 'main') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this entry' });
    }

    await entry.deleteOne();

    res.json({
      success: true,
      message: 'Work entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete work entry',
      error: error.message,
    });
  }
};

module.exports = {
  getDailyWork,
  createDailyWork,
  deleteDailyWork,
};
