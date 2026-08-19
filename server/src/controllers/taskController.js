const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { getAccessibleUserIds, canAccessUser } = require('../middlewares/hierarchy');
const { maskTaskForUser } = require('../middlewares/privacyMask');

// @desc    Get tasks filtered by hierarchy visibility
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const accessibleIds = await getAccessibleUserIds(req.user);
    const { status, priority, department, search, project, product, assignedTo } = req.query;

    let query = {};

    if (req.user.role === 'ceo' || req.user.role === 'main' || req.user.level === 1) {
      // CEO sees all org tasks, can filter by assignedTo
      if (assignedTo) query.assignedTo = assignedTo;
    } else if (req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2) {
      // Manager sees their own tasks + their team's tasks
      if (assignedTo && accessibleIds.includes(assignedTo)) {
        query.assignedTo = assignedTo;
      } else {
        query.$or = [
          { assignedTo: { $in: accessibleIds } },
          { assignedBy: req.user._id },
        ];
      }
    } else {
      // Employee ONLY sees tasks assigned to them
      query.assignedTo = req.user._id;
    }

    if (status && status !== 'All') {
      if (status === 'Submitted') {
        // Last person searching for submitted includes Under Review / Forwarded
        query.status = { $in: ['Submitted', 'Under Review', 'Forwarded to Main'] };
      } else {
        query.status = status;
      }
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (project && project !== 'All') {
      query.project = project;
    }

    if (product && product !== 'All') {
      query.product = product;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name position department role avatar')
      .populate('assignedTo', 'name position department role avatar')
      .sort({ createdAt: -1 });

    // Apply privacy masking to every task document
    const maskedTasks = tasks.map((t) => maskTaskForUser(t, req.user));

    res.json({
      success: true,
      count: maskedTasks.length,
      tasks: maskedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message,
    });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private (Hierarchy Guarded)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name position department role avatar')
      .populate('assignedTo', 'name position department role avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check visibility permission
    const canAccessAssignee = await canAccessUser(req.user, task.assignedTo._id);
    const isAssigner = task.assignedBy._id.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();

    if (!canAccessAssignee && !isAssigner && !isAssignee && req.user.role !== 'main') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to view this task.',
      });
    }

    const maskedTask = maskTaskForUser(task, req.user);

    res.json({
      success: true,
      task: maskedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task details',
      error: error.message,
    });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Main & Middle only)
