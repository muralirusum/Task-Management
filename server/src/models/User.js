const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide user full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide user email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['ceo', 'manager', 'employer', 'employee', 'main', 'middle', 'last'],
      default: 'employee',
      required: true,
    },
    position: {
      type: String,
      default: 'Team Member',
      trim: true,
    },
    department: {
      type: String,
      default: 'Operations',
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    level: {
      type: Number,
      required: true,
      default: 3, // 1: Main/CEO/Employer, 2: Middle/Manager, 3: Last/Employee
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpCodeHash: {
      type: String,
      default: null,
    },
    otpExpire: {
      type: Date,
      default: null,
    },
    otpLastSentAt: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    verificationToken: String,
    verificationTokenExpire: Date,
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    presenceStatus: {
      type: String,
      enum: ['Active', 'Away', 'Offline'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full_name
userSchema.virtual('full_name').get(function () {
  return this.name;
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 Hour
  return resetToken;
};

// Generate email verification token
userSchema.methods.getVerificationToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours
  return token;
};

module.exports = mongoose.model('User', userSchema);
