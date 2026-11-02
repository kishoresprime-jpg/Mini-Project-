const mongoose = require('mongoose');

const TASK_STATUSES = [
  'To Do',
  'In Progress',
  'Submitted for Review',
  'Approved',
  'Rejected',
  'Completed',
  'Blocked',
];

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const SubtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required for task'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for task'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid task status',
      },
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid task priority',
      },
      default: 'Medium',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 8,
      min: 1,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    subtasks: [SubtaskSchema],
    delayRisk: {
      level: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
      },
      score: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      reasons: {
        type: [String],
        default: [],
      },
      recommendedAction: {
        type: String,
        default: 'Proceed as scheduled',
      },
      expectedCompletionDate: {
        type: Date,
        default: null,
      },
      lastEvaluatedAt: {
        type: Date,
        default: Date.now,
      },
      isRuleBased: {
        type: Boolean,
        default: true,
      },
    },
    aiRecommendation: {
      recommendedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      score: {
        type: Number,
        default: 0,
      },
      reasons: {
        type: [String],
        default: [],
      },
      isOverridden: {
        type: Boolean,
        default: false,
      },
      recordedAt: {
        type: Date,
        default: null,
      },
    },
    submission: {
      notes: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    workflowStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowStage',
      default: null,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ department: 1, deadline: 1 });
TaskSchema.index({ 'delayRisk.level': 1 });

module.exports = mongoose.model('Task', TaskSchema);

