const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Approval = require('../models/Approval');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const { calculateTaskDelayRisk, evaluateTaskRisk } = require('../services/delayRiskService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/audit');
const { emitGlobal } = require('../config/socket');

// Valid status transitions map
const ALLOWED_TRANSITIONS = {
  'To Do': ['In Progress', 'Blocked'],
  'In Progress': ['To Do', 'Submitted for Review', 'Blocked'],
  'Submitted for Review': ['Approved', 'Rejected'],
  'Rejected': ['In Progress', 'Submitted for Review'],
  'Approved': ['Completed', 'In Progress'],
  'Completed': ['In Progress'],
  'Blocked': ['To Do', 'In Progress'],
};

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const {
      project,
      department,
      assignedTo,
      status,
      priority,
      delayRisk,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const filter = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'staff' || req.user.role === 'faculty') {
      if (assignedTo === 'me') {
        filter.assignedTo = req.user._id;
      } else {
        filter.$or = [
          { assignedTo: req.user._id },
          { assignedBy: req.user._id },
          { department: req.user.department?._id || req.user.department },
        ];
      }
    } else if (req.user.role === 'hod') {
      filter.department = req.user.department?._id || req.user.department;
      if (assignedTo) filter.assignedTo = assignedTo;
    } else {
      // Super Admin or Principal
      if (department) filter.department = department;
      if (assignedTo) filter.assignedTo = assignedTo;
    }

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (delayRisk) filter['delayRisk.level'] = delayRisk;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'title code')
        .populate('department', 'name code')
        .populate('assignedTo', 'name email designation role')
        .populate('assignedBy', 'name email')
        .sort({ deadline: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title code status currentStage')
      .populate('department', 'name code')
      .populate('assignedTo', 'name email designation role phone skills')
      .populate('assignedBy', 'name email designation')
      .populate('dependencies', 'title status deadline progress')
      .populate('aiRecommendation.recommendedUserId', 'name email designation');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role check
    if (req.user.role === 'student' && task.assignedTo?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this task.' });
    }

    // Fetch comments and attachments
    const [comments, attachments, approvals] = await Promise.all([
      Comment.find({ task: task._id }).populate('author', 'name email role').sort({ createdAt: 1 }),
      Attachment.find({ task: task._id }).populate('uploadedBy', 'name email').sort({ createdAt: -1 }),
      Approval.find({ task: task._id }).populate('reviewedBy', 'name email').sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        comments,
        attachments,
        approvals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      department,
      assignedTo,
      priority = 'Medium',
      deadline,
      startDate,
      estimatedHours = 8,
      requiredSkills = [],
      dependencies = [],
      subtasks = [],
      aiRecommendation,
    } = req.body;

    if (!title || !project || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, project, and deadline are required fields.',
      });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Referenced project does not exist.' });
    }

    const taskDept = department || projectDoc.department;

    const task = new Task({
      title,
      description: description || '',
      project,
      department: taskDept,
      assignedTo: assignedTo || null,
      assignedBy: req.user._id,
      priority,
      deadline,
      startDate: startDate || new Date(),
      estimatedHours,
      requiredSkills,
      dependencies,
      subtasks: subtasks.map((st) => ({ title: typeof st === 'string' ? st : st.title, isCompleted: false })),
      aiRecommendation: aiRecommendation || {},
    });

    // Evaluate delay risk
    const incompleteDepCount = dependencies.length;
    task.delayRisk = calculateTaskDelayRisk(task, incompleteDepCount);

    await task.save();

    // Notify assignee
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        title: 'New Task Assigned',
        message: `You were assigned task: "${task.title}" with priority ${task.priority}.`,
        type: 'task_assigned',
        priority: task.priority === 'Critical' ? 'urgent' : 'medium',
        link: `/tasks/${task._id}`,
        referenceId: task._id,
        referenceModel: 'Task',
      });
    }

    await logAudit({
      req,
      action: 'TASK_CREATED',
      targetModel: 'Task',
      targetId: task._id,
      department: taskDept,
      description: `Created task "${task.title}" assigned to user ${assignedTo || 'Unassigned'}`,
    });

    emitGlobal('task_created', { taskId: task._id, project: task.project });

    const populated = await Task.findById(task._id)
      .populate('project', 'title code')
      .populate('department', 'name code')
      .populate('assignedTo', 'name email designation');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Task created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const {
      title,
      description,
      assignedTo,
      priority,
      deadline,
      startDate,
      estimatedHours,
      actualHours,
      progress,
      requiredSkills,
      dependencies,
    } = req.body;

    const previousAssignee = task.assignedTo?.toString();

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (startDate) task.startDate = startDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (progress !== undefined) task.progress = progress;
    if (requiredSkills && Array.isArray(requiredSkills)) task.requiredSkills = requiredSkills;
    if (dependencies && Array.isArray(dependencies)) task.dependencies = dependencies;

    // Recalculate delay risk
    const incompleteDepCount = (task.dependencies || []).length;
    task.delayRisk = calculateTaskDelayRisk(task, incompleteDepCount);

    await task.save();

    // Check if reassigned
    if (assignedTo && assignedTo.toString() !== previousAssignee && assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        title: 'Task Assigned',
        message: `Task "${task.title}" has been assigned to you.`,
        type: 'task_assigned',
        link: `/tasks/${task._id}`,
        referenceId: task._id,
        referenceModel: 'Task',
      });
    }

    await logAudit({
      req,
      action: 'TASK_UPDATED',
      targetModel: 'Task',
      targetId: task._id,
      department: task.department,
      description: `Updated task details for "${task.title}"`,
    });

    const populated = await Task.findById(task._id)
      .populate('project', 'title code')
      .populate('assignedTo', 'name email designation');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Task updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { status, progress } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role verification for status modification
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    const isManagerOrAdmin = ['super_admin', 'principal', 'hod'].includes(req.user.role);

    if (!isAssignee && !isManagerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned user or department supervisors can update this task status.',
      });
    }

    // Role-specific status restrictions
    if (['Approved', 'Rejected'].includes(status) && !isManagerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Approval or rejection of tasks requires HOD, Principal, or Admin authorization.',
      });
    }

    // Valid transition check
    const current = task.status;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    if (!isManagerOrAdmin && !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from "${current}" to "${status}". Allowed: ${allowed.join(', ')}`,
      });
    }

    task.status = status;
    if (progress !== undefined) {
      task.progress = progress;
    } else if (status === 'Completed' || status === 'Approved') {
      task.progress = 100;
      task.completedAt = new Date();
    }

    // Recalculate delay risk
    task.delayRisk = calculateTaskDelayRisk(task, 0);
    await task.save();

    // Increment user's completed count if completed
    if (status === 'Completed' || status === 'Approved') {
      if (task.assignedTo) {
        await User.findByIdAndUpdate(task.assignedTo, {
          $inc: { completedTasksCount: 1 },
        });
      }
    }

    await logAudit({
      req,
      action: 'TASK_STATUS_UPDATED',
      targetModel: 'Task',
      targetId: task._id,
      department: task.department,
      description: `Task "${task.title}" status changed from "${current}" to "${status}"`,
    });

    emitGlobal('task_status_changed', { taskId: task._id, newStatus: status });

    res.status(200).json({
      success: true,
      data: task,
      message: `Status updated to "${status}".`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/:id/submit
const submitTaskForReview = async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = 'Submitted for Review';
    task.submission = {
      notes: notes || '',
      submittedAt: new Date(),
      submittedBy: req.user._id,
    };
    task.progress = Math.max(task.progress, 90);
    await task.save();

    // Create Approval record
    const approval = await Approval.create({
      type: 'task_submission',
      task: task._id,
      project: task.project?._id || null,
      department: task.department,
      submittedBy: req.user._id,
      requiredRole: 'hod',
      status: 'Pending',
      submissionNotes: notes || '',
    });

    // Notify HOD and assigner
    if (task.assignedBy && task.assignedBy.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedBy,
        sender: req.user._id,
        title: 'Task Submission for Approval',
        message: `${req.user.name} submitted task "${task.title}" for verification.`,
        type: 'approval_requested',
        priority: 'high',
        link: `/approvals`,
        referenceId: approval._id,
        referenceModel: 'Approval',
      });
    }

    await logAudit({
      req,
      action: 'TASK_SUBMITTED_FOR_REVIEW',
      targetModel: 'Task',
      targetId: task._id,
      department: task.department,
      description: `Task "${task.title}" submitted for review by ${req.user.name}`,
    });

    res.status(200).json({
      success: true,
      data: task,
      approvalId: approval._id,
      message: 'Task submitted for review successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subtasks endpoints
const addSubtask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Subtask title is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.subtasks.push({ title, isCompleted: false });
    await task.save();

    res.status(201).json({ success: true, data: task.subtasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : null;

    // Recalculate progress based on subtasks
    const completedCount = task.subtasks.filter((s) => s.isCompleted).length;
    task.progress = Math.round((completedCount / task.subtasks.length) * 100);

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Comments endpoints
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({
      task: task._id,
      author: req.user._id,
      content,
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name email role');

    // Notify assignee if someone else commented
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}"`,
        type: 'system_alert',
        link: `/tasks/${task._id}`,
        referenceId: task._id,
        referenceModel: 'Task',
      });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.id })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Attachments endpoints
const addAttachment = async (req, res) => {
  try {
    const { fileName, originalName, filePath, fileSize, mimeType } = req.body;
    if (!fileName || !filePath) {
      return res.status(400).json({ success: false, message: 'File details are required' });
    }

    const attachment = await Attachment.create({
      fileName,
      originalName: originalName || fileName,
      filePath,
      fileSize: fileSize || 1024,
      mimeType: mimeType || 'application/octet-stream',
      task: req.params.id,
      uploadedBy: req.user._id,
    });

    const populated = await Attachment.findById(attachment._id).populate('uploadedBy', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAttachments = async (req, res) => {
  try {
    const attachments = await Attachment.find({ task: req.params.id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: attachments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await Promise.all([
      Comment.deleteMany({ task: task._id }),
      Attachment.deleteMany({ task: task._id }),
      Approval.deleteMany({ task: task._id }),
      task.deleteOne(),
    ]);

    await logAudit({
      req,
      action: 'TASK_DELETED',
      targetModel: 'Task',
      targetId: task._id,
      department: task.department,
      description: `Deleted task "${task.title}"`,
    });

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  submitTaskForReview,
  addSubtask,
  toggleSubtask,
  addComment,
  getComments,
  addAttachment,
  getAttachments,
  deleteTask,
};

