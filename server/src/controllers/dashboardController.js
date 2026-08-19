const Task = require('../models/Task');
const User = require('../models/User');
const DailyWork = require('../models/DailyWork');
const ActivityLog = require('../models/ActivityLog');
const Approval = require('../models/Approval');
const { getAccessibleUserIds, getSubordinateIds } = require('../middlewares/hierarchy');
const { maskTaskForUser, maskActivitiesForUser } = require('../middlewares/privacyMask');

// @desc    Get role-specific dashboard statistics and analytics
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.role === 'ceo' || user.role === 'main' || user.level === 1) {
      // ----------------- CEO DASHBOARD -----------------
      const totalEmployees = await User.countDocuments();
      const totalManagers = await User.countDocuments({ $or: [{ role: 'manager' }, { role: 'middle' }] });
      const totalExecutives = await User.countDocuments({ $or: [{ role: 'employee' }, { role: 'last' }] });

      const allTasks = await Task.find()
        .populate('assignedTo', 'name position department avatar')
        .populate('assignedBy', 'name position');

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
      const inProgressTasks = allTasks.filter((t) => t.status === 'In Progress').length;
      const pendingApprovalTasks = allTasks.filter((t) =>
        ['Submitted', 'Under Review', 'Forwarded to Main'].includes(t.status)
      ).length;

      const overdueTasks = allTasks.filter((t) => {
        if (t.status === 'Completed' || t.status === 'Approved') return false;
        return new Date(t.dueDate) < now;
      }).length;

      // Department breakdown
      const operationsTasks = allTasks.filter((t) => t.department === 'Operations');
      const salesTasks = allTasks.filter((t) => t.department === 'Sales');

      // Today's work hours
      const todayLogs = await DailyWork.find({ date: { $gte: startOfToday } });
      const totalTodayMinutes = todayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

      // Workload by employee
      const usersList = await User.find().select('name position department role avatar');
      const employeeWorkload = usersList.map((u) => {
        const userTasks = allTasks.filter((t) => t.assignedTo?._id?.toString() === u._id.toString());
        return {
          _id: u._id,
          name: u.name,
          position: u.position,
          department: u.department,
          role: u.role,
          avatar: u.avatar,
          totalTasks: userTasks.length,
          activeTasks: userTasks.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length,
          completedTasks: userTasks.filter((t) => t.status === 'Completed').length,
          pendingReview: userTasks.filter((t) => ['Submitted', 'Forwarded to Main'].includes(t.status)).length,
        };
      });

      // Tasks by status for chart
      const tasksByStatus = [
        { name: 'Completed', value: completedTasks, color: '#10B981' },
        { name: 'In Progress', value: inProgressTasks, color: '#3B82F6' },
        { name: 'Pending Review', value: pendingApprovalTasks, color: '#F59E0B' },
        { name: 'Assigned', value: allTasks.filter((t) => t.status === 'Assigned').length, color: '#8B5CF6' },
        { name: 'Overdue', value: overdueTasks, color: '#EF4444' },
      ];

      // Recent Activity Log (Org-wide)
      const recentActivities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);

      // Tasks requiring Main Person review
      const pendingMainApprovals = allTasks.filter((t) =>
        ['Forwarded to Main', 'Submitted'].includes(t.status)
      );

      return res.json({
        success: true,
        role: 'main',
        stats: {
          totalEmployees,
          totalManagers,
          totalExecutives,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingApprovalTasks,
          overdueTasks,
          todayTotalHours: Number((totalTodayMinutes / 60).toFixed(1)),
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        charts: {
          tasksByStatus,
          departmentBreakdown: [
            { department: 'Operations', total: operationsTasks.length, completed: operationsTasks.filter((t) => t.status === 'Completed').length },
            { department: 'Sales', total: salesTasks.length, completed: salesTasks.filter((t) => t.status === 'Completed').length },
          ],
        },
        employeeWorkload,
        recentActivities,
        pendingApprovals: pendingMainApprovals.map((t) => maskTaskForUser(t, req.user)),
      });
    }

    if (user.role === 'manager' || user.role === 'middle' || user.level === 2) {
      // ----------------- MANAGER DASHBOARD -----------------
      const subIds = await getSubordinateIds(user._id);
      const teamUsers = await User.find({ _id: { $in: subIds } }).select('name position department role avatar email');

      const teamTasks = await Task.find({
        $or: [{ assignedTo: { $in: subIds } }, { assignedBy: user._id }],
      })
        .populate('assignedTo', 'name position department avatar')
        .populate('assignedBy', 'name position');

      const totalTasks = teamTasks.length;
      const completedTasks = teamTasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
      const inProgressTasks = teamTasks.filter((t) => t.status === 'In Progress').length;
      const pendingSubmissions = teamTasks.filter((t) =>
        ['Submitted', 'Under Review'].includes(t.status) && t.approvalStage <= 1
      );
      const overdueTasks = teamTasks.filter((t) => {
        if (t.status === 'Completed' || t.status === 'Approved') return false;
        return new Date(t.dueDate) < now;
      }).length;

      // Team hours worked today
      const todayLogs = await DailyWork.find({
        userId: { $in: subIds },
        date: { $gte: startOfToday },
      }).populate('userId', 'name avatar');

      const teamTodayMinutes = todayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

      // Team Workload
      const teamWorkload = teamUsers.map((u) => {
        const uTasks = teamTasks.filter((t) => t.assignedTo?._id?.toString() === u._id.toString());
        return {
          _id: u._id,
          name: u.name,
          position: u.position,
          avatar: u.avatar,
          totalTasks: uTasks.length,
          activeTasks: uTasks.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length,
          completedTasks: uTasks.filter((t) => t.status === 'Completed').length,
          pendingReview: uTasks.filter((t) => ['Submitted'].includes(t.status)).length,
        };
      });

      const accessibleIds = await getAccessibleUserIds(user);
      const activities = await ActivityLog.find().sort({ createdAt: -1 }).limit(15);
      const maskedActivities = maskActivitiesForUser(activities, user, accessibleIds);

      return res.json({
        success: true,
        role: 'middle',
        stats: {
          teamSize: teamUsers.length,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingSubmissionsCount: pendingSubmissions.length,
          overdueTasks,
          teamTodayHours: Number((teamTodayMinutes / 60).toFixed(1)),
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        teamMembers: teamUsers,
        teamWorkload,
        todayLogs,
        pendingApprovals: pendingSubmissions.map((t) => maskTaskForUser(t, req.user)),
        recentActivities: maskedActivities,
      });
    }

    // ----------------- LAST PERSON DASHBOARD -----------------
    const myTasks = await Task.find({ assignedTo: user._id })
      .populate('assignedBy', 'name position department avatar')
      .sort({ dueDate: 1 });

    const totalTasks = myTasks.length;
    const activeTasks = myTasks.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length;
    const completedTasks = myTasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
    const pendingTasks = myTasks.filter((t) => ['Submitted', 'Under Review', 'Forwarded to Main'].includes(t.status)).length;

    const overdueTasks = myTasks.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Approved') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Upcoming deadlines in next 3 days
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = myTasks.filter((t) => {
      if (t.status === 'Completed') return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= threeDaysLater;
    });

    // Today's Work Time
    const todayLogs = await DailyWork.find({
      userId: user._id,
      date: { $gte: startOfToday },
    });
    const todayMinutes = todayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

    const maskedMyTasks = myTasks.map((t) => maskTaskForUser(t, user));

    const myActivities = await ActivityLog.find({
      $or: [{ userId: user._id }, { targetUserId: user._id }],
      isInternalOnly: false,
    })
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      role: 'last',
      stats: {
        totalTasks,
        activeTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        todayWorkMinutes: todayMinutes,
        todayWorkFormatted: `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`,
        upcomingDeadlinesCount: upcomingDeadlines.length,
      },
      upcomingTasks: maskedMyTasks.slice(0, 5),
      todayLogs,
      recentActivities: myActivities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardData,
};
