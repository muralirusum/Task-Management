const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['timer', 'manual'],
      default: 'timer',
    },
    note: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['running', 'paused', 'completed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
