const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      enum: ['ceo', 'manager', 'employee', 'main', 'middle', 'last'],
      default: 'employee',
      required: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
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
      default: 3, // 1: Main, 2: Middle, 3: Last (or arbitrary N)
    },
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

module.exports = mongoose.model('User', userSchema);
