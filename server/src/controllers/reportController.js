const Task = require('../models/Task');
const User = require('../models/User');
const DailyWork = require('../models/DailyWork');
const TimeEntry = require('../models/TimeEntry');
const { getAccessibleUserIds, getSubordinateIds } = require('../middlewares/hierarchy');

// @desc    Get reports & productivity analytics tailored by role
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const user = req.user;
    const accessibleIds = await getAccessibleUserIds(user);

    // Fetch tasks & daily work for accessible users
    const tasks = await Task.find({ assignedTo: { $in: accessibleIds } }).populate(
      'assignedTo',
      'name position department avatar'
    );
    const dailyLogs = await DailyWork.find({ userId: { $in: accessibleIds } }).populate(
      'userId',
      'name position department'
    );
    const timeEntries = await TimeEntry.find({ userId: { $in: accessibleIds } });

    // 1. Task Completion Analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Average Completion Time (in hours)
    const completedList = tasks.filter((t) => (t.status === 'Completed' || t.status === 'Approved') && t.actualHours > 0);
    const avgCompletionHours =
      completedList.length > 0
        ? Number((completedList.reduce((acc, c) => acc + c.actualHours, 0) / completedList.length).toFixed(1))
        : 0;

    // 3. Overdue Rate
    const now = new Date();
    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Approved') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // 4. Total Working Hours
    const totalMinutesLogged = dailyLogs.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
    const totalHoursLogged = Number((totalMinutesLogged / 60).toFixed(1));

    // 5. Tasks by Priority
    const priorityBreakdown = [
      { priority: 'Urgent', count: tasks.filter((t) => t.priority === 'Urgent').length, color: '#EF4444' },
      { priority: 'High', count: tasks.filter((t) => t.priority === 'High').length, color: '#F97316' },
      { priority: 'Medium', count: tasks.filter((t) => t.priority === 'Medium').length, color: '#3B82F6' },
      { priority: 'Low', count: tasks.filter((t) => t.priority === 'Low').length, color: '#10B981' },
    ];

    // 6. Productivity by Product/Project
    const projectMap = {};
    tasks.forEach((t) => {
      const proj = t.project || 'General';
      if (!projectMap[proj]) {
        projectMap[proj] = { name: proj, total: 0, completed: 0, hours: 0 };
      }
      projectMap[proj].total += 1;
      if (t.status === 'Completed') projectMap[proj].completed += 1;
      projectMap[proj].hours += t.actualHours || 0;
    });
    const projectBreakdown = Object.values(projectMap);

    // 7. Employee-specific breakdown (for Main and Middle)
    let employeeBreakdown = [];
    if (user.role === 'main' || user.role === 'middle') {
      const usersList = await User.find({ _id: { $in: accessibleIds } }).select(
        'name position department role avatar'
      );
      employeeBreakdown = usersList.map((u) => {
        const uTasks = tasks.filter((t) => t.assignedTo?._id?.toString() === u._id.toString());
        const uLogs = dailyLogs.filter((l) => l.userId?._id?.toString() === u._id.toString());
        const uCompleted = uTasks.filter((t) => t.status === 'Completed').length;
        const uHours = Number((uLogs.reduce((acc, c) => acc + (c.durationMinutes || 0), 0) / 60).toFixed(1));

        return {
          _id: u._id,
          name: u.name,
          position: u.position,
          department: u.department,
          avatar: u.avatar,
          totalTasks: uTasks.length,
          completedTasks: uCompleted,
          completionRate: uTasks.length > 0 ? Math.round((uCompleted / uTasks.length) * 100) : 0,
          totalHours: uHours,
          overdueTasks: uTasks.filter((t) => t.status !== 'Completed' && new Date(t.dueDate) < now).length,
        };
      });
    }

    res.json({
      success: true,
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        avgCompletionHours,
        overdueTasks,
        totalHoursLogged,
      },
      charts: {
        priorityBreakdown,
        projectBreakdown,
        employeeBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate productivity reports',
      error: error.message,
    });
  }
};

module.exports = {
  getReports,
};
