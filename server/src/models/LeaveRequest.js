const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
    },
    role: {
      type: String,
    },
    department: {
      type: String,
    },
    leaveType: {
      type: String,
      required: true,
    },
    fromDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    toDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
