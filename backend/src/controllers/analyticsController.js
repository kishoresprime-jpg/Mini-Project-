const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Department = require('../models/Department');
const Approval = require('../models/Approval');

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const deptId = req.user.department?._id || req.user.department;
    const now = new Date();

    if (role === 'super_admin' || role === 'principal') {
      // Institution-wide metrics
      const [
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        highRiskTasks,
        departments,
        recentProjects,
        recentApprovals,
      ] = await Promise.all([
        Project.countDocuments(),
        Project.countDocuments({ status: 'active' }),
        Project.countDocuments({ status: 'completed' }),
        Task.countDocuments(),
        Task.countDocuments({ status: { $in: ['Completed', 'Approved'] } }),
        Task.countDocuments({ status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] } }),
        Task.countDocuments({
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          deadline: { $lt: now },
        }),
        Task.countDocuments({ 'delayRisk.level': 'High' }),
        Department.find({ isActive: true }).select('name code'),
        Project.find().populate('department', 'name code').populate('projectManager', 'name').sort({ createdAt: -1 }).limit(5),
        Approval.find({ status: 'Pending' }).populate('submittedBy', 'name').populate('task', 'title').limit(5),
      ]);

      // Department performance aggregation
      const departmentStats = await Task.aggregate([
        {
          $group: {
            _id: '$department',
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $in: ['$status', ['Completed', 'Approved']] }, 1, 0] },
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['To Do', 'In Progress', 'Submitted for Review', 'Blocked']] },
                      { $lt: ['$deadline', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: '$dept' },
        {
          $project: {
            departmentName: '$dept.name',
            departmentCode: '$dept.code',
            totalTasks: 1,
            completedTasks: 1,
            overdueTasks: 1,
            completionRate: {
              $cond: [
                { $gt: ['$totalTasks', 0] },
                { $round: [{ $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }, 0] },
                0,
              ],
            },
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        role,
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          highRiskTasks,
        },
        departmentStats,
        recentProjects,
        recentApprovals,
      });
    }

    if (role === 'hod') {
      // Department-level metrics
      const [
        deptProjects,
        deptTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        highRiskTasks,
        pendingApprovals,
        facultyCount,
        staffCount,
        recentTasks,
      ] = await Promise.all([
        Project.countDocuments({ department: deptId }),
        Task.countDocuments({ department: deptId }),
        Task.countDocuments({ department: deptId, status: { $in: ['Completed', 'Approved'] } }),
        Task.countDocuments({
          department: deptId,
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
        }),
        Task.countDocuments({
          department: deptId,
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          deadline: { $lt: now },
        }),
        Task.countDocuments({ department: deptId, 'delayRisk.level': 'High' }),
        Approval.countDocuments({ department: deptId, status: 'Pending' }),
        User.countDocuments({ department: deptId, role: 'faculty', isActive: true }),
        User.countDocuments({ department: deptId, role: 'staff', isActive: true }),
        Task.find({ department: deptId })
          .populate('assignedTo', 'name email')
          .populate('project', 'title')
          .sort({ deadline: 1 })
          .limit(6),
      ]);

      // Faculty workload breakdown
      const facultyWorkload = await User.find({ department: deptId, role: { $in: ['faculty', 'staff'] }, isActive: true })
        .select('name role designation')
        .lean();

      const enrichedWorkload = await Promise.all(
        facultyWorkload.map(async (f) => {
          const activeTasksCount = await Task.countDocuments({
            assignedTo: f._id,
            status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          });
          return {
            name: f.name,
            role: f.role,
            designation: f.designation,
            activeTasks: activeTasksCount,
          };
        })
      );

      return res.status(200).json({
        success: true,
        role,
        overview: {
          deptProjects,
          deptTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          highRiskTasks,
          pendingApprovals,
          facultyCount,
          staffCount,
        },
        facultyWorkload: enrichedWorkload,
        recentTasks,
      });
    }

    if (role === 'faculty' || role === 'staff') {
      // Individual Staff / Faculty metrics
      const [
        myTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        pendingApprovals,
        upcomingTasks,
      ] = await Promise.all([
        Task.countDocuments({ assignedTo: userId }),
        Task.countDocuments({ assignedTo: userId, status: { $in: ['Completed', 'Approved'] } }),
        Task.countDocuments({ assignedTo: userId, status: 'In Progress' }),
        Task.countDocuments({
          assignedTo: userId,
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          deadline: { $lt: now },
        }),
        Approval.countDocuments({ submittedBy: userId, status: 'Pending' }),
        Task.find({
          assignedTo: userId,
          status: { $in: ['To Do', 'In Progress', 'Blocked'] },
        })
          .populate('project', 'title code')
          .sort({ deadline: 1 })
          .limit(8),
      ]);

      return res.status(200).json({
        success: true,
        role,
        overview: {
          myTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          pendingApprovals,
        },
        upcomingTasks,
      });
    }

    if (role === 'student') {
      // Student-specific metrics
      const [
        myTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        upcomingTasks,
      ] = await Promise.all([
        Task.countDocuments({ assignedTo: userId }),
        Task.countDocuments({ assignedTo: userId, status: { $in: ['Completed', 'Approved'] } }),
        Task.countDocuments({
          assignedTo: userId,
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
        }),
        Task.countDocuments({
          assignedTo: userId,
          status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
          deadline: { $lt: now },
        }),
        Task.find({ assignedTo: userId })
          .populate('project', 'title code')
          .sort({ deadline: 1 })
          .limit(8),
      ]);

      const completionRate = myTasks > 0 ? Math.round((completedTasks / myTasks) * 100) : 0;

      return res.status(200).json({
        success: true,
        role,
        overview: {
          myTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate,
        },
        upcomingTasks,
      });
    }

    res.status(400).json({ success: false, message: 'Unrecognized user role.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};

