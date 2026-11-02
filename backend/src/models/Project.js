const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for project'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      default: null,
    },
    currentStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowStage',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'under_review', 'completed', 'on_hold', 'archived'],
      default: 'planning',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetEndDate: {
      type: Date,
      required: [true, 'Target end date is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ department: 1, status: 1 });
ProjectSchema.index({ projectManager: 1 });
ProjectSchema.index({ targetEndDate: 1 });

module.exports = mongoose.model('Project', ProjectSchema);

