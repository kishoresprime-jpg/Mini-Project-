const Project = require('../models/Project');
const Task = require('../models/Task');
const Workflow = require('../models/Workflow');
const WorkflowStage = require('../models/WorkflowStage');
const { advanceToNextStage, canAdvanceStage } = require('../services/workflowEngine');
const { logAudit } = require('../middleware/audit');
const { createNotification } = require('../services/notificationService');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { department, status, priority, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Hierarchical access check
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      const userDept = req.user.department?._id || req.user.department;
      filter.$or = [
        { department: userDept },
        { projectManager: req.user._id },
        { members: req.user._id },
      ];
    } else if (department) {
      filter.department = department;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('department', 'name code')
        .populate('projectManager', 'name email designation')
        .populate('currentStage', 'title order requiresApproval stageType')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    // Compute live task counts for each project
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const [totalTasks, completedTasks, delayedTasks] = await Promise.all([
          Task.countDocuments({ project: p._id }),
          Task.countDocuments({ project: p._id, status: { $in: ['Completed', 'Approved'] } }),
          Task.countDocuments({ project: p._id, 'delayRisk.level': 'High' }),
        ]);

        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : p.progressPercentage || 0;

        return {
          ...p.toObject(),
          totalTasks,
          completedTasks,
          delayedTasks,
          liveProgressPercentage: progress,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
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

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('department', 'name code')
      .populate('projectManager', 'name email designation phone')
      .populate('createdBy', 'name email')
      .populate('members', 'name email designation role')
      .populate('workflow')
      .populate('currentStage');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'principal' &&
      project.department._id.toString() !== req.user.department?._id?.toString() &&
      project.projectManager._id.toString() !== req.user._id.toString() &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this project.',
      });
    }

    // Get all stages of assigned workflow
    let stages = [];
    if (project.workflow) {
      stages = await WorkflowStage.find({ workflow: project.workflow._id }).sort({ order: 1 });
    }

    // Get tasks of this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email designation role')
      .populate('assignedBy', 'name email')
      .sort({ deadline: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
    const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stages,
        tasks,
        totalTasks,
        completedTasks,
        calculatedProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      department,
      projectManager,
      members = [],
      workflow,
      priority = 'medium',
      startDate,
      targetEndDate,
    } = req.body;

    if (!title || !code || !targetEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Project title, unique code, and target end date are required.',
      });
    }

    let projectDept = department;
    if (req.user.role === 'hod' || req.user.role === 'faculty') {
      projectDept = req.user.department?._id || req.user.department;
    }

    if (!projectDept) {
      return res.status(400).json({
        success: false,
        message: 'A valid department must be assigned to the project.',
      });
    }

    const existing = await Project.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A project with this code already exists.',
      });
    }

    // If workflow provided, set initial stage
    let initialStage = null;
    let selectedWorkflow = workflow;
    if (!selectedWorkflow) {
      // Find default workflow
      const defaultWf = await Workflow.findOne({ isDefault: true, isActive: true });
      if (defaultWf) selectedWorkflow = defaultWf._id;
    }

    if (selectedWorkflow) {
      const firstStage = await WorkflowStage.findOne({ workflow: selectedWorkflow }).sort({ order: 1 });
      if (firstStage) {
        initialStage = firstStage._id;
      }
    }

    const newProject = await Project.create({
      title,
      code: code.toUpperCase(),
      description: description || '',
      department: projectDept,
      createdBy: req.user._id,
      projectManager: projectManager || req.user._id,
      members,
      workflow: selectedWorkflow || null,
      currentStage: initialStage,
      priority,
      status: 'active',
      startDate: startDate || new Date(),
      targetEndDate,
    });

    await logAudit({
      req,
      action: 'PROJECT_CREATED',
      targetModel: 'Project',
      targetId: newProject._id,
      department: projectDept,
      description: `Created project "${newProject.title}" (${newProject.code})`,
    });

    if (newProject.projectManager && newProject.projectManager.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: newProject.projectManager,
        title: 'Assigned as Project Manager',
        message: `You have been appointed as Project Manager for "${newProject.title}".`,
        type: 'task_assigned',
        link: `/projects/${newProject._id}`,
        referenceId: newProject._id,
        referenceModel: 'Project',
      });
    }

    const populated = await Project.findById(newProject._id)
      .populate('department', 'name code')
      .populate('projectManager', 'name email')
      .populate('currentStage');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Project created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const {
      title,
      description,
      projectManager,
      members,
      priority,
      status,
      targetEndDate,
      progressPercentage,
    } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'principal' &&
      req.user.role !== 'hod' &&
      project.projectManager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to edit this project.',
      });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (projectManager) project.projectManager = projectManager;
    if (members && Array.isArray(members)) project.members = members;
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (targetEndDate) project.targetEndDate = targetEndDate;
    if (progressPercentage !== undefined) project.progressPercentage = progressPercentage;

    await project.save();

    await logAudit({
      req,
      action: 'PROJECT_UPDATED',
      targetModel: 'Project',
      targetId: project._id,
      department: project.department,
      description: `Updated project details for "${project.title}"`,
    });

    const updated = await Project.findById(project._id)
      .populate('department', 'name code')
      .populate('projectManager', 'name email')
      .populate('currentStage');

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Project updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/advance-stage
const advanceStage = async (req, res) => {
  try {
    const result = await advanceToNextStage(req.params.id, req.user._id);

    await logAudit({
      req,
      action: 'WORKFLOW_STAGE_ADVANCED',
      targetModel: 'Project',
      targetId: req.params.id,
      description: `Advanced workflow stage for project "${result.project.title}"`,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.isCompleted
        ? 'All workflow stages finished. Project marked as Completed!'
        : `Successfully advanced to stage: ${result.nextStage?.title}`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    await logAudit({
      req,
      action: 'PROJECT_DELETED',
      targetModel: 'Project',
      targetId: project._id,
      department: project.department,
      description: `Deleted project "${project.title}" and its associated tasks`,
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  advanceStage,
  deleteProject,
};