const createTask = async (req, res) => {
  try {
    if (req.user.role === 'employee' || req.user.role === 'last' || req.user.level >= 3) {
      return res.status(403).json({
        success: false,
        message: 'Employees are not permitted to assign tasks.',
      });
    }

    const {
      title,
      description,
      taskType,
      product,
      project,
      customer,
      assignedTo,
      priority,
      startDate,
      dueDate,
      estimatedHours,
      tags,
    } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (title, description, assignedTo, dueDate)',
      });
    }

    // Verify assigner can manage the assignee
    const canManageAssignee = await canAccessUser(req.user, assignedTo);
    if (!canManageAssignee && req.user.role !== 'main') {
      return res.status(403).json({
        success: false,
        message: 'You can only assign tasks to employees within your reporting hierarchy.',
      });
    }

    const targetUser = await User.findById(assignedTo);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Assignee employee not found' });
    }

    const task = await Task.create({
      title,
      description,
      taskType: taskType || 'General Work',
      product: product || 'NovaCRM',
      project: project || 'Customer Operations',
      customer: customer || '',
      assignedBy: req.user._id,
      assignedTo: targetUser._id,
      department: targetUser.department,
      priority: priority || 'Medium',
      status: 'Assigned',
      startDate: startDate || new Date(),
      dueDate: new Date(dueDate),
      estimatedHours: estimatedHours || 4,
      tags: tags || [],
    });

    // Send notification to assignee
    await Notification.create({
      userId: targetUser._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${req.user.name} (${req.user.position}) assigned you: "${title}". Due by ${new Date(dueDate).toLocaleDateString()}.`,
      taskId: task._id,
    });

    // Log Activity / Audit
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_ASSIGNED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: targetUser._id,
      targetUserName: targetUser.name,
      description: `${req.user.name} assigned task "${task.title}" to ${targetUser.name}.`,
      level: req.user.level,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'name position department role avatar')
      .populate('assignedTo', 'name position department role avatar');

    res.status(201).json({
      success: true,
      message: 'Task successfully created and assigned',
      task: maskTaskForUser(populatedTask, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

// @desc    Update task status / progress
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const canManage = await canAccessUser(req.user, task.assignedTo);

    if (!isAssignee && !canManage && req.user.role !== 'main') {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this task status' });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_STATUS_UPDATED',
      taskId: task._id,
      taskTitle: task.title,
      description: `${req.user.name} changed task status from "${oldStatus}" to "${status}".`,
      level: req.user.level,
    });

    res.json({
      success: true,
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message,
    });
  }
};

// @desc    Submit task for manager review
// @route   POST /api/tasks/:id/submit
// @access  Private (Assignee)
const submitTask = async (req, res) => {
  try {
    const { notes, attachments } = req.body;
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email position')
      .populate('assignedTo', 'name email position managerId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can submit this task.' });
    }

    task.status = 'Submitted';
    task.submittedAt = new Date();
    task.submissionNotes = notes || 'Task completed and submitted for review.';
    if (attachments && Array.isArray(attachments)) {
      task.submissionAttachments = attachments;
    }
    task.approvalStage = 1; // Stage 1: Submitted to direct manager
    await task.save();

    // Determine who to notify: if assignedBy exists notify them; also notify manager
    const reviewerId = task.assignedBy._id || task.assignedTo.managerId;

    if (reviewerId) {
      await Notification.create({
        userId: reviewerId,
        type: 'task_submitted',
        title: 'Task Submitted for Review',
        message: `${req.user.name} submitted task: "${task.title}". Please review and approve.`,
        taskId: task._id,
      });
    }

    // Audit log
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_SUBMITTED',
      taskId: task._id,
      taskTitle: task.title,
      description: `${req.user.name} submitted task "${task.title}" for review.`,
      level: req.user.level,
      isInternalOnly: false,
    });

    res.json({
      success: true,
      message: 'Task submitted successfully. It is now awaiting review.',
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit task',
      error: error.message,
    });
  }
};

// @desc    Add comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { comment, isInternal } = req.body;
    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only managers and main person can post internal notes
    const canPostInternal = (req.user.role === 'main' || req.user.role === 'middle') && isInternal;

    task.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      comment,
      isInternal: !!canPostInternal,
      createdAt: new Date(),
    });

    await task.save();

    res.status(201).json({
      success: true,
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post comment',
      error: error.message,
    });
  }
};

// @desc    Update task deadline
// @route   PUT /api/tasks/:id/deadline
// @access  Private (Main & Middle)
const updateDeadline = async (req, res) => {
  try {
    const { dueDate, reason } = req.body;
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required' });
    }

    const task = await Task.findById(req.params.id).populate('assignedTo', 'name');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const canManage = await canAccessUser(req.user, task.assignedTo._id);
    if (!canManage && req.user.role !== 'main') {
      return res.status(403).json({ success: false, message: 'Unauthorized to change deadline' });
    }

    const oldDueDate = task.dueDate;
    task.dueDate = new Date(dueDate);
    await task.save();

    await Notification.create({
      userId: task.assignedTo._id,
      type: 'deadline_approaching',
      title: 'Task Deadline Updated',
      message: `Deadline for "${task.title}" has been updated to ${new Date(dueDate).toLocaleDateString()}. ${reason ? `Note: ${reason}` : ''}`,
      taskId: task._id,
    });

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DEADLINE_CHANGED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: task.assignedTo._id,
      targetUserName: task.assignedTo.name,
      description: `${req.user.name} changed deadline for "${task.title}" from ${new Date(oldDueDate).toLocaleDateString()} to ${new Date(dueDate).toLocaleDateString()}.`,
      level: req.user.level,
    });

    res.json({
      success: true,
      message: 'Deadline updated successfully',
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update deadline',
      error: error.message,
    });
  }
};

// @desc    Reassign task
// @route   PUT /api/tasks/:id/reassign
// @access  Private (Main & Middle)
const reassignTask = async (req, res) => {
  try {
    const { newAssigneeId, reason } = req.body;
    const task = await Task.findById(req.params.id).populate('assignedTo', 'name');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const targetUser = await User.findById(newAssigneeId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'New assignee not found' });
    }

    const canManageTarget = await canAccessUser(req.user, targetUser._id);
    if (!canManageTarget && req.user.role !== 'main') {
      return res.status(403).json({ success: false, message: 'Cannot assign to employee outside your team' });
    }

    const oldAssigneeName = task.assignedTo.name;
    task.assignedTo = targetUser._id;
    task.department = targetUser.department;
    await task.save();

    await Notification.create({
      userId: targetUser._id,
      type: 'task_assigned',
      title: 'Task Reassigned to You',
      message: `${req.user.name} reassigned task "${task.title}" to you. ${reason ? `Reason: ${reason}` : ''}`,
      taskId: task._id,
    });

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TASK_REASSIGNED',
      taskId: task._id,
      taskTitle: task.title,
      targetUserId: targetUser._id,
      targetUserName: targetUser.name,
      description: `${req.user.name} reassigned task "${task.title}" from ${oldAssigneeName} to ${targetUser.name}.`,
      level: req.user.level,
    });

    res.json({
      success: true,
      message: 'Task reassigned successfully',
      task: maskTaskForUser(task, req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reassign task',
      error: error.message,
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  submitTask,
  addComment,
  updateDeadline,
  reassignTask,
};
