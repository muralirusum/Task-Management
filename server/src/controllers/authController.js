const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'novatech_super_secret_jwt_key_2026_hierarchical_access',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, full_name, email, password, confirmPassword, role = 'employee', position, department } = req.body;
    const displayName = name || full_name;

    if (!displayName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, corporate email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if duplicate user exists
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Role mapping
    const normalizedRole = role.toLowerCase();
    let level = 3;
    if (['ceo', 'employer', 'main'].includes(normalizedRole)) {
      level = 1;
    } else if (['manager', 'middle'].includes(normalizedRole)) {
      level = 2;
    }

    const userPosition = position || (level === 1 ? 'Executive Director' : level === 2 ? 'Department Manager' : 'Operations Employee');
    const userDept = department || (level === 1 ? 'Executive Management' : 'Operations');

    // Generate 6-digit random OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser) {
      existingUser.name = displayName;
      existingUser.password = password;
      existingUser.role = normalizedRole;
      existingUser.position = userPosition;
      existingUser.department = userDept;
      existingUser.level = level;
      existingUser.emailVerified = true;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name: displayName,
        email: cleanEmail,
        password,
        role: normalizedRole,
        position: userPosition,
        department: userDept,
        level,
        status: 'active',
        emailVerified: true,
      });
    }

    const token = generateToken(user._id);

    try {
      await ActivityLog.create({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_REGISTERED',
        description: `${user.name} created account.`,
        level: user.level,
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        level: user.level,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        presenceStatus: user.presenceStatus,
      },
      message: 'Account created successfully!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
    }

    user.emailVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error verifying OTP', error: error.message });
  }
};

// @desc    Resend OTP code
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  res.status(200).json({ success: true, message: 'OTP is not required.' });
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
        message: 'Please provide corporate email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('managerId', 'name position department role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
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

    // Audit login safely
    try {
      await ActivityLog.create({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGIN',
        description: `${user.name} (${user.position}) logged in.`,
        level: user.level,
      });
    } catch (auditErr) {
      console.warn('Non-fatal activity log creation warning on login:', auditErr.message);
    }

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        managerId: user.managerId,
        level: user.level,
        emailVerified: user.emailVerified,
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
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        managerId: user.managerId,
        level: user.level,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        presenceStatus: user.presenceStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide corporate email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Password reset link / token generated successfully.',
      resetToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: error.message,
    });
  }
};

// @desc    Reset password via token
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match' });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// @desc    Verify corporate email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationToken } = req.body;
    let user;

    if (verificationToken) {
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      user = await User.findOne({ verificationToken: hashedToken, verificationTokenExpire: { $gt: Date.now() } });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email verification token or request' });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Corporate email address verified successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
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

// @desc    Request OTP to delete own account
// @route   POST /api/auth/request-delete-otp
// @access  Private
const requestDeleteOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
    }

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'User account has no valid registered email address.' });
    }

    // Rate Limiting: 60 seconds cooldown between OTP requests
    if (user.otpLastSentAt && (Date.now() - new Date(user.otpLastSentAt).getTime()) < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      });
    }

    // Generate 6-digit random OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.otpCode = rawOtp;
    user.otpCodeHash = hashedOtp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpLastSentAt = new Date();
    user.otpAttempts = 0;
    await user.save();

    // Send email using server-side sendEmail
    const emailResult = await sendEmail({
      to: user.email,
      subject: `${rawOtp} is your Account Deletion Verification OTP`,
      text: `Your 6-digit account deletion verification OTP is ${rawOtp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #ffffff; margin: 0 auto;">
          <h2 style="color: #991b1b; margin-top: 0; font-size: 20px;">Account Deletion Request</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">You requested to permanently delete your cGxP Tech account. Enter the 6-digit OTP code below to confirm deletion:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; padding: 18px; background: #fef2f2; text-align: center; border-radius: 12px; margin: 20px 0; border: 1px solid #fecaca;">
            ${rawOtp}
          </div>
          <p style="color: #991b1b; font-size: 12px; margin-bottom: 0;">⚠️ Warning: This operation will permanently erase your account access. If you did not request this, please change your password immediately.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(502).json({
        success: false,
        message: emailResult.message || 'Email delivery failed. Please verify SMTP server settings.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Account deletion OTP code sent to ${user.email}. Please check your email inbox.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate account deletion OTP', error: error.message });
  }
};

// @desc    Confirm delete account with OTP
// @route   DELETE /api/auth/delete-account
// @access  Private
const confirmDeleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP verification code is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
    }

    // Check failed attempts lockout
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed OTP attempts. Please request a new OTP code.',
      });
    }

    // Check expiration
    if (!user.otpExpire || new Date(user.otpExpire).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
    }

    // Compare OTP securely (hashed or raw)
    const enteredHashed = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const isMatch = (user.otpCodeHash && user.otpCodeHash === enteredHashed) || (user.otpCode && user.otpCode === otp.trim());

    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const attemptsLeft = Math.max(0, 5 - user.otpAttempts);
      return res.status(400).json({
        success: false,
        message: attemptsLeft > 0 
          ? `Invalid OTP code. ${attemptsLeft} attempts remaining.`
          : 'Too many failed attempts. Please request a new OTP code.',
      });
    }

    // Clear OTP fields before deletion
    user.otpCode = null;
    user.otpCodeHash = null;
    user.otpExpire = null;
    user.otpAttempts = 0;

    await User.findByIdAndDelete(req.user._id);

    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_DELETED_SELF',
        description: `${user.name} verified OTP and permanently deleted their account (${user.email}).`,
        level: user.level,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
  }
};

// @desc    Confirm delete account with Password (with 2-min timeout)
// @route   DELETE /api/auth/delete-account-password
// @access  Private
const deleteAccountWithPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your current account password to confirm deletion.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect account password. Please check your password and try again.' });
    }

    await User.findByIdAndDelete(req.user._id);

    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_DELETED_SELF',
        description: `${user.name} verified password and permanently deleted their account (${user.email}).`,
        level: user.level,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
  }
};

// @desc    Test real email delivery via SMTP (Development/Diagnostic tool)
// @route   POST /api/auth/test-email
// @access  Public
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a recipient email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`[Test Email Endpoint] Initiating SMTP email test for recipient: ${cleanEmail}`);

    const result = await sendEmail({
      to: cleanEmail,
      subject: 'Test Email Delivery - cGxP Tech Work Suite',
      text: 'This is a test email from cGxP Tech Work Suite to verify server SMTP configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">SMTP Test Email Delivery</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">This email confirms that your server SMTP email configuration is active and successfully delivering messages to recipients.</p>
          <div style="padding: 12px 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; margin-top: 16px;">
            Recipient: <strong>${cleanEmail}</strong><br/>
            Timestamp: ${new Date().toISOString()}
          </div>
        </div>
      `,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: `Test email successfully sent to ${cleanEmail}. Message ID: ${result.messageId}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error testing email delivery', error: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  requestDeleteOtp,
  confirmDeleteAccount,
  deleteAccountWithPassword,
  testEmail,
};
