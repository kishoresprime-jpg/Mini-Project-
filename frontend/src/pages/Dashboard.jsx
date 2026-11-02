import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { StatusBadge, PriorityBadge, RiskBadge, RoleBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Compiling real-time dashboard analytics..." />;
  }

  const role = user?.role;
  const overview = data?.overview || {};

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-2xl bg-gradient-to-r from-navy-900 via-slate-800 to-primary-950 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {user?.department?.name || 'Institution-Wide Control'}
            </span>
            <RoleBadge role={role} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Hierarchical workflow monitoring, intelligent task balancing, and real-time execution radar.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            to="/tasks"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-700 transition"
          >
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Open Task Board
          </Link>
          {['super_admin', 'principal', 'hod'].includes(role) && (
            <Link
              to="/approvals"
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approval Center
            </Link>
          )}
        </div>
      </div>

      {/* 1. SUPER ADMIN / PRINCIPAL DASHBOARD */}
      {(role === 'super_admin' || role === 'principal') && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Projects</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {overview.totalProjects || 0}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {overview.activeProjects || 0} active
                  </span>
                </div>
                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl dark:bg-primary-950 dark:text-primary-300">
                  <FolderKanban className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {overview.totalTasks || 0}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {overview.completedTasks || 0} completed
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Tasks</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {overview.overdueTasks || 0}
                  </h3>
                  <span className="text-[11px] text-amber-600 font-medium">Requires escalation</span>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950 dark:text-amber-300">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">High Delay-Risk</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {overview.highRiskTasks || 0}
                  </h3>
                  <span className="text-[11px] text-rose-600 font-medium">AI Flagged</span>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950 dark:text-rose-300">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Department Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card
              className="lg:col-span-2"
              title="Department Task Execution & Completion Rate"
              subtitle="Comparison of completed vs total tasks across college departments"
            >
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.departmentStats || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="departmentCode" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalTasks" fill="#94a3b8" name="Total Tasks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedTasks" fill="#10b981" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdueTasks" fill="#ef4444" name="Overdue Tasks" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Quick Actions & Recent Institutional Approvals */}
            <Card
              title="Pending Approvals"
              subtitle="Submissions awaiting institutional sign-off"
              action={
                <Link to="/approvals" className="text-xs font-medium text-primary-600 hover:underline">
                  View All
                </Link>
              }
            >
              <div className="space-y-3">
                {data?.recentApprovals?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No pending approval requests.</p>
                ) : (
                  data?.recentApprovals?.map((appr) => (
                    <div
                      key={appr._id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-navy-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {appr.task?.title || 'Project Submission'}
                        </span>
                        <StatusBadge status={appr.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Submitted by {appr.submittedBy?.name}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* 2. HOD DASHBOARD */}
      {role === 'hod' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary-500">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Department Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.deptTasks || 0}
              </h3>
              <span className="text-[11px] text-slate-500">{overview.completedTasks || 0} completed</span>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.pendingApprovals || 0}
              </h3>
              <Link to="/approvals" className="text-[11px] text-amber-600 hover:underline">
                Review submissions &rarr;
              </Link>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue / Delayed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.overdueTasks || 0}
              </h3>
              <span className="text-[11px] text-rose-600 font-medium">{overview.highRiskTasks || 0} at high risk</span>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Faculty & Staff</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {(overview.facultyCount || 0) + (overview.staffCount || 0)}
              </h3>
              <Link to="/workload" className="text-[11px] text-teal-600 hover:underline">
                View workload balance &rarr;
              </Link>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Faculty & Staff Workload Allocation"
              subtitle="Number of active tasks currently assigned per person"
            >
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.facultyWorkload || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" stroke="#888888" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="activeTasks" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Active Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Department Task Pipeline"
              subtitle="Upcoming tasks and deliverables"
              action={
                <Link to="/tasks" className="text-xs font-medium text-primary-600 hover:underline">
                  View Board
                </Link>
              }
            >
              <div className="space-y-3">
                {data?.recentTasks?.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Assigned to: {task.assignedTo?.name || 'Unassigned'} &bull; Due: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* 3. FACULTY / STAFF DASHBOARD */}
      {(role === 'faculty' || role === 'staff') && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary-500">
              <p className="text-xs font-medium text-slate-500">My Assigned Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.myTasks || 0}
              </h3>
              <span className="text-[11px] text-primary-600">{overview.inProgressTasks || 0} currently in progress</span>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-medium text-slate-500">Completed Work</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.completedTasks || 0}
              </h3>
              <span className="text-[11px] text-emerald-600">Successfully verified</span>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-slate-500">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.pendingApprovals || 0}
              </h3>
              <span className="text-[11px] text-amber-600">Awaiting HOD verification</span>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <p className="text-xs font-medium text-slate-500">Overdue Items</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.overdueTasks || 0}
              </h3>
              <span className="text-[11px] text-rose-600">Require immediate action</span>
            </Card>
          </div>

          <Card
            title="My Active Tasks & Milestones"
            subtitle="Prioritized assignments sorted by target deadline"
            action={
              <Link to="/tasks?assignedTo=me" className="text-xs font-medium text-primary-600 hover:underline">
                View All My Tasks
              </Link>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.upcomingTasks?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No active tasks assigned to you.</p>
              ) : (
                data?.upcomingTasks?.map((task) => (
                  <div key={task._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <Link
                        to={`/tasks/${task._id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-primary-600 dark:text-white"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                        <span>Project: {task.project?.title || 'Department'}</span>
                        <span>&bull;</span>
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      {/* 4. STUDENT DASHBOARD */}
      {role === 'student' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary-500">
              <p className="text-xs font-medium text-slate-500">My Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.myTasks || 0}
              </h3>
              <span className="text-[11px] text-primary-600">{overview.pendingTasks || 0} pending</span>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.completedTasks || 0}
              </h3>
              <span className="text-[11px] text-emerald-600">Milestones achieved</span>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <p className="text-xs font-medium text-slate-500">Completion Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.completionRate || 0}%
              </h3>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 dark:bg-slate-800">
                <div
                  className="bg-teal-500 h-1.5 rounded-full"
                  style={{ width: `${overview.completionRate || 0}%` }}
                ></div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <p className="text-xs font-medium text-slate-500">Overdue Items</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {overview.overdueTasks || 0}
              </h3>
              <span className="text-[11px] text-rose-600 font-medium">Requires submission</span>
            </Card>
          </div>

          <Card
            title="My Tasks & Deliverables"
            subtitle="Click on any task to view subtasks, attach documents, and submit for faculty review"
          >
            <div className="space-y-3">
              {data?.upcomingTasks?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No tasks currently assigned.</p>
              ) : (
                data?.upcomingTasks?.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-primary-400 bg-white hover:bg-slate-50/50 dark:border-slate-800 dark:bg-navy-900 dark:hover:border-primary-700 transition"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Project: {task.project?.title} &bull; Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

