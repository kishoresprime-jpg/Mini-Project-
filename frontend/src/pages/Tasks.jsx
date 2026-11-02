import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge, PriorityBadge, RiskBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const Tasks = () => {
  const { user, isAtLeastRole } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assigneeCandidates, setAssigneeCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(queryParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState(queryParams.get('delayRisk') || '');
  const [projectFilter, setProjectFilter] = useState(queryParams.get('project') || '');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: queryParams.get('project') || '',
    priority: 'Medium',
    deadline: '',
    estimatedHours: 8,
    requiredSkills: '',
    assignedTo: '',
    subtasksInput: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (riskFilter) params.delayRisk = riskFilter;
      if (projectFilter) params.project = projectFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
      ]);
      setProjects(projRes.data.data || []);
      setAssigneeCandidates(usersRes.data.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary task data:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAuxiliary();
  }, [statusFilter, priorityFilter, riskFilter, projectFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const skillsArray = formData.requiredSkills
        ? formData.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const subtasksArray = formData.subtasksInput
        ? formData.subtasksInput
            .split('\n')
            .map((st) => st.trim())
            .filter(Boolean)
            .map((title) => ({ title, isCompleted: false }))
        : [];

      await api.post('/tasks', {
        ...formData,
        requiredSkills: skillsArray,
        subtasks: subtasksArray,
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        project: '',
        priority: 'Medium',
        deadline: '',
        estimatedHours: 8,
        requiredSkills: '',
        assignedTo: '',
        subtasksInput: '',
      });
      fetchTasks();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">College Task Management Board</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Intelligent tracking, status state-machine transitions, and risk monitoring
          </p>
        </div>

        {isAtLeastRole('faculty') && (
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Create New Task
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
          >
            <option value="">All Delay-Risks</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          <Button onClick={fetchTasks} variant="secondary" size="sm">
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Task List / Table */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Loader message="Loading tasks from database..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks match your criteria"
            description="Adjust your filters or create a new task."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Task Title</th>
                  <th className="px-6 py-3.5">Project</th>
                  <th className="px-6 py-3.5">Assignee</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Deadline</th>
                  <th className="px-6 py-3.5">Delay-Risk Radar</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => {
                  const isOverdue =
                    task.deadline &&
                    new Date(task.deadline) < new Date() &&
                    !['Completed', 'Approved'].includes(task.status);

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        {task.subtasks?.length > 0 && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {task.subtasks.filter((s) => s.isCompleted).length} /{' '}
                            {task.subtasks.length} subtasks completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {task.project?.code || task.project?.title || 'Department'}
                      </td>
                      <td className="px-6 py-4">
                        {task.assignedTo ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {task.assignedTo.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block capitalize">
                              {task.assignedTo.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`font-medium ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-semibold uppercase">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge
                          level={task.delayRisk?.level || 'Low'}
                          score={task.delayRisk?.score}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. Prepare NBA Course Outcome Assessment Sheets"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Project *
              </label>
              <select
                required
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.code} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Target Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min={1}
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Direct Assignee (Optional)
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Leave Unassigned (Use AI Matcher)</option>
                {assigneeCandidates.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role} - {u.department?.code || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Required Skills (Comma separated)
              </label>
              <input
                type="text"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                placeholder="Python, React, Documentation, Lab Safety..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="Detailed guidelines and expected output..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Subtasks / Checklist (One per line)
            </label>
            <textarea
              rows={3}
              value={formData.subtasksInput}
              onChange={(e) => setFormData({ ...formData, subtasksInput: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="Step 1: Gather raw records&#10;Step 2: Prepare comparative report&#10;Step 3: Verification check"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

