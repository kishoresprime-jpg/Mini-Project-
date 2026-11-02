const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { action, targetModel, department, search, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter.department = req.user.department?._id || req.user.department;
    } else if (department) {
      filter.department = department;
    }

    if (action) filter.action = action;
    if (targetModel) filter.targetModel = targetModel;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { userRole: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'name email role')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
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

module.exports = { getAuditLogs };

