const { recommendAssignees } = require('../services/aiRecommendationService');
const { getWorkloadAnalytics } = require('../services/workloadService');
const {
  calculateTaskDelayRisk,
  evaluateTaskRisk,
  evaluateAllActiveTasks,
} = require('../services/delayRiskService');
const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/audit');

// POST /api/ai/recommend-assignees
const getRecommendations = async (req, res) => {
  try {
    const { taskId, departmentId, requiredSkills, priority, targetRoles } = req.body;

    let targetDept = departmentId;
    let taskSkills = requiredSkills || [];
    let taskPriority = priority || 'Medium';

    // If taskId is provided, pull actual details from DB
    if (taskId) {
      const task = await Task.findById(taskId);
      if (task) {
        targetDept = targetDept || task.department;
        if (!requiredSkills || requiredSkills.length === 0) {
          taskSkills = task.requiredSkills || [];
        }
        taskPriority = task.priority || taskPriority;
      }
    }

    if (!targetDept && req.user.department) {
      targetDept = req.user.department?._id || req.user.department;
    }

    const result = await recommendAssignees({
      taskId,
      departmentId: targetDept,
      requiredSkills: taskSkills,
      priority: taskPriority,
      targetRoles: targetRoles || ['faculty', 'staff'],
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/apply-recommendation
const applyRecommendation = async (req, res) => {
  try {
    const { taskId, userId, isOverridden = false, reason = '' } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and selected User ID are required.',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = userId;
    task.aiRecommendation = {
      recommendedUserId: userId,
      isOverridden,
      reasons: reason ? [reason] : ['Assigned via AI Recommendation Engine'],
      recordedAt: new Date(),
    };

    await task.save();

    // Send notification
    await createNotification({
      recipient: userId,
      sender: req.user._id,
      title: 'Task Assigned',
      message: `You were assigned "${task.title}". ${isOverridden ? '(Manual manager assignment)' : '(Matched via AI recommendation system)'}`,
      type: 'task_assigned',
      link: `/tasks/${task._id}`,
      referenceId: task._id,
      referenceModel: 'Task',
    });

    await logAudit({
      req,
      action: isOverridden ? 'AI_RECOMMENDATION_OVERRIDDEN' : 'AI_RECOMMENDATION_ACCEPTED',
      targetModel: 'Task',
      targetId: task._id,
      department: task.department,
      description: `Task "${task.title}" assigned to user ${userId} (Overridden: ${isOverridden})`,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email designation')
      .populate('project', 'title code');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Assignee successfully updated.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/workload-analytics
const getWorkloadDashboard = async (req, res) => {
  try {
    let departmentId = req.query.department || null;

    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      departmentId = req.user.department?._id || req.user.department;
    }

    const analytics = await getWorkloadAnalytics({ departmentId });

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/delay-risk-dashboard
const getDelayRiskDashboard = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {
      status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
    };

    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter.department = req.user.department?._id || req.user.department;
    } else if (department) {
      filter.department = department;
    }

    const activeTasks = await Task.find(filter)
      .populate('project', 'title code')
      .populate('department', 'name code')
      .populate('assignedTo', 'name email designation role')
      .populate('dependencies', 'title status deadline')
      .sort({ 'delayRisk.score': -1, deadline: 1 });

    const highRiskTasks = activeTasks.filter((t) => t.delayRisk?.level === 'High');
    const mediumRiskTasks = activeTasks.filter((t) => t.delayRisk?.level === 'Medium');
    const lowRiskTasks = activeTasks.filter((t) => !t.delayRisk?.level || t.delayRisk?.level === 'Low');

    const overdueCount = activeTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date()).length;

    res.status(200).json({
      success: true,
      data: {
        totalActiveTasks: activeTasks.length,
        highRiskCount: highRiskTasks.length,
        mediumRiskCount: mediumRiskTasks.length,
        lowRiskCount: lowRiskTasks.length,
        overdueCount,
        highRiskTasks,
        mediumRiskTasks,
        lowRiskTasks,
        modelType: 'Heuristic Multi-Factor Delay Risk Estimator',
        isRuleBased: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/re-evaluate-risks
const reEvaluateRisks = async (req, res) => {
  try {
    let departmentId = null;
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      departmentId = req.user.department?._id || req.user.department;
    }

    const results = await evaluateAllActiveTasks(departmentId);

    res.status(200).json({
      success: true,
      count: results.length,
      message: `Recalculated delay risks for ${results.length} active tasks.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRecommendations,
  applyRecommendation,
  getWorkloadDashboard,
  getDelayRiskDashboard,
  reEvaluateRisks,
};

