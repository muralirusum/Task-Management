const Approval = require('../models/Approval');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { getAccessibleUserIds, getSubordinateIds } = require('../middlewares/hierarchy');
const { maskApprovalsForUser, maskTaskForUser } = require('../middlewares/privacyMask');

// @desc    Get approval history based on role permissions
// @route   GET /api/approvals
// @access  Private (Main & Middle only; Last person receives empty)
const getApprovals = async (req, res) => {
  try {
    if (req.user.role === 'employee' || req.user.role === 'last' || req.user.level >= 3) {
      // Employees NEVER see internal approval logs
      return res.json({ success: true, count: 0, approvals: [] });
    }

    let query = {};
    if (req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2) {
      const subIds = await getSubordinateIds(req.user._id);
      // Find tasks assigned to subordinates
      const teamTasks = await Task.find({ assignedTo: { $in: subIds } }).select('_id');
      const teamTaskIds = teamTasks.map((t) => t._id);

      query = {
        $or: [
          { reviewerId: req.user._id },
          { taskId: { $in: teamTaskIds } },
        ],
      };
    }

    const approvals = await Approval.find(query)
      .populate('taskId', 'title product project priority status')
      .populate('reviewerId', 'name position role avatar')
      .sort({ reviewedAt: -1 });

    const maskedApprovals = maskApprovalsForUser(approvals, req.user);

    res.json({
      success: true,
      count: maskedApprovals.length,
      approvals: maskedApprovals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approvals',
      error: error.message,
    });
  }
};

// @desc    Get pending tasks waiting for approval by this manager/CEO
// @route   GET /api/approvals/pending
// @access  Private (CEO & Manager)
const getPendingApprovals = async (req, res) => {
  try {
    if (req.user.role === 'employee' || req.user.role === 'last' || req.user.level >= 3) {
      return res.json({ success: true, count: 0, tasks: [] });
    }

    let query = {};

    if (req.user.role === 'ceo' || req.user.role === 'main' || req.user.level === 1) {
      // CEO sees tasks Forwarded to Main OR Submitted directly
      query = {
        status: { $in: ['Forwarded to Main', 'Submitted', 'Under Review'] },
      };
    } else if (req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2) {
      // Manager sees Submitted tasks from their own subordinates
      const subIds = await getSubordinateIds(req.user._id);
      query = {
        assignedTo: { $in: subIds },
        status: { $in: ['Submitted', 'Under Review'] },
        approvalStage: { $lte: 1 },
      };
    }

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name position department role avatar')
      .populate('assignedTo', 'name position department role avatar')
      .sort({ submittedAt: -1, updatedAt: -1 });

    const maskedTasks = tasks.map((t) => maskTaskForUser(t, req.user));

    res.json({
      success: true,
      count: maskedTasks.length,
      tasks: maskedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: error.message,
    });
  }
};

// @desc    Manager Review: Approve & Forward to CEO
// @route   POST /api/approvals/:taskId/middle-approve
// @access  Private (Manager / CEO)
const middlePersonApprove = async (req, res) => {
  try {
    const { comments, action } = req.body;
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name position department managerId')
      .populate('assignedBy', 'name position');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Record Manager Approval
    await Approval.create({
      taskId: task._id,
      reviewerId: req.user._id,
      reviewerRole: req.user.role,
      action: 'approved_and_forwarded',
      status: 'Forwarded',
      comments: comments || 'Reviewed and approved by Operations/Sales Manager. Forwarding to CEO.',
      isInternalOnly: true,
      level: 1,
      reviewedAt: new Date(),
    });

    // Update Task status
    task.status = 'Forwarded to Main';
    task.approvalStage = 2; // Moved to Stage 2: Waiting for CEO
    await task.save();

    // Notify CEO
    const ceoPerson = await User.findOne({ $or: [{ role: 'ceo' }, { role: 'main' }, { level: 1 }] });
    if (ceoPerson) {
      await Notification.create({
        userId: ceoPerson._id,
        type: 'task_forwarded',
        title: 'Task Awaiting CEO Approval',
        message: `${req.user.name} reviewed & forwarded task "${task.title}" (completed by ${task.assignedTo.name}) for your final review.`,
        taskId: task._id,
      });
    }

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_APPROVED_AND_FORWARDED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: task.assignedTo._id,
      targetUserName: task.assignedTo.name,
      description: `${req.user.name} approved task "${task.title}" and forwarded it to CEO.`,
      level: req.user.level,
      isInternalOnly: true,
    });

    res.json({
      success: true,
      message: 'Task approved and successfully forwarded to CEO for final review.',
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve and forward task',
      error: error.message,
    });
  }
};

