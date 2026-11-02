const Approval = require('../models/Approval');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/audit');
const { emitGlobal } = require('../config/socket');

// GET /api/approvals
const getApprovals = async (req, res) => {
  try {
    const { status = 'Pending', type } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (type) filter.type = type;

    // Role-based visibility
    if (req.user.role === 'student' || req.user.role === 'staff' || req.user.role === 'faculty') {
      // Regular users only see approvals they submitted
      filter.submittedBy = req.user._id;
    } else if (req.user.role === 'hod') {
      filter.department = req.user.department?._id || req.user.department;
    }
    // Super Admin and Principal see all institutional approvals

    const approvals = await Approval.find(filter)
      .populate('submittedBy', 'name email designation role')
      .populate('reviewedBy', 'name email designation')
      .populate('department', 'name code')
      .populate({
        path: 'task',
        select: 'title priority deadline progress status project',
        populate: { path: 'project', select: 'title code' },
      })
      .populate('project', 'title code status')
      .populate('workflowStage', 'title order')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/approvals/:id
const getApprovalById = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id)
      .populate('submittedBy', 'name email designation role')
      .populate('reviewedBy', 'name email')
      .populate('department', 'name code')
      .populate('task')
      .populate('project')
      .populate('workflowStage');

    if (!approval) return res.status(404).json({ success: false, message: 'Approval request not found' });

    res.status(200).json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/approvals/:id/review
const reviewApproval = async (req, res) => {
  try {
    const { action, comments = '' } = req.body; // action: 'Approved' or 'Rejected'

    if (!action || !['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid action ("Approved" or "Rejected") is required.' });
    }

    const approval = await Approval.findById(req.params.id).populate('task project');
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found.' });
    }

    if (approval.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been reviewed (${approval.status}).`,
      });
    }

    approval.status = action;
    approval.reviewerComments = comments;
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    await approval.save();

    // Update referenced Task if applicable
    if (approval.task) {
      const task = await Task.findById(approval.task._id);
      if (task) {
        task.status = action === 'Approved' ? 'Approved' : 'Rejected';
        if (action === 'Approved') {
          task.progress = 100;
          task.completedAt = new Date();

          // Increment assignee completed tasks count
          if (task.assignedTo) {
            await User.findByIdAndUpdate(task.assignedTo, {
              $inc: { completedTasksCount: 1 },
            });
          }
        }
        await task.save();
      }
    }

    // Notify submitter of outcome
    await createNotification({
      recipient: approval.submittedBy,
      sender: req.user._id,
      title: `Submission ${action}`,
      message: `Your submission for "${approval.task?.title || approval.project?.title || 'item'}" was ${action.toLowerCase()} by ${req.user.name}. ${comments ? `Notes: "${comments}"` : ''}`,
      type: action === 'Approved' ? 'approval_approved' : 'approval_rejected',
      priority: action === 'Approved' ? 'medium' : 'high',
      link: approval.task ? `/tasks/${approval.task._id}` : `/approvals`,
      referenceId: approval._id,
      referenceModel: 'Approval',
    });

    await logAudit({
      req,
      action: `APPROVAL_${action.toUpperCase()}`,
      targetModel: 'Approval',
      targetId: approval._id,
      department: approval.department,
      description: `${req.user.name} (${req.user.role}) marked approval as ${action}`,
    });

    emitGlobal('approval_updated', {
      approvalId: approval._id,
      status: action,
      task: approval.task?._id,
    });

    res.status(200).json({
      success: true,
      data: approval,
      message: `Submission has been ${action.toLowerCase()} successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovals,
  getApprovalById,
  reviewApproval,
};

