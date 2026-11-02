const Project = require('../models/Project');
const Task = require('../models/Task');
const WorkflowStage = require('../models/WorkflowStage');
const Approval = require('../models/Approval');
const { createNotification } = require('./notificationService');
const { emitGlobal } = require('../config/socket');

/**
 * Validates whether a project can advance from current stage to the next stage
 */
const canAdvanceStage = async (projectId) => {
  const project = await Project.findById(projectId).populate('currentStage');
  if (!project || !project.currentStage) {
    return { canAdvance: false, reason: 'Project or current stage not found.' };
  }

  const currentStage = project.currentStage;

  // Check if mandatory tasks must be completed
  if (currentStage.mandatoryTasksCompleted) {
    const incompleteTasksCount = await Task.countDocuments({
      project: projectId,
      status: { $nin: ['Completed', 'Approved'] },
    });

    if (incompleteTasksCount > 0) {
      return {
        canAdvance: false,
        reason: `Cannot advance workflow: ${incompleteTasksCount} mandatory task(s) remain incomplete.`,
        incompleteTasksCount,
      };
    }
  }

  // Check if pending approvals exist for this stage
  const pendingApprovals = await Approval.countDocuments({
    project: projectId,
    workflowStage: currentStage._id,
    status: 'Pending',
  });

  if (pendingApprovals > 0) {
    return {
      canAdvance: false,
      reason: `Cannot advance workflow: Stage requires ${pendingApprovals} pending approval(s) to be resolved.`,
      pendingApprovals,
    };
  }

  return { canAdvance: true };
};

/**
 * Advance project to the next stage in its assigned workflow template
 */
const advanceToNextStage = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate('currentStage workflow');
  if (!project) throw new Error('Project not found');
  if (!project.workflow) throw new Error('Project has no workflow assigned');

  const check = await canAdvanceStage(projectId);
  if (!check.canAdvance) {
    throw new Error(check.reason);
  }

  const currentOrder = project.currentStage ? project.currentStage.order : 0;

  // Find next stage in order
  const nextStage = await WorkflowStage.findOne({
    workflow: project.workflow._id,
    order: { $gt: currentOrder },
  }).sort({ order: 1 });

  if (!nextStage) {
    // Reached final stage -> Mark project as Completed
    project.status = 'completed';
    project.progressPercentage = 100;
    project.completedAt = new Date();
    await project.save();

    await createNotification({
      recipient: project.projectManager,
      title: 'Project Completed',
      message: `Project "${project.title}" has reached completion through all workflow stages.`,
      type: 'workflow_stage_changed',
      link: `/projects/${project._id}`,
      referenceId: project._id,
      referenceModel: 'Project',
    });

    emitGlobal('workflow_updated', { projectId: project._id, status: 'completed' });
    return { project, isCompleted: true, currentStage: null };
  }

  project.currentStage = nextStage._id;
  if (nextStage.stageType === 'completion') {
    project.status = 'completed';
    project.progressPercentage = 100;
  } else {
    project.status = 'active';
  }
  await project.save();

  // Notify Project Manager and Department HOD
  await createNotification({
    recipient: project.projectManager,
    title: 'Workflow Stage Advanced',
    message: `Project "${project.title}" advanced to stage: "${nextStage.title}".`,
    type: 'workflow_stage_changed',
    link: `/projects/${project._id}`,
    referenceId: project._id,
    referenceModel: 'Project',
  });

  emitGlobal('workflow_updated', {
    projectId: project._id,
    stage: nextStage.title,
    order: nextStage.order,
  });

  return { project, nextStage, isCompleted: false };
};

module.exports = {
  canAdvanceStage,
  advanceToNextStage,
};

