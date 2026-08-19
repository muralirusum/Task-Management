const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['login', 'logout'],
      required: true,
    },
    date: {
      type: String, // Format: 'DD/MM/YYYY' for easy querying
      required: true,
    },
    timestamp: {
      type: Number, // Unix timestamp in milliseconds
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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
