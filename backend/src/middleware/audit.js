const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  req,
  action,
  targetModel,
  targetId = null,
  description,
  metadata = {},
  department = null,
}) => {
  try {
    if (!req || !req.user) return;

    const userDept = department || req.user.department?._id || req.user.department || null;
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '';

    await AuditLog.create({
      action,
      performedBy: req.user._id,
      userRole: req.user.role,
      department: userDept,
      targetModel,
      targetId,
      description,
      metadata,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    });
  } catch (err) {
    // Non-blocking error for logging
    console.error('Audit logging failed:', err.message);
  }
};

module.exports = { logAudit };

