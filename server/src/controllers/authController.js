const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'novatech_super_secret_jwt_key_2026_hierarchical_access',
    { expiresIn: '30d' }
  );
};

const normalizeEmail = (email) => {
  const normalized = email.toLowerCase().trim();
  const emailMap = {
    'arjun@novatech.com': 'ceo@novatech.com',
    'priya@novatech.com': 'manager@novatech.com',
    'sandeep@novatech.com': 'employ@novatech.com',
  };
  return emailMap[normalized] || normalized;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const resolvedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: resolvedEmail }).select('+password').populate('managerId', 'name position department role');

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').populate('managerId', 'name position department role');
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Contact administrator.',
      });
    }

    const token = generateToken(user._id);

    // Audit login
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      description: `${user.name} (${user.position}) logged in.`,
      level: user.level,
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        managerId: user.managerId,
        level: user.level,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        presenceStatus: user.presenceStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('managerId', 'name position department role');
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

// @desc    Switch to a demo user (for testing hierarchy seamlessly)
// @route   POST /api/auth/switch-demo
// @access  Public
const switchDemoUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const resolvedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: resolvedEmail }).populate('managerId', 'name position department role');
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).populate('managerId', 'name position department role');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo user not found' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        managerId: user.managerId,
        level: user.level,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        presenceStatus: user.presenceStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to switch demo account',
      error: error.message,
    });
  }
};

// @desc    Get all demo accounts for fast switcher UI
// @route   GET /api/auth/demo-users
// @access  Public
const getDemoUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email role position department level avatar').sort({ level: 1, name: 1 });
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load demo users',
      error: error.message,
    });
  }
};

// @desc    Change user password
// @route   PATCH /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  getMe,
  switchDemoUser,
  getDemoUsers,
  changePassword,
};
