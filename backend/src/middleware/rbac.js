const ROLE_HIERARCHY = {
  super_admin: 6,
  principal: 5,
  hod: 4,
  faculty: 3,
  staff: 2,
  student: 1,
};

/**
 * Middleware: Allow only specific listed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Allow minimum role hierarchy level
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation.',
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Minimum role required is '${minRole}'. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

/**
 * Check if the user is authorized to access a given department.
 * Super Admin and Principal have institution-wide access.
 * Others can only access their assigned department.
 */
const canAccessDepartment = (user, departmentId) => {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'principal') return true;
  if (!departmentId) return true;

  const userDeptId = user.department?._id
    ? user.department._id.toString()
    : user.department?.toString();

  const targetDeptId = departmentId._id
    ? departmentId._id.toString()
    : departmentId.toString();

  return userDeptId === targetDeptId;
};

/**
 * Middleware enforcing department isolation for routes taking :departmentId or in req.body.department
 */
const enforceDepartmentIsolation = (req, res, next) => {
  const targetDeptId = req.params.departmentId || req.body.department || req.query.department;
  if (!targetDeptId) {
    return next();
  }

  if (!canAccessDepartment(req.user, targetDeptId)) {
    return res.status(403).json({
      success: false,
      message: 'Department isolation error: You are not authorized to view or modify resources outside your assigned department.',
    });
  }

  next();
};

module.exports = {
  ROLE_HIERARCHY,
  authorize,
  requireMinRole,
  canAccessDepartment,
  enforceDepartmentIsolation,
};

