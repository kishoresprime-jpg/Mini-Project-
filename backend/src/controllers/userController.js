const User = require('../models/User');
const { ROLE_HIERARCHY } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, department, search, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Hierarchical isolation: HOD and lower can only view their own department
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter.department = req.user.department?._id || req.user.department;
    } else if (department) {
      filter.department = department;
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name code');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check department isolation
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'principal' &&
      user.department?.toString() !== req.user.department?._id?.toString() &&
      user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User belongs to another department.',
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone, skills } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required fields.',
      });
    }

    // Privilege escalation guard
    const creatorLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const targetLevel = ROLE_HIERARCHY[role] || 0;

    if (req.user.role !== 'super_admin' && targetLevel >= creatorLevel) {
      return res.status(403).json({
        success: false,
        message: 'Privilege escalation violation: You cannot create users with a role equal to or higher than your own.',
      });
    }

    // Department assignment guard
    let assignedDepartment = department;
    if (req.user.role === 'hod') {
      assignedDepartment = req.user.department?._id || req.user.department;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department: assignedDepartment || null,
      designation: designation || '',
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : [],
    });

    await logAudit({
      req,
      action: 'USER_CREATED',
      targetModel: 'User',
      targetId: newUser._id,
      department: assignedDepartment,
      description: `Created new user ${newUser.email} with role '${newUser.role}'`,
    });

    const populated = await User.findById(newUser._id).populate('department', 'name code');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'User created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, role, department, designation, phone, skills, isActive } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Privilege check
    const updaterLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const targetCurrentLevel = ROLE_HIERARCHY[targetUser.role] || 0;

    if (req.user.role !== 'super_admin' && targetCurrentLevel >= updaterLevel) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify a user of equal or higher hierarchy level.',
      });
    }

    if (role && role !== targetUser.role) {
      const targetNewLevel = ROLE_HIERARCHY[role] || 0;
      if (req.user.role !== 'super_admin' && targetNewLevel >= updaterLevel) {
        return res.status(403).json({
          success: false,
          message: 'Cannot escalate user role to your level or higher.',
        });
      }
      targetUser.role = role;
    }

    if (name) targetUser.name = name;
    if (designation !== undefined) targetUser.designation = designation;
    if (phone !== undefined) targetUser.phone = phone;
    if (skills && Array.isArray(skills)) targetUser.skills = skills;
    if (isActive !== undefined) targetUser.isActive = isActive;

    if (department !== undefined && req.user.role === 'super_admin') {
      targetUser.department = department;
    }

    await targetUser.save();

    await logAudit({
      req,
      action: 'USER_UPDATED',
      targetModel: 'User',
      targetId: targetUser._id,
      department: targetUser.department,
      description: `Updated user ${targetUser.email}`,
    });

    const updated = await User.findById(targetUser._id).populate('department', 'name code');

    res.status(200).json({
      success: true,
      data: updated,
      message: 'User updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: 'USER_STATUS_TOGGLED',
      targetModel: 'User',
      targetId: user._id,
      description: `User ${user.email} status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
    });

    res.status(200).json({
      success: true,
      isActive: user.isActive,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.',
      });
    }

    await user.deleteOne();

    await logAudit({
      req,
      action: 'USER_DELETED',
      targetModel: 'User',
      targetId: user._id,
      description: `Deleted user ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'User removed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
};

