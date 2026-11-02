const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['task_submission', 'project_stage', 'workflow_transition'],
      default: 'task_submission',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    workflowStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowStage',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requiredRole: {
      type: String,
      enum: ['super_admin', 'principal', 'hod', 'faculty', 'staff'],
      default: 'hod',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    submissionNotes: {
      type: String,
      default: '',
    },
    reviewerComments: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ApprovalSchema.index({ department: 1, status: 1 });
ApprovalSchema.index({ submittedBy: 1 });
ApprovalSchema.index({ reviewedBy: 1 });
ApprovalSchema.index({ task: 1 });

module.exports = mongoose.model('Approval', ApprovalSchema);

