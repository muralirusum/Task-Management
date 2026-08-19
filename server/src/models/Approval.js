const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ['ceo', 'manager', 'employee', 'main', 'middle'],
      required: true,
    },
    action: {
      type: String,
      enum: [
        'submitted',
        'approved_and_forwarded',
        'main_approved',
        'rejected',
        'changes_requested',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Forwarded', 'Changes Requested'],
      default: 'Approved',
    },
    comments: {
      type: String,
      default: '',
    },
    // Strict privacy flag: internal manager notes are completely invisible to Last Person
    isInternalOnly: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      required: true, // 1: Middle Person review, 2: Main Person review
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Approval', approvalSchema);
