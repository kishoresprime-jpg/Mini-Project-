const mongoose = require('mongoose');

const WorkflowStageSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Stage title is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
    requiredRole: {
      type: String,
      enum: ['super_admin', 'principal', 'hod', 'faculty', 'staff', 'student', 'any'],
      default: 'hod',
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    mandatoryTasksCompleted: {
      type: Boolean,
      default: false,
    },
    stageType: {
      type: String,
      enum: ['creation', 'approval', 'assignment', 'execution', 'submission', 'verification', 'final_approval', 'completion'],
      default: 'execution',
    },
  },
  { timestamps: true }
);

WorkflowStageSchema.index({ workflow: 1, order: 1 });

module.exports = mongoose.model('WorkflowStage', WorkflowStageSchema);

