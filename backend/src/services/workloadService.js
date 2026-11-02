const User = require('../models/User');
const Task = require('../models/Task');
const Department = require('../models/Department');

const PRIORITY_WEIGHTS = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 5,
};

/**
 * Computes workload statistics for a specific department or across the entire institution.
 */
const getWorkloadAnalytics = async ({ departmentId = null }) => {
  const userFilter = { isActive: true };
  if (departmentId) {
    userFilter.department = departmentId;
  }

  const users = await User.find(userFilter)
    .select('name email role designation department skills completedTasksCount')
    .populate('department', 'name code')
    .lean();

  const userIds = users.map((u) => u._id);

  // Fetch active tasks for these users
  const activeTasks = await Task.find({
    assignedTo: { $in: userIds },
    status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
  })
    .select('title priority deadline progress estimatedHours actualHours assignedTo department status')
    .lean();

  const now = new Date();

  // Aggregate per user
  const userStats = users.map((u) => {
    const tasks = activeTasks.filter(
      (t) => t.assignedTo && t.assignedTo.toString() === u._id.toString()
    );

    let weightedScore = 0;
    let totalEstimatedHours = 0;
    let overdueCount = 0;
    let highOrCriticalCount = 0;

    tasks.forEach((t) => {
      const weight = PRIORITY_WEIGHTS[t.priority] || 2;
      weightedScore += weight;
      totalEstimatedHours += t.estimatedHours || 8;
      if (t.deadline && new Date(t.deadline) < now) {
        overdueCount += 1;
      }
      if (t.priority === 'High' || t.priority === 'Critical') {
        highOrCriticalCount += 1;
      }
    });

    // Capacity status
    let status = 'Optimal';
    if (weightedScore >= 14 || tasks.length >= 7) {
      status = 'Overloaded';
    } else if (weightedScore >= 9 || tasks.length >= 4) {
      status = 'High Load';
    } else if (weightedScore <= 3 && tasks.length <= 1) {
      status = 'Available / Low';
    }

    return {
      userId: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation,
      department: u.department,
      skills: u.skills || [],
      activeTaskCount: tasks.length,
      weightedScore,
      totalEstimatedHours,
      overdueCount,
      highOrCriticalCount,
      completedTasksCount: u.completedTasksCount || 0,
      workloadStatus: status,
      tasks: tasks.map((t) => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        deadline: t.deadline,
        status: t.status,
      })),
    };
  });

  // Sort by highest weighted workload score
  userStats.sort((a, b) => b.weightedScore - a.weightedScore);

  // Overloaded users list
  const overloadedUsers = userStats.filter((u) => u.workloadStatus === 'Overloaded');
  const availableUsers = userStats.filter((u) => u.workloadStatus === 'Available / Low');

  // Department level summary
  const departmentWorkloadSummary = await Task.aggregate([
    {
      $match: {
        status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
      },
    },
    {
      $group: {
        _id: '$department',
        activeTaskCount: { $sum: 1 },
        totalEstimatedHours: { $sum: '$estimatedHours' },
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
        departmentId: '$_id',
        departmentName: '$dept.name',
        departmentCode: '$dept.code',
        activeTaskCount: 1,
        totalEstimatedHours: 1,
      },
    },
  ]);

  return {
    userWorkloads: userStats,
    overloadedCount: overloadedUsers.length,
    availableCount: availableUsers.length,
    overloadedUsers,
    availableUsers,
    departmentWorkloadSummary,
  };
};

module.exports = {
  getWorkloadAnalytics,
  PRIORITY_WEIGHTS,
};

