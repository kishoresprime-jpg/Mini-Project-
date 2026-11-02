const Workflow = require('../models/Workflow');
const WorkflowStage = require('../models/WorkflowStage');
const { logAudit } = require('../middleware/audit');

// GET /api/workflows
const getWorkflows = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      const userDept = req.user.department?._id || req.user.department;
      filter.$or = [{ department: userDept }, { department: null }];
    }

    const workflows = await Workflow.find(filter)
      .populate('department', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      workflows.map(async (wf) => {
        const stages = await WorkflowStage.find({ workflow: wf._id }).sort({ order: 1 });
        return {
          ...wf.toObject(),
          stages,
        };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workflows/:id
const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('department', 'name code')
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const stages = await WorkflowStage.find({ workflow: workflow._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...workflow.toObject(),
        stages,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/workflows
const createWorkflow = async (req, res) => {
  try {
    const { name, code, description, department, isDefault = false, stages = [] } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Workflow name and unique code are required.' });
    }

    const existing = await Workflow.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A workflow with this code already exists.' });
    }

    const workflow = await Workflow.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
      department: department || null,
      isDefault,
      createdBy: req.user._id,
    });

    // Create stages if provided
    let createdStages = [];
    if (stages && stages.length > 0) {
      const stageDocs = stages.map((s, idx) => ({
        workflow: workflow._id,
        title: s.title,
        order: s.order || idx + 1,
        description: s.description || '',
        requiredRole: s.requiredRole || 'hod',
        requiresApproval: s.requiresApproval !== undefined ? s.requiresApproval : true,
        mandatoryTasksCompleted: !!s.mandatoryTasksCompleted,
        stageType: s.stageType || 'execution',
      }));

      createdStages = await WorkflowStage.insertMany(stageDocs);
    }

    await logAudit({
      req,
      action: 'WORKFLOW_CREATED',
      targetModel: 'Workflow',
      targetId: workflow._id,
      description: `Created workflow template "${workflow.name}" with ${createdStages.length} stages`,
    });

    res.status(201).json({
      success: true,
      data: {
        ...workflow.toObject(),
        stages: createdStages,
      },
      message: 'Workflow created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/workflows/:id/stages
const addStageToWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const { title, order, description, requiredRole, requiresApproval, mandatoryTasksCompleted, stageType } = req.body;

    const stage = await WorkflowStage.create({
      workflow: workflow._id,
      title,
      order: order || 1,
      description: description || '',
      requiredRole: requiredRole || 'hod',
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      mandatoryTasksCompleted: !!mandatoryTasksCompleted,
      stageType: stageType || 'execution',
    });

    res.status(201).json({ success: true, data: stage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/workflows/:id
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    await WorkflowStage.deleteMany({ workflow: workflow._id });
    await workflow.deleteOne();

    res.status(200).json({ success: true, message: 'Workflow deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  addStageToWorkflow,
  deleteWorkflow,
};

