import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PriorityBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitBranch,
  Search,
} from 'lucide-react';

export const Projects = () => {
  const { user, isAtLeastRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    department: '',
    projectManager: '',
    workflow: '',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/projects', { params });
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [wfRes, deptRes, userRes] = await Promise.all([
        api.get('/workflows'),
        api.get('/departments'),
        api.get('/users?role=faculty'),
      ]);
      setWorkflows(wfRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setFacultyUsers(userRes.data.data || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchAuxiliaryData();
  }, [statusFilter]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await api.post('/projects', formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        code: '',
        description: '',
        department: '',
        projectManager: '',
        workflow: '',
        priority: 'medium',
        startDate: new Date().toISOString().split('T')[0],
        targetEndDate: '',
      });
      fetchProjects();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStage = async (projectId) => {
    try {
      const res = await api.post(`/projects/${projectId}/advance-stage`);
      alert(res.data.message);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not advance workflow stage.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">College Projects & Strategic Initiatives</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Institutional accreditation, academic programs, and departmental milestones
          </p>
        </div>

        {isAtLeastRole('faculty') && (
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            New Project
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>

          <Button onClick={fetchProjects} variant="secondary" size="sm">
            Search
          </Button>
        </div>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <Loader message="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first academic project or modify search parameters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const progress = p.liveProgressPercentage || 0;
            return (
              <Card key={p._id} className="flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                      {p.code}
                    </span>
                    <div className="flex items-center space-x-2">
                      <PriorityBadge priority={p.priority} />
                      <span className="text-[11px] font-semibold capitalize text-slate-500">
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 dark:text-slate-400">
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Stage pill */}
                  {p.currentStage && (
                    <div className="mt-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold dark:bg-primary-950/60 dark:text-primary-300">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Stage: {p.currentStage.title}</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Department</span>
                      <span className="font-medium">{p.department?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Project Manager</span>
                      <span className="font-medium">{p.projectManager?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Target End Date</span>
                      <span className="font-medium">
                        {p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Tasks Execution</span>
                      <span className="font-medium">
                        {p.completedTasks || 0} / {p.totalTasks || 0} Completed
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Workflow Progress</span>
                      <span className="text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 dark:border-slate-800">
                  <Link
                    to={`/tasks?project=${p._id}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    View Project Tasks &rarr;
                  </Link>

                  {isAtLeastRole('hod') && p.status !== 'completed' && (
                    <button
                      onClick={() => handleAdvanceStage(p._id)}
                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      Advance Stage &rarr;
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="e.g. NAAC Cycle-4 Documentation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Project Code (Unique) *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                placeholder="e.g. PRJ-2026-NAAC"
              />
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Workflow Template
              </label>
              <select
                value={formData.workflow}
                onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Default Institutional Workflow</option>
                {workflows.map((wf) => (
                  <option key={wf._id} value={wf._id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Project Manager
              </label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Assign Later (Self)</option>
                {facultyUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.designation || u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Target End Date *
              </label>
              <input
                type="date"
                required
                value={formData.targetEndDate}
                onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Description & Deliverables
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              placeholder="Outline project milestones, scope, and objectives..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