// @desc    CEO Final Approval
// @route   POST /api/approvals/:taskId/main-approve
// @access  Private (CEO Only)
const mainPersonApprove = async (req, res) => {
  try {
    if (req.user.role !== 'ceo' && req.user.role !== 'main' && req.user.level !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Only CEO can give final organization approval.',
      });
    }

    const { comments } = req.body;
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name position managerId')
      .populate('assignedBy', 'name position');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Record Final Approval
    await Approval.create({
      taskId: task._id,
      reviewerId: req.user._id,
      reviewerRole: req.user.role,
      action: 'main_approved',
      status: 'Approved',
      comments: comments || 'Final review approved by CEO.',
      isInternalOnly: true,
      level: 2,
      reviewedAt: new Date(),
    });

    // Mark task as Completed & Approved
    task.status = 'Completed';
    task.approvalStage = 3;
    await task.save();

    // Notify Assignee that task is Completed
    await Notification.create({
      userId: task.assignedTo._id,
      type: 'task_approved',
      title: 'Task Approved & Completed',
      message: `Your task "${task.title}" has been reviewed, approved, and marked as Completed.`,
      taskId: task._id,
    });

    // Notify Middle Manager if exists
    if (task.assignedTo.managerId) {
      await Notification.create({
        userId: task.assignedTo.managerId,
        type: 'task_approved',
        title: 'Team Task Final Approved',
        message: `Operations Director approved "${task.title}" for ${task.assignedTo.name}.`,
        taskId: task._id,
      });
    }

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_FINAL_APPROVED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: task.assignedTo._id,
      targetUserName: task.assignedTo.name,
      description: `${req.user.name} granted final approval for task "${task.title}". Task is now Completed.`,
      level: req.user.level,
      isInternalOnly: false,
    });

    res.json({
      success: true,
      message: 'Task has been granted final approval and marked Completed.',
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to give final approval',
      error: error.message,
    });
  }
};

// @desc    Reject Task or Request Changes
// @route   POST /api/approvals/:taskId/reject
// @access  Private (Main & Middle)
const rejectTask = async (req, res) => {
  try {
    const { reason, requestChangesOnly } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason or feedback for rejecting / requesting changes.',
      });
    }

    const task = await Task.findById(req.params.taskId).populate('assignedTo', 'name position');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const actionType = requestChangesOnly ? 'changes_requested' : 'rejected';
    const statusType = requestChangesOnly ? 'Changes Requested' : 'Rejected';

    await Approval.create({
      taskId: task._id,
      reviewerId: req.user._id,
      reviewerRole: req.user.role,
      action: actionType,
      status: statusType,
      comments: reason,
      isInternalOnly: false, // Visible as feedback to assignee
      level: req.user.level,
      reviewedAt: new Date(),
    });

    task.status = 'Rejected';
    task.rejectionReason = reason;
    task.approvalStage = 0;
    await task.save();

    // Send notification with feedback to assignee
    await Notification.create({
      userId: task.assignedTo._id,
      type: 'task_rejected',
      title: requestChangesOnly ? 'Changes Requested on Task' : 'Task Rejected',
      message: `${req.user.name} reviewed "${task.title}": "${reason}". Please update and resubmit.`,
      taskId: task._id,
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: requestChangesOnly ? 'TASK_CHANGES_REQUESTED' : 'TASK_REJECTED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: task.assignedTo._id,
      targetUserName: task.assignedTo.name,
      description: `${req.user.name} rejected task "${task.title}" with reason: "${reason}".`,
      level: req.user.level,
      isInternalOnly: false,
    });

    res.json({
      success: true,
      message: `Task returned to ${task.assignedTo.name} with feedback.`,
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject task',
      error: error.message,
    });
  }
};

module.exports = {
  getApprovals,
  getPendingApprovals,
  middlePersonApprove,
  mainPersonApprove,
  rejectTask,
};
