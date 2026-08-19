const mongoose = require('mongoose');

const dailyWorkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    title: {
      type: String,
      required: [true, 'Work log title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: String,
      required: true, // e.g. "09:00 AM" or "09:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "11:30 AM" or "11:30"
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    project: {
      type: String,
      default: 'General',
    },
    product: {
      type: String,
      default: 'NovaCRM',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('DailyWork', dailyWorkSchema);
