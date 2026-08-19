const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
    userRole: String,
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false, // Internal manager/director notes hidden from Last Person
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  size: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
    },
    taskType: {
      type: String,
      enum: [
        'General Work',
        'Product Work',
        'Customer Work',
        'Sales Work',
        'Research',
        'Documentation',
        'Development',
        'Meeting',
        'Follow-up',
        'Other',
      ],
      default: 'General Work',
    },
    product: {
      type: String,
      default: 'NovaCRM',
    },
    project: {
      type: String,
      default: 'General Operations',
    },
    customer: {
      type: String,
      default: '',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: [
        'Assigned',
        'In Progress',
        'Submitted',
        'Under Review',
        'Forwarded to Main',
        'Approved',
        'Rejected',
        'Completed',
      ],
      default: 'Assigned',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    estimatedHours: {
      type: Number,
      required: true,
      default: 4,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submissionNotes: {
      type: String,
      default: '',
    },
    submissionAttachments: [attachmentSchema],
    rejectionReason: {
      type: String,
      default: '',
    },
    // Multi-stage approval level: 1 = Submitted/Under Manager Review, 2 = Forwarded to Main Person, 3 = Final Approved
    approvalStage: {
      type: Number,
      default: 0,
    },
    timerState: {
      isRunning: { type: Boolean, default: false },
      lastStartedAt: { type: Date, default: null },
      totalElapsedSeconds: { type: Number, default: 0 },
    },
    tags: [String],
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating deadline status
taskSchema.virtual('deadlineStatus').get(function () {
  if (this.status === 'Completed' || this.status === 'Approved') {
    return 'Completed';
  }
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const daysOver = Math.ceil(Math.abs(diffHours) / 24);
    return `Overdue by ${daysOver} day${daysOver > 1 ? 's' : ''}`;
  } else if (diffHours <= 24) {
    return 'Due Today';
  } else if (diffHours <= 48) {
    return 'Due Tomorrow';
  } else if (diffHours <= 72) {
    return 'Due in 3 days';
  } else {
    return 'On Track';
  }
});

module.exports = mongoose.model('Task', taskSchema);
