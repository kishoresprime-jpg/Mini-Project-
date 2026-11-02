const Department = require('../models/Department');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { logAudit } = require('../middleware/audit');

// GET /api/departments
const getDepartments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter._id = req.user.department?._id || req.user.department;
    }

    const departments = await Department.find(filter)
      .populate('hod', 'name email designation phone')
      .sort({ name: 1 });

    // Include counts for users, projects, and active tasks per department
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const [memberCount, projectCount, activeTaskCount] = await Promise.all([
          User.countDocuments({ department: dept._id, isActive: true }),
          Project.countDocuments({ department: dept._id }),
          Task.countDocuments({
            department: dept._id,
            status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          }),
        ]);

        return {
          ...dept.toObject(),
          memberCount,
          projectCount,
          activeTaskCount,
        };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/departments/:id
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('hod', 'name email designation phone');
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'principal' &&
      department._id.toString() !== req.user.department?._id?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to department data.',
      });
    }

    const members = await User.find({ department: department._id, isActive: true })
      .select('name email role designation skills')
      .sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        members,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/departments (Super Admin only)
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, hod } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and unique code are required.',
      });
    }

    const existing = await Department.findOne({
      $or: [{ code: code.toUpperCase() }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name or code already exists.',
      });
    }

    const dept = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
      hod: hod || null,
    });

    // If an HOD is specified, update user's role to hod and assign department
    if (hod) {
      await User.findByIdAndUpdate(hod, { department: dept._id, role: 'hod' });
    }

    await logAudit({
      req,
      action: 'DEPARTMENT_CREATED',
      targetModel: 'Department',
      targetId: dept._id,
      department: dept._id,
      description: `Created department ${dept.name} (${dept.code})`,
    });

    const populated = await Department.findById(dept._id).populate('hod', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Department created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, description, hod, isActive } = req.body;
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (name) dept.name = name;
    if (description !== undefined) dept.description = description;
    if (isActive !== undefined) dept.isActive = isActive;

    if (hod !== undefined) {
      // Reassign HOD
      dept.hod = hod || null;
      if (hod) {
        await User.findByIdAndUpdate(hod, { department: dept._id, role: 'hod' });
      }
    }

    await dept.save();

    await logAudit({
      req,
      action: 'DEPARTMENT_UPDATED',
      targetModel: 'Department',
      targetId: dept._id,
      department: dept._id,
      description: `Updated department ${dept.code}`,
    });

    const updated = await Department.findById(dept._id).populate('hod', 'name email');

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Department updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/departments/:id (Super Admin only)
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if users or projects exist in this department
    const userCount = await User.countDocuments({ department: dept._id });
    const projectCount = await Project.countDocuments({ department: dept._id });

    if (userCount > 0 || projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. There are ${userCount} active users and ${projectCount} projects assigned. Deactivate the department instead.`,
      });
    }

    await dept.deleteOne();

    await logAudit({
      req,
      action: 'DEPARTMENT_DELETED',
      targetModel: 'Department',
      targetId: dept._id,
      description: `Deleted department ${dept.name} (${dept.code})`,
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

