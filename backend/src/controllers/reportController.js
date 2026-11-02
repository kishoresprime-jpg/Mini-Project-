const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Department = require('../models/Department');

// GET /api/reports/summary
const getReportSummary = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter.department = req.user.department?._id || req.user.department;
    }

    const [tasks, projects, users] = await Promise.all([
      Task.find(filter)
        .populate('project', 'title code')
        .populate('department', 'name code')
        .populate('assignedTo', 'name email role')
        .sort({ deadline: 1 }),
      Project.find(filter)
        .populate('department', 'name code')
        .populate('projectManager', 'name email'),
      User.find(filter.department ? { department: filter.department } : {})
        .populate('department', 'name code')
        .select('name email role designation completedTasksCount'),
    ]);

    const taskStatusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'Submitted for Review': 0,
      Approved: 0,
      Rejected: 0,
      Completed: 0,
      Blocked: 0,
    };

    let overdueCount = 0;
    const now = new Date();

    tasks.forEach((t) => {
      if (taskStatusCounts[t.status] !== undefined) {
        taskStatusCounts[t.status] += 1;
      }
      if (t.deadline && new Date(t.deadline) < now && !['Completed', 'Approved'].includes(t.status)) {
        overdueCount += 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalTasks: tasks.length,
        taskStatusCounts,
        overdueCount,
        totalProjects: projects.length,
        totalUsers: users.length,
        tasks,
        projects,
        users,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/export-csv
const exportCsv = async (req, res) => {
  try {
    const { type = 'tasks' } = req.query; // 'tasks', 'projects', 'workload'
    const filter = {};

    if (req.user.role !== 'super_admin' && req.user.role !== 'principal') {
      filter.department = req.user.department?._id || req.user.department;
    }

    let csvContent = '';
    const dateStamp = new Date().toISOString().split('T')[0];

    if (type === 'tasks') {
      const tasks = await Task.find(filter)
        .populate('project', 'title code')
        .populate('department', 'name code')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name')
        .sort({ deadline: 1 });

      const headers = [
        'Task Title',
        'Project',
        'Department',
        'Assigned To',
        'Status',
        'Priority',
        'Progress (%)',
        'Deadline',
        'Delay Risk',
      ];
      const rows = tasks.map((t) => [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.project?.title || ''}"`,
        `"${t.department?.code || ''}"`,
        `"${t.assignedTo?.name || 'Unassigned'}"`,
        `"${t.status}"`,
        `"${t.priority}"`,
        t.progress || 0,
        t.deadline ? new Date(t.deadline).toLocaleDateString() : '',
        `"${t.delayRisk?.level || 'Low'}"`,
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tasks_report_${dateStamp}.csv"`);
      return res.status(200).send(csvContent);
    }

    if (type === 'projects') {
      const projects = await Project.find(filter)
        .populate('department', 'name code')
        .populate('projectManager', 'name email');

      const headers = ['Project Title', 'Code', 'Department', 'Project Manager', 'Status', 'Priority', 'Start Date', 'Target End Date', 'Progress (%)'];
      const rows = projects.map((p) => [
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${p.code}"`,
        `"${p.department?.name || ''}"`,
        `"${p.projectManager?.name || ''}"`,
        `"${p.status}"`,
        `"${p.priority}"`,
        p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
        p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString() : '',
        p.progressPercentage || 0,
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="projects_report_${dateStamp}.csv"`);
      return res.status(200).send(csvContent);
    }

    res.status(400).json({ success: false, message: 'Invalid report type specified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReportSummary,
  exportCsv,
};

