const User = require('../models/User');
const Task = require('../models/Task');
const DailyWork = require('../models/DailyWork');
const { getAccessibleUserIds, getSubordinateIds } = require('../middlewares/hierarchy');

// @desc    Get accessible users based on hierarchy
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    // Purge fake demo users automatically from active database
    await User.deleteMany({
      $or: [
        { email: { $in: ['employ@cgxptech.com', 'employ@novatech.com', 'manager@novatech.com', 'ceo@novatech.com'] } },
        { name: { $in: ['Employee User', 'Manager User', 'Admin CEO'] } }
      ]
    });

    let query = {};
    if (req.query.forChat === 'true' || req.query.all === 'true') {
      query = {}; // All users available for chat communication
    } else {
      const accessibleIds = await getAccessibleUserIds(req.user);
      query = { _id: { $in: accessibleIds } };
    }

    const users = await User.find(query)
      .populate('managerId', 'name position department role')
      .sort({ level: 1, department: 1, name: 1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: error.message,
    });
  }
};

// @desc    Get users that current user can assign tasks to
// @route   GET /api/users/assignable
// @access  Private
const getAssignableUsers = async (req, res) => {
  try {
    if (req.user.role === 'ceo' || req.user.role === 'main' || req.user.level === 1) {
      // CEO can assign to anyone
      const users = await User.find().select('name email role position department level avatar');
      return res.json({ success: true, users });
    }

    if (req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2) {
      // Manager can assign tasks to all employees
      const users = await User.find({
        _id: { $ne: req.user._id },
        $or: [
          { role: { $in: ['employee', 'last'] } },
          { level: { $gte: 3 } },
          { managerId: req.user._id }
        ]
      }).select('name email role position department level avatar');
      return res.json({ success: true, users });
    }

    // Employee cannot assign tasks
    return res.json({ success: true, users: [] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load assignable employees',
      error: error.message,
    });
  }
};

// @desc    Get visual hierarchy tree (Org Chart)
// @route   GET /api/users/hierarchy-tree
// @access  Private
const getHierarchyTree = async (req, res) => {
  try {
    // Fetch all users to construct org tree
    const allUsers = await User.find().populate('managerId', 'name position');

    const buildTree = (managerId = null) => {
      return allUsers
        .filter((u) => {
          if (managerId === null) {
            return !u.managerId;
          }
          return u.managerId && u.managerId._id.toString() === managerId.toString();
        })
        .map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          position: u.position,
          department: u.department,
          level: u.level,
          avatar: u.avatar,
          children: buildTree(u._id),
        }));
    };

    let tree = [];
    if (req.user.role === 'ceo' || req.user.role === 'main' || req.user.level === 1) {
      tree = buildTree(null);
    } else if (req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2) {
      const userNode = allUsers.find((u) => u._id.toString() === req.user._id.toString());
      if (userNode) {
        tree = [
          {
            _id: userNode._id,
            name: userNode.name,
            email: userNode.email,
            role: userNode.role,
            position: userNode.position,
            department: userNode.department,
            level: userNode.level,
            avatar: userNode.avatar,
            children: buildTree(userNode._id),
          },
        ];
      }
    } else {
      tree = [
        {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          position: req.user.position,
          department: req.user.department,
          level: req.user.level,
          avatar: req.user.avatar,
          children: [],
        },
      ];
    }

    res.json({
      success: true,
      tree,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to build hierarchy tree',
      error: error.message,
    });
  }
};

// @desc    Get single user details with stats
// @route   GET /api/users/:id
// @access  Private (Hierarchy Guarded)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'name position department role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get basic stats for user
    const tasksCount = await Task.countDocuments({ assignedTo: user._id });
    const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: 'In Progress' });
    const pendingApprovalTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: { $in: ['Submitted', 'Under Review', 'Forwarded to Main'] },
    });

    const recentDailyWork = await DailyWork.find({ userId: user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      user,
      stats: {
        totalTasks: tasksCount,
        completedTasks,
        inProgressTasks,
        pendingApprovalTasks,
        completionRate: tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0,
      },
      recentDailyWork,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message,
    });
  }
};

// @desc    Create a new user (Manager or Employee)
// @route   POST /api/users
// @access  Private (CEO/Main only)
const createUser = async (req, res) => {
  try {
    const isCEO = req.user.role === 'ceo' || req.user.role === 'main' || req.user.level === 1;
    const isManager = req.user.role === 'manager' || req.user.role === 'middle' || req.user.level === 2;

    if (!isCEO && !isManager) {
      return res.status(403).json({ success: false, message: 'Not authorized to create users' });
    }

    const { name, email, password, phone, department, position, role, managerId, status, avatar } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Determine level based on role
    let level = 3;
    if (role === 'middle' || role === 'manager') level = 2;
    if (role === 'main' || role === 'ceo') level = 1;

    // Managers can only create employees
    if (isManager && !isCEO && level < 3) {
      return res.status(403).json({ success: false, message: 'Managers can only create employee-level accounts' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      department,
      position,
      role,
      level,
      managerId: managerId || null,
      status: status || 'active',
      avatar: avatar || '',
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (CEO/Main only)
const updateUser = async (req, res) => {
  try {
    // If the user is just updating their own avatar, allow it.
    const isSelfUpdate = String(req.user._id) === req.params.id;
    const isUpdatingOnlyAvatar = Object.keys(req.body).length === 1 && req.body.avatar;

    if (!isSelfUpdate && req.user.role !== 'ceo' && req.user.role !== 'main' && req.user.level !== 1) {
      // If it's a manager trying to update their own employee's avatar, we can also let them,
      // but let's keep the existing guard logic:
      return res.status(403).json({ success: false, message: 'Not authorized to update users' });
    }

    if (isSelfUpdate && !isUpdatingOnlyAvatar && req.user.role !== 'ceo' && req.user.level !== 1) {
      // Non-CEO can only update their own avatar through this route
      const { avatar } = req.body;
      const user = await User.findById(req.params.id);
      if (avatar) user.avatar = avatar;
      await user.save();
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ success: true, user: userObj });
    }

    const { name, phone, department, position, role, managerId, status, presenceStatus, avatar, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (position) user.position = position;
    if (status) user.status = status;
    if (presenceStatus) user.presenceStatus = presenceStatus;
    if (avatar) user.avatar = avatar;
    if (managerId !== undefined) user.managerId = managerId;
    if (password) user.password = password;

    if (role) {
      user.role = role;
      if (role === 'middle' || role === 'manager') user.level = 2;
      else if (role === 'main' || role === 'ceo') user.level = 1;
      else user.level = 3;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

// @desc    Disable a user
// @route   PATCH /api/users/:id/disable
// @access  Private (CEO/Main only)
const disableUser = async (req, res) => {
  try {
    if (req.user.role !== 'ceo' && req.user.role !== 'main' && req.user.level !== 1) {
      return res.status(403).json({ success: false, message: 'Not authorized to disable users' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.status === 'active' ? 'activated' : 'disabled'} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable user',
      error: error.message,
    });
  }
};

// @desc    Update user presence status
// @route   PATCH /api/users/presence
// @access  Private
const updatePresence = async (req, res) => {
  try {
    const { presenceStatus } = req.body;
    
    if (!['Active', 'Away', 'Offline'].includes(presenceStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid presence status' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.presenceStatus = presenceStatus;
    await user.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      presenceStatus: user.presenceStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update presence status',
      error: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

module.exports = {
  getUsers,
  getAssignableUsers,
  getHierarchyTree,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  updatePresence,
  deleteUser,
};
